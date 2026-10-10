import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from './ThemeContext';
import { useToast } from './ToastContext';
import { useUserMode } from './UserModeContext';
import { ApiError } from '../api/client';
import { transactionsApi } from '../api/transactionsApi';
import type { CreateTransactionRequest, SplitPartRequest, TransactionFieldsRequest } from '../api/types';

/**
 * Connectivity + offline sync queue — the single place offline changes are
 * recorded and replayed.
 *
 * Rules
 * - Only a new user's real data is queued (sample data of a returning demo user is local only).
 * - Changes made while offline are queued; online saves go straight through, and are queued
 *   only when the server can't be reached (`force`).
 * - What the user sees is local state, so totals already include pending items.
 * - Conflicts: last change wins. Undo of a queued delete just drops the delete.
 * Transactions sync to the API; goals, budget and holdings are still local (mock push).
 */

export type SyncEntity = 'tx' | 'goal' | 'budget' | 'holding';
export type SyncAction = 'create' | 'update' | 'delete' | 'restore' | 'split';
export interface SyncOp {
  id: string;
  entity: SyncEntity;
  entityId: string | number;
  action: SyncAction;
  label: string;
  payload?: unknown;
  at: number;
  status: 'pending' | 'failed';
}

interface NetworkCtx {
  online: boolean;
  syncing: boolean;
  queue: SyncOp[];
  /**
   * Records a change if it needs syncing (offline, or `force` when an online save couldn't reach
   * the server). Returns the op id (or null when nothing was queued).
   */
  record: (op: Omit<SyncOp, 'id' | 'at' | 'status'>, options?: { force?: boolean }) => string | null;
  /** Drop a queued op (used by Undo). */
  remove: (opId: string) => void;
  statusOf: (entity: SyncEntity, entityId: string | number) => SyncOp['status'] | undefined;
  syncNow: () => void;
}

const Ctx = createContext<NetworkCtx | null>(null);

const PROBE_URL = 'https://clients3.google.com/generate_204';
const PROBE_TIMEOUT_MS = 4000;
const POLL_MS = 15000;
const RECHECK_MS = 3000;
const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

async function probe(): Promise<boolean> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    await fetch(`${PROBE_URL}?t=${Date.now()}`, { method: 'HEAD', signal: ctrl.signal });
    return true;
  } catch {
    return false;
  } finally {
    if (t) clearTimeout(t);
  }
}

const RETRY_MS = 10000;

/** Sends one queued change to the server. Transactions use the API; other entities are still local. */
async function pushOne(op: SyncOp) {
  if (op.entity !== 'tx') {
    await wait(120);
    return;
  }
  const id = String(op.entityId);
  switch (op.action) {
    case 'create':
      await transactionsApi.create(op.payload as CreateTransactionRequest);
      return;
    case 'update':
      await transactionsApi.update(id, op.payload as TransactionFieldsRequest);
      return;
    case 'delete':
      try {
        await transactionsApi.remove(id);
      } catch (error) {
        // Already gone on the server: nothing left to do.
        if (!(error instanceof ApiError && error.status === 404)) throw error;
      }
      return;
    case 'restore':
      await transactionsApi.restore(id);
      return;
    case 'split':
      await transactionsApi.split(id, (op.payload as { parts: SplitPartRequest[] }).parts);
      return;
  }
}

/** The server turned the change down (bad data, not found): retrying won't help. */
const isPermanent = (error: unknown) =>
  error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 401 && error.status !== 429;

/**
 * Real connectivity, without a native dependency: a tiny reachability request on
 * launch, whenever the app comes to the foreground, and every 15s while it's open.
 * Going offline needs two failures in a row, so a flaky request doesn't flash the banner.
 */
function useConnectivity() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = AppState.currentState === 'active';

    async function check() {
      if (timer) clearTimeout(timer);
      if (!alive || !active) return;
      let ok = await probe();
      if (!ok && alive) {
        await wait(RECHECK_MS);
        ok = await probe();
      }
      if (!alive) return;
      setOnline(ok);
      timer = setTimeout(check, POLL_MS);
    }

    check();
    const sub = AppState.addEventListener('change', s => {
      active = s === 'active';
      if (active) check();
      else if (timer) clearTimeout(timer);
    });
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      sub.remove();
    };
  }, []);
  return online;
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const { isNewUser } = useUserMode();
  const { showToast } = useToast();
  const online = useConnectivity();
  const [queue, setQueue] = useState<SyncOp[]>([]);
  const [syncing, setSyncing] = useState(false);
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const busy = useRef(false);

  const runSync = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setSyncing(true);
    await wait(700); // brief "Syncing…" so reconnecting is visible
    let synced = 0;
    let failed = 0;
    for (const id of queueRef.current.map(o => o.id)) {
      const op = queueRef.current.find(o => o.id === id);
      if (!op) continue; // undone while syncing
      try {
        await pushOne(op);
        synced++;
        setQueue(q => q.filter(o => o.id !== id));
      } catch (error) {
        failed++;
        if (isPermanent(error)) {
          // Rejected by the server: drop it so it doesn't block the rest of the queue.
          setQueue(q => q.filter(o => o.id !== id));
        } else {
          setQueue(q => q.map(o => (o.id === id ? { ...o, status: 'failed' } : o)));
        }
      }
    }
    setSyncing(false);
    busy.current = false;
    // One toast per sync run — never one per item.
    if (failed) showToast("Some changes didn't sync. Try again.", 'error');
    else if (synced) showToast(synced > 1 ? `${synced} changes synced` : 'All synced', 'success');
  }, [showToast]);

  // Reconnect → sync in the background.
  const wasOnline = useRef(online);
  useEffect(() => {
    if (online && !wasOnline.current) runSync();
    wasOnline.current = online;
  }, [online, runSync]);

  // Changes queued while online (the server couldn't be reached) are retried every few seconds.
  useEffect(() => {
    if (!online || syncing || !queue.length) return;
    const t = setTimeout(runSync, RETRY_MS);
    return () => clearTimeout(t);
  }, [online, syncing, queue, runSync]);

  // A different account never inherits another account's queue.
  useEffect(() => {
    setQueue([]);
  }, [isNewUser]);

  const value = useMemo<NetworkCtx>(
    () => ({
      online,
      syncing,
      queue,
      record: (op, options) => {
        if (!isNewUser || (online && !options?.force)) return null;
        const id = `${op.entity}:${op.entityId}:${Date.now()}`;
        setQueue(q => {
          const same = (o: SyncOp) => o.entity === op.entity && o.entityId === op.entityId;
          const created = q.find(o => same(o) && o.action === 'create');
          // An edit of a not-yet-synced create folds into it (last change wins).
          if (op.action === 'update' && created) {
            const payload =
              op.entity === 'tx'
                ? { ...(created.payload as object), ...(op.payload as object) }
                : op.payload;
            return q.map(o => (o === created ? { ...o, payload, label: op.label, status: 'pending' } : o));
          }
          // Undo of a delete that hasn't been sent: just forget the delete.
          const deleted = q.find(o => same(o) && o.action === 'delete');
          if (op.action === 'restore' && deleted) {
            return q.filter(o => o !== deleted);
          }
          return [...q, { ...op, id, at: Date.now(), status: 'pending' }];
        });
        return id;
      },
      remove: opId => setQueue(q => q.filter(o => o.id !== opId)),
      statusOf: (entity, entityId) => {
        const ops = queue.filter(o => o.entity === entity && o.entityId === entityId);
        if (!ops.length) return undefined;
        return ops.some(o => o.status === 'failed') ? 'failed' : 'pending';
      },
      syncNow: () => {
        if (online) runSync();
      },
    }),
    [online, syncing, queue, isNewUser, runSync],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNetwork() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useNetwork must be used inside NetworkProvider');
  return c;
}

/** "Pending sync" / "Couldn't sync. Retry" badge — icon + text, never colour alone. */
export function PendingBadge({ entity, id }: { entity: SyncEntity; id: string | number }) {
  const { theme } = useTheme();
  const { statusOf, syncNow, online } = useNetwork();
  const s = statusOf(entity, id);
  if (!s) return null;
  if (s === 'failed') {
    return (
      <TouchableOpacity
        onPress={syncNow}
        disabled={!online}
        accessibilityRole="button"
        accessibilityLabel="Couldn't sync. Retry"
        style={[badge.base, { backgroundColor: theme.MODAL }]}
      >
        <Feather name="rotate-ccw" size={10} color={theme.RED} />
        <Text style={[badge.text, { color: theme.RED }]}>Couldn't sync. Retry</Text>
      </TouchableOpacity>
    );
  }
  return (
    <View style={[badge.base, { backgroundColor: theme.MODAL }]}>
      <Feather name="clock" size={10} color={theme.MUTED} />
      <Text style={[badge.text, { color: theme.MUTED }]}>Pending sync</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  text: { fontSize: 10, fontWeight: '600' },
});
