import React, { ReactNode } from 'react';
import { useLoadState } from '../context/LoadingContext';
import { ScreenError } from './Feedback';

/** Screen-level gate: skeleton first, then the real screen (or empty state), or an error with retry. */
export function LoadGate({
  id,
  skeleton,
  loader,
  children,
}: {
  id: string;
  skeleton: ReactNode;
  /** Real fetch for this screen (defaults to the mock-phase delay). */
  loader?: () => Promise<unknown>;
  children: ReactNode;
}) {
  const { status, retry } = useLoadState(id, loader);
  if (status === 'loading') return <>{skeleton}</>;
  if (status === 'error') return <ScreenError onRetry={retry} />;
  return <>{children}</>;
}

export default LoadGate;
