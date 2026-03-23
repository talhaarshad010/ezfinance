import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';

const rnBiometrics = new ReactNativeBiometrics();

/** Check device hardware support for biometrics */
export async function isBiometricAvailable(): Promise<{
  available: boolean;
  biometryType?: string;
  error?: string;
}> {
  try {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    return { available, biometryType };
  } catch (error: any) {
    console.error('Biometric Availability Error:', error);
    return { available: false, error: error.message };
  }
}

/** Get the readable name of the biometric type */
export function getBiometricName(biometryType?: string): string {
  switch (biometryType) {
    case BiometryTypes.FaceID:
      return 'Face ID';
    case BiometryTypes.TouchID:
      return 'Touch ID';
    case BiometryTypes.Biometrics:
      return 'Biometrics';
    default:
      return 'Biometrics';
  }
}

/** Trigger the native biometric prompt */
export async function promptBiometric(promptMessage: string = 'Authenticate to continue'): Promise<boolean> {
  try {
    const { success } = await rnBiometrics.simplePrompt({
      promptMessage,
    });
    return success;
  } catch (error) {
    console.error('Biometric Prompt Error:', error);
    return false;
  }
}

/** Check if biometric login is enabled for a user in the database */
export async function isBiometricEnabled(uid: string): Promise<boolean> {
  try {
    const snapshot = await database().ref(`/users/${uid}/biometricEnabled`).once('value');
    return snapshot.val() === true;
  } catch (error) {
    console.error('Check Biometric Enabled Error:', error);
    return false;
  }
}

/** Enable or disable biometric login for the current user */
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  try {
    const user = auth().currentUser;
    if (!user) throw new Error('No user logged in');
    await database().ref(`/users/${user.uid}`).update({ biometricEnabled: enabled });
  } catch (error) {
    console.error('Set Biometric Enabled Error:', error);
    throw error;
  }
}
