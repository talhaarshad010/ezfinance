import { useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import { useAppDispatch } from '../../../store/hooks';
import { setProfile } from '../../../store/slices/userSlice';
import { useUserMode } from '../../../context/UserModeContext';
import { ApiError, signInWithGoogle } from '../../../services/authService';
import { authErrorMessage, useAuthGuard } from './AuthGuard';
import { MSG } from './authMessages';

/**
 * "Continue with Google", shared by Welcome and the sign-up email step (for an email that is
 * already linked to Google). Errors go to `onError` so each screen shows them in its own notice.
 */
export function useGoogleSignIn(onError: (message: string | null) => void) {
  const dispatch = useAppDispatch();
  const { beginNewUser } = useUserMode();
  const { showToast } = useToast();
  const guard = useAuthGuard();
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    if (busy || guard.blocked) return;
    onError(null);
    setBusy(true);
    try {
      const result = await signInWithGoogle();
      if (!result) return; // closing the Google sheet is not an error, so nothing is shown
      // Real accounts never see sample data; the tour shows until it's been completed once.
      beginNewUser({ tour: !result.profile.tourCompleted });
      dispatch(setProfile(result.profile));
      showToast(result.isNewUser ? 'Welcome to EZFinance!' : 'Signed in with Google!', 'success');
    } catch (e) {
      const err = e as ApiError;
      const msg = err.code === 'google_failed' ? MSG.googleFail : authErrorMessage(err, guard);
      if (msg) onError(msg);
    } finally {
      setBusy(false);
    }
  };

  return { signIn, busy };
}
