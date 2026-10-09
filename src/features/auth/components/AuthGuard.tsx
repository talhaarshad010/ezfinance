import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNetwork } from '../../../context/NetworkContext';
import { ApiError } from '../../../api/client';
import { MSG } from './authMessages';

/**
 * Shared state for the auth screens: whether the device is offline, and a short lockout after
 * repeated failed attempts (5 wrong passwords, or the server saying "too many requests").
 * The server enforces its own limits too; this keeps the UI honest about them.
 */
const LOCK_MS = 5 * 60 * 1000;
const MAX_FAILURES = 5;

interface AuthGuardCtx {
  offline: boolean;
  /** Seconds left in the lockout, 0 when not locked. */
  lockedSeconds: number;
  /** True when network actions should be blocked (offline or locked). */
  blocked: boolean;
  lock: () => void;
  registerFailure: () => void;
  resetFailures: () => void;
}

const Ctx = createContext<AuthGuardCtx | null>(null);

export function useAuthGuard() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuthGuard must be used inside AuthGuardProvider');
  return v;
}

export function AuthGuardProvider({ children }: { children: ReactNode }) {
  const { online } = useNetwork();
  const [lockUntil, setLockUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const failures = useRef(0);

  // Tick once a second while locked so the countdown stays live.
  useEffect(() => {
    if (lockUntil <= Date.now()) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lockUntil]);

  const lock = useCallback(() => {
    failures.current = 0;
    setNow(Date.now());
    setLockUntil(Date.now() + LOCK_MS);
  }, []);

  const registerFailure = useCallback(() => {
    failures.current += 1;
    if (failures.current >= MAX_FAILURES) lock();
  }, [lock]);

  const resetFailures = useCallback(() => {
    failures.current = 0;
  }, []);

  const lockedSeconds = Math.max(0, Math.ceil((lockUntil - now) / 1000));
  const offline = !online;

  const value = useMemo<AuthGuardCtx>(
    () => ({ offline, lockedSeconds, blocked: offline || lockedSeconds > 0, lock, registerFailure, resetFailures }),
    [offline, lockedSeconds, lock, registerFailure, resetFailures],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Message for a failed auth request. A "too many requests" reply starts the lockout (shown by
 * AuthBanners), so it returns null for that case.
 */
export function authErrorMessage(error: unknown, guard: Pick<AuthGuardCtx, 'lock'>): string | null {
  const e = error as ApiError;
  if (e?.status === 429) {
    guard.lock();
    return null;
  }
  return e?.message || MSG.generic;
}
