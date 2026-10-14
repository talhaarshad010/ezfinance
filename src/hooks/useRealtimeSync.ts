import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { API_BASE_URL } from '../api/config';
import { getAccessToken } from '../api/client';

const MAX_RETRY_MS = 30000;

/**
 * Live sync across devices through the backend (never Supabase directly): keeps a WebSocket open
 * to `/api/sync`, and the API sends `{ type: 'changed', tables }` after any save to this user's
 * data, from any device. Each notice (and each reconnect, which may have missed some) reloads.
 * The server closes the socket when the access token expires; reconnecting fetches a fresh one.
 */
export function useRealtimeSync(reloadTxs: () => Promise<void>, enabled: boolean = true) {
  const reloadRef = useRef(reloadTxs);
  reloadRef.current = reloadTxs;

  useEffect(() => {
    if (!enabled || !API_BASE_URL) return;

    let socket: WebSocket | null = null;
    let stopped = false;
    let attempt = 0;
    let everOpened = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const reload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        reloadRef.current().catch(() => {});
      }, 250);
    };

    const scheduleReconnect = () => {
      if (stopped) return;
      const delay = Math.min(MAX_RETRY_MS, 1000 * 2 ** attempt);
      attempt++;
      retryTimer = setTimeout(connect, delay);
    };

    async function connect() {
      if (stopped || socket) return;
      let token: string;
      try {
        token = await getAccessToken();
      } catch {
        scheduleReconnect(); // offline, or signed out
        return;
      }
      if (stopped || socket) return;

      const ws = new WebSocket(`${API_BASE_URL.replace(/^http/, 'ws')}/api/sync`, undefined, {
        headers: { Authorization: `Bearer ${token}` },
      });
      socket = ws;
      ws.onopen = () => {
        attempt = 0;
        if (everOpened) reload(); // catch up on anything missed while disconnected
        everOpened = true;
      };
      ws.onmessage = event => {
        try {
          const msg = JSON.parse(String(event.data));
          if (msg?.type === 'changed') {
            if (__DEV__) console.log('[Sync] changed:', msg.tables);
            reload();
          }
        } catch {
          // ignore anything that isn't a sync notice
        }
      };
      ws.onclose = () => {
        if (socket === ws) socket = null;
        scheduleReconnect();
      };
    }

    // Phones drop sockets in the background: reconnect straight away when the app is back.
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active' && !socket) {
        if (retryTimer) clearTimeout(retryTimer);
        attempt = 0;
        connect();
      }
    });

    connect();

    return () => {
      stopped = true;
      appState.remove();
      if (retryTimer) clearTimeout(retryTimer);
      if (debounceTimer) clearTimeout(debounceTimer);
      socket?.close();
      socket = null;
    };
  }, [enabled]);
}
