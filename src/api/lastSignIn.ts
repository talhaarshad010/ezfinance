import * as Keychain from 'react-native-keychain';

/**
 * How the user last signed in on this device, for the "Last used" badge on Welcome.
 * Kept only on the device (never sent anywhere), and kept after sign-out on purpose.
 */
export type SignInMethod = 'email' | 'google';

const SERVICE = 'com.ezfinance.lastSignIn';

export async function getLastSignInMethod(): Promise<SignInMethod | null> {
  try {
    const entry = await Keychain.getGenericPassword({ service: SERVICE });
    return entry && (entry.password === 'email' || entry.password === 'google') ? entry.password : null;
  } catch {
    return null;
  }
}

export async function setLastSignInMethod(method: SignInMethod): Promise<void> {
  try {
    await Keychain.setGenericPassword('method', method, { service: SERVICE });
  } catch {
    // Only a convenience; ignore storage failures.
  }
}
