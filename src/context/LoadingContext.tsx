import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useUserMode } from './UserModeContext';

/**
 * Section-level loading: skeleton → data, or an error with "Try again".
 *
 * Each key (a screen, a sub-tab or a single card) loads once per session, so
 * coming back to a screen is instant. Keys are section-level, so one failed card
 * never takes down the rest of the screen.
 *
 * Signed-in users: the default loader is the real load of their transactions from the
 * server (shared by every section), so each skeleton stays until the data is there, and a
 * failed load shows the error state. Once the transactions are in, sections open straight
 * to their content. The Explore demo's sample data is already in the app, so it opens straight
 * away (no skeleton). Pass `loader` to load something else.
 */

export type LoadStatus = 'loading' | 'error' | 'ready';

const noLoad = () => Promise.resolve();

interface LoadingCtx {
  status: (key: string) => LoadStatus | undefined;
  settle: (key: string, ok: boolean) => void;
  forget: (key: string) => void;
}

const Ctx = createContext<LoadingCtx | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const { isNewUser } = useUserMode();
  const [state, setState] = useState<Record<string, 'error' | 'ready'>>({});

  // Switching between a new and a returning account loads everything again.
  useEffect(() => {
    setState({});
  }, [isNewUser]);

  // Stable callbacks, so one section settling never restarts another section's loader.
  const settle = useCallback(
    (key: string, ok: boolean) => setState(s => ({ ...s, [key]: ok ? 'ready' : 'error' })),
    [],
  );
  const forget = useCallback(
    (key: string) =>
      setState(s => {
        const n = { ...s };
        delete n[key];
        return n;
      }),
    [],
  );
  const value = useMemo<LoadingCtx>(
    () => ({ status: key => state[key], settle, forget }),
    [state, settle, forget],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Skeleton → error | data for one section. `retry` shows the skeleton again and re-runs the loader.
 */
export function useLoadState(key: string, loader?: () => Promise<unknown>) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLoadState must be used inside LoadingProvider');
  const { isNewUser, loadTxs, txStatus } = useUserMode();
  const fullKey = `${isNewUser ? 'new' : 'returning'}:${key}`;
  const settled = ctx.status(fullKey);
  // Data already there (a signed-in user's, once loaded, or Explore's sample): no skeleton,
  // not even for a frame.
  const dataReady = !loader && (!isNewUser || txStatus === 'ready');
  const status: LoadStatus = settled ?? (dataReady ? 'ready' : 'loading');

  const loaderRef = useRef(loader ?? (isNewUser ? loadTxs : noLoad));
  loaderRef.current = loader ?? (isNewUser ? loadTxs : noLoad);
  const { settle, forget } = ctx;

  useEffect(() => {
    if (!settled && dataReady) settle(fullKey, true);
  }, [settled, dataReady, settle, fullKey]);

  useEffect(() => {
    if (status !== 'loading') return;
    let alive = true;
    loaderRef
      .current()
      .then(() => alive && settle(fullKey, true))
      .catch(() => alive && settle(fullKey, false));
    return () => {
      alive = false;
    };
  }, [fullKey, status, settle]);

  const retry = useCallback(() => forget(fullKey), [forget, fullKey]);
  return { status, retry };
}
