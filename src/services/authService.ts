import { DeviceEventEmitter } from 'react-native';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { authApi } from '../api/authApi';
import { ApiError, onSessionExpired } from '../api/client';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '../api/config';
import { profileApi } from '../api/profileApi';
import { setLastSignInMethod, SignInMethod } from '../api/lastSignIn';
import {
  clearStoredAuth,
  getStoredAuth,
  holdAuth,
  loadStoredAuth,
  persistHeldAuth,
  saveStoredAuth,
  startSession,
} from '../api/sessionStore';
import type { ApiProfile, AuthSession, FilerCode, IncomeCode, ProvinceCode } from '../api/types';
import type { UserProfile } from '../store/slices/userSlice';

/**
 * Authentication through the ezfinance backend (which talks to Supabase Auth).
 * Screens call these; the session is kept in secure storage by the api layer, and the
 * returned UserProfile is what goes into the Redux user slice.
 */

// A refresh token that can no longer be used ends the session everywhere in the app.
onSessionExpired(() => DeviceEventEmitter.emit('LOGOUT'));

// The web client ID makes Google issue an ID token that Supabase accepts.
GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID });

export { ApiError };

// ── Sign-up wizard ─────────────────────────────────────────────────────────
// Email code first (creates the account), then password and profile details. Until finish, the
// session is held in memory only.

/** Sends the 6-digit sign-up code. Looks the same whether or not the email already has an account. */
export const sendSignUpCode = (email: string, name: string) => authApi.emailCode(email.trim(), name.trim());

/**
 * Verifies the sign-up code. existingAccount is true when this email already had an account with a
 * password: the user has just proven they own it, so they are signed in to that account instead.
 */
export async function verifySignUpCode(
  email: string,
  code: string,
): Promise<{ profile: UserProfile; existingAccount: boolean }> {
  const session = await authApi.verifyEmail(email.trim(), code);
  holdAuth({ session, profile: null });
  try {
    const profile = await refreshProfile();
    if (profile.hasPassword) {
      await persistHeldAuth();
      await setLastSignInMethod('email');
      return { profile, existingAccount: true };
    }
    return { profile, existingAccount: false };
  } catch (error) {
    await clearStoredAuth();
    throw error;
  }
}

export interface SignUpDetails {
  name: string;
  password: string;
  /** Register screen value, e.g. '25,000 to 50,000' */
  monthlyIncome: string | null;
  city: string | null;
  province: string | null;
  filerStatus: 'yes' | 'no' | 'unsure' | null;
}

/** Last sign-up step: sets the password and profile details, then keeps the user signed in. */
export async function completeSignUp(details: SignUpDetails): Promise<UserProfile> {
  await authApi.setPassword(details.password);
  await profileApi.update({
    fullName: details.name.trim(),
    monthlyIncome: details.monthlyIncome ? INCOME_TO_CODE[details.monthlyIncome] ?? null : null,
    city: details.city?.trim() || null,
    province: (details.province as ProvinceCode) || null,
    filerStatus: FILER_TO_CODE[details.filerStatus || 'unsure'],
  });
  const profile = await refreshProfile();
  await persistHeldAuth();
  await setLastSignInMethod('email');
  return profile;
}

/** Leaving the wizard after the code was verified: forget the unfinished session. */
export async function abandonSignUp(): Promise<void> {
  if (getStoredAuth()) {
    try {
      await authApi.logout();
    } catch {
      // Best effort.
    }
    await clearStoredAuth();
  }
}

/** For accounts whose email was never confirmed (older sign-ups): verify, then sign in. */
export async function verifyEmail(email: string, code: string): Promise<UserProfile> {
  return completeSignIn(await authApi.verifyEmail(email.trim(), code), 'email');
}

export const resendVerificationCode = (email: string) => authApi.resendCode(email.trim());

export async function signIn(email: string, password: string): Promise<UserProfile> {
  return completeSignIn(await authApi.login(email.trim(), password), 'email');
}

/**
 * Native Google Sign-In → ID token → backend /api/auth/google → session.
 * Returns null when the user closes the Google sheet. isNewUser is true on the first sign-in,
 * when the account (and its profile) was just created.
 */
export async function signInWithGoogle(): Promise<{ profile: UserProfile; isNewUser: boolean } | null> {
  let idToken: string | null;
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return null; // cancelled
    }
    idToken = response.data.idToken;
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === statusCodes.IN_PROGRESS) {
        return null;
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new ApiError(0, 'play_services', 'Google Play Services is not available on this device.');
      }
    }
    throw new ApiError(0, 'google_failed', "Couldn't sign in with Google. Please try again.");
  }
  if (!idToken) {
    throw new ApiError(0, 'google_failed', "Google didn't return a sign-in token. Please try again.");
  }

  const profile = await completeSignIn(await authApi.google(idToken), 'google');
  const createdAt = getStoredAuth()?.profile?.createdAt;
  const isNewUser = !!createdAt && Date.now() - Date.parse(createdAt) < 5 * 60 * 1000;
  return { profile, isNewUser };
}

// ── Forgot password: email → code → new password ──────────────────────────
export const requestPasswordReset = (email: string) => authApi.forgotPassword(email.trim());

/** Checks the reset code; returns a single-use token for setting the new password. */
export const verifyResetCode = async (email: string, code: string) =>
  (await authApi.verifyResetCode(email.trim(), code)).resetToken;

/** Sets the new password. The user then logs in with it. */
export const completePasswordReset = (resetToken: string, newPassword: string) =>
  authApi.completeReset(resetToken, newPassword);

export const changePassword = (currentPassword: string, newPassword: string) =>
  authApi.changePassword(currentPassword, newPassword);

/** For accounts created with Google: adds a password, then returns the refreshed profile. */
export async function setPassword(newPassword: string): Promise<UserProfile> {
  await authApi.setPassword(newPassword);
  return refreshProfile();
}

/** Revokes the session on the server (best effort), forgets it locally and returns to Welcome. */
export async function signOut(): Promise<void> {
  // Forget the Google account choice too, so the next Google sign-in shows the account picker.
  GoogleSignin.signOut().catch(() => {});
  if (getStoredAuth()) {
    try {
      await authApi.logout();
    } catch {
      // Offline or already expired: the local session is still removed below.
    }
    await clearStoredAuth();
  }
  DeviceEventEmitter.emit('LOGOUT');
}

export const isSignedIn = () => getStoredAuth() !== null;

/**
 * On app start: the profile saved with the last session, or null when signed out.
 * Call refreshProfile() afterwards to pick up changes made on the server.
 */
export async function restoreSession(): Promise<UserProfile | null> {
  const stored = await loadStoredAuth();
  if (!stored) {
    return null;
  }
  if (stored.profile) {
    return toUserProfile(stored.profile);
  }
  try {
    return await refreshProfile();
  } catch {
    return null;
  }
}

/** Saves edited profile details (name, income, city, province, filer status) to the server. */
export async function updateProfileDetails(
  current: UserProfile,
  changes: Partial<Pick<UserProfile, 'name' | 'monthlyIncome' | 'city' | 'province' | 'filerStatus'>>,
): Promise<UserProfile> {
  const next = { ...current, ...changes };
  const profile = await profileApi.update({
    fullName: next.name.trim(),
    monthlyIncome: next.monthlyIncome ? INCOME_TO_CODE[next.monthlyIncome] ?? null : null,
    city: next.city?.trim() || null,
    province: (next.province as ProvinceCode) || null,
    filerStatus: FILER_TO_CODE[next.filerStatus || 'unsure'],
  });
  const stored = getStoredAuth();
  if (stored) {
    await saveStoredAuth({ session: stored.session, profile });
  }
  return toUserProfile(profile);
}

/** Records that the first-visit tour is done, so it doesn't show again on any device. */
export async function markTourCompleted(): Promise<UserProfile> {
  const profile = await profileApi.tourCompleted();
  const stored = getStoredAuth();
  if (stored) {
    await saveStoredAuth({ session: stored.session, profile });
  }
  return toUserProfile(profile);
}

/** Loads the latest profile from the server and caches it with the session. */
export async function refreshProfile(): Promise<UserProfile> {
  const profile = await profileApi.get();
  const stored = getStoredAuth();
  if (stored) {
    await saveStoredAuth({ session: stored.session, profile });
  }
  return toUserProfile(profile);
}

async function completeSignIn(session: AuthSession, method: SignInMethod): Promise<UserProfile> {
  await startSession({ session, profile: null });
  try {
    const profile = await refreshProfile();
    await setLastSignInMethod(method);
    return profile;
  } catch (error) {
    await clearStoredAuth(); // don't leave a half-signed-in state behind
    throw error;
  }
}

// ── Mapping between app values and API codes ───────────────────────────────

const INCOME_TO_CODE: Record<string, IncomeCode> = {
  '< 25,000': 'under_25k',
  '25,000 to 50,000': '25k_50k',
  '50,000 to 100,000': '50k_100k',
  '100,000 to 150,000': '100k_150k',
  '> 150,000': '150k_plus',
};
const CODE_TO_INCOME = Object.fromEntries(
  Object.entries(INCOME_TO_CODE).map(([label, code]) => [code, label]),
) as Record<IncomeCode, string>;

const FILER_TO_CODE: Record<'yes' | 'no' | 'unsure', FilerCode> = {
  yes: 'filer',
  no: 'non_filer',
  unsure: 'unsure',
};
const CODE_TO_FILER: Record<FilerCode, 'yes' | 'no' | 'unsure'> = {
  filer: 'yes',
  non_filer: 'no',
  unsure: 'unsure',
};

function toUserProfile(profile: ApiProfile): UserProfile {
  return {
    uid: profile.id,
    name: profile.fullName,
    email: profile.email,
    photoURL: null,
    phone: null,
    monthlyIncome: profile.monthlyIncome ? CODE_TO_INCOME[profile.monthlyIncome] : null,
    city: profile.city,
    province: profile.province,
    filerStatus: CODE_TO_FILER[profile.filerStatus],
    hasPassword: profile.hasPassword,
    tourCompleted: profile.tourCompleted,
    createdAt: profile.createdAt,
  };
}
