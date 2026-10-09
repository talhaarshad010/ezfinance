import * as Keychain from 'react-native-keychain';
import type { ApiProfile, AuthSession } from './types';

/**
 * Persists the signed-in session in the iOS Keychain / Android Keystore, together with the
 * last known profile so the app can open straight to the dashboard (even offline).
 */
export interface StoredAuth {
  session: AuthSession;
  profile: ApiProfile | null;
}

const SERVICE = 'com.ezfinance.auth';

let current: StoredAuth | null = null;
/** True while a sign-up is in progress: the session is used but not written to the keychain. */
let held = false;

export function getStoredAuth(): StoredAuth | null {
  return current;
}

export async function loadStoredAuth(): Promise<StoredAuth | null> {
  try {
    const entry = await Keychain.getGenericPassword({ service: SERVICE });
    current = entry ? (JSON.parse(entry.password) as StoredAuth) : null;
  } catch {
    current = null; // unreadable entry (e.g. after a restore to a new device): start signed out
  }
  return current;
}

export async function saveStoredAuth(value: StoredAuth): Promise<void> {
  current = value;
  if (!held) {
    await writeKeychain(value);
  }
}

/** A normal sign-in: saved to the device, ending any held sign-up session. */
export async function startSession(value: StoredAuth): Promise<void> {
  held = false;
  await saveStoredAuth(value);
}

/**
 * Uses a session without saving it to the device, e.g. during sign-up: if the app is closed
 * before sign-up finishes, it does not reopen signed in to a half-finished account.
 */
export function holdAuth(value: StoredAuth): void {
  current = value;
  held = true;
}

/** Saves a held session to the keychain (sign-up finished). */
export async function persistHeldAuth(): Promise<void> {
  held = false;
  if (current) {
    await writeKeychain(current);
  }
}

export async function clearStoredAuth(): Promise<void> {
  current = null;
  held = false;
  await Keychain.resetGenericPassword({ service: SERVICE });
}

function writeKeychain(value: StoredAuth) {
  return Keychain.setGenericPassword('session', JSON.stringify(value), {
    service: SERVICE,
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
}
