import { useEffect, useRef } from 'react';
import { supabase } from '../api/supabaseClient';
import { getStoredAuth } from '../api/sessionStore';

/**
 * Subscribes to Supabase Realtime WebSocket changes for the logged-in user.
 * Whenever a row in transactions, bank_accounts, transfers, recurring_bills,
 * loans, or goals changes on any device or backend, this hook automatically
 * calls reloadTxs to seamlessly synchronize the screen in real time.
 */
export function useRealtimeSync(reloadTxs: () => Promise<void>, enabled: boolean = true) {
  const reloadRef = useRef(reloadTxs);
  reloadRef.current = reloadTxs;

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerReload = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      reloadRef.current().catch(() => {});
    }, 250);
  };

  useEffect(() => {
    if (!enabled) return;

    const auth = getStoredAuth();
    const userId = auth?.session?.user?.id;
    const token = auth?.session?.accessToken;

    if (!userId) return;

    if (token) {
      supabase.realtime.setAuth(token);
    }

    const channelName = `realtime-user-${userId}`;
    const channel = supabase.channel(channelName);

    const tables = ['transactions', 'bank_accounts', 'transfers', 'recurring_bills', 'loans', 'goals'];

    tables.forEach(tableName => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          if (__DEV__) {
            console.log(`[Realtime] Received ${payload.eventType} on ${tableName}:`, payload);
          }
          triggerReload();
        },
      );
    });

    channel.subscribe(status => {
      if (__DEV__) {
        console.log(`[Realtime] Channel status for user ${userId}:`, status);
      }
    });

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      supabase.removeChannel(channel);
    };
  }, [enabled]);
}
