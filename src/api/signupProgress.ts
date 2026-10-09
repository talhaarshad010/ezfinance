import * as Keychain from 'react-native-keychain';

/**
 * Sign-up answers saved on the device, so quitting the app mid sign-up resumes where the user
 * stopped. Passwords and codes are never saved. Cleared when sign-up finishes.
 */
export interface SignUpProgress {
  stepIndex: number;
  name: string;
  email: string;
  income: string;
  city: string;
  province: string;
  filer: string;
}

const SERVICE = 'com.ezfinance.signupProgress';

export async function loadSignUpProgress(): Promise<SignUpProgress | null> {
  try {
    const entry = await Keychain.getGenericPassword({ service: SERVICE });
    return entry ? (JSON.parse(entry.password) as SignUpProgress) : null;
  } catch {
    return null;
  }
}

export async function saveSignUpProgress(progress: SignUpProgress): Promise<void> {
  try {
    await Keychain.setGenericPassword('progress', JSON.stringify(progress), { service: SERVICE });
  } catch {
    // Only a convenience; ignore storage failures.
  }
}

export async function clearSignUpProgress(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({ service: SERVICE });
  } catch {
    // ignore
  }
}
