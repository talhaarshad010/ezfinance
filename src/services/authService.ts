import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import DeviceInfo from 'react-native-device-info';

// Configure Google Sign-In
// Note: webClientId is required for Firebase Authentication to work with Google Sign-In.
GoogleSignin.configure({
  webClientId: '698639438639-ngj2omqdsnhakiihcnn4laadgf3lhga4.apps.googleusercontent.com', // PLACEHOLDER: Please replace with your actual Web Client ID
  iosClientId: '698639438639-6a7bs7mpp8iuak7ei7nlaftfmjbe3djh.apps.googleusercontent.com',
});

/**
 * Authentication Service using Firebase Auth and Realtime Database
 */

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<any> {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const { user } = userCredential;

    // Save additional user info to Realtime Database
    await database().ref(`/users/${user.uid}`).set({
      name,
      email,
      createdAt: database.ServerValue.TIMESTAMP,
    });

    // Update profile display name
    await user.updateProfile({ displayName: name });

    return { user };
  } catch (error: any) {
    console.error('Sign Up Error:', error);
    throw error;
  }
}

/** Sign in an existing user with email/password */
export async function signIn(
  email: string,
  password: string,
): Promise<any> {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    return userCredential;
  } catch (error: any) {
    console.error('Sign In Error:', error);
    throw error;
  }
}

/** Sign out current user and clear device verification */
export async function signOut(): Promise<void> {
  try {
    const user = auth().currentUser;
    if (user) {
      const sid = await DeviceInfo.getUniqueId();
      await removeDeviceVerification(user.uid, sid);
    }

    await auth().signOut();
    await GoogleSignin.signOut();
  } catch (error) {
    console.error('[AuthService] Sign out error:', error);
    // Even if cleanup fails, ensure we try to sign out
    await auth().signOut().catch(() => {});
  }
}

/** Sign in with Google */
export async function signInWithGoogle(): Promise<any> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data?.idToken;

    if (!idToken) {
      throw new Error('Google Sign-In failed: No ID token found');
    }

    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);
    const { user } = userCredential;

    // Sync with database if new user
    const snapshot = await database().ref(`/users/${user.uid}`).once('value');
    if (!snapshot.exists()) {
      await database().ref(`/users/${user.uid}`).set({
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: database.ServerValue.TIMESTAMP,
      });
    }

    return userCredential;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}


/** Send password reset email */
export async function forgotPassword(email: string): Promise<void> {
  try {
    await auth().sendPasswordResetEmail(email);
  } catch (error) {
    console.error('Forgot Password Error:', error);
    throw error;
  }
}

/** Subscribe to auth state changes. Returns unsubscribe function. */
export function onAuthStateChanged(
  callback: (user: any | null) => void,
): () => void {
  return auth().onAuthStateChanged(callback);
}

/** Get user profile data from Realtime Database */
export async function getUserProfile(uid: string): Promise<any> {
  try {
    const snapshot = await database().ref(`/users/${uid}`).once('value');
    return snapshot.val();
  } catch (error) {
    console.error('Get User Profile Error:', error);
    throw error;
  }
}

/** Update user profile data in Realtime Database and Auth profile */
export async function updateUserProfile(data: { name?: string; phone?: string }): Promise<void> {
  try {
    const user = auth().currentUser;
    if (!user) throw new Error('No user logged in');

    const updates: any = {};
    if (data.name) {
      updates.name = data.name;
      await user.updateProfile({ displayName: data.name });
    }
    if (data.phone) updates.phone = data.phone;

    await database().ref(`/users/${user.uid}`).update(updates);
  } catch (error) {
    console.error('Update Profile Error:', error);
    throw error;
  }
}

/** Update user profile photo URL in Realtime Database */
export async function updateProfilePhoto(photoURL: string): Promise<void> {
  try {
    const user = auth().currentUser;
    if (!user) throw new Error('No user logged in');
    await database().ref(`/users/${user.uid}`).update({ photoURL });
  } catch (error) {
    console.error('Update Profile Photo Error:', error);
    throw error;
  }
}

/** Delete user profile photo */
export async function deleteProfilePhoto(): Promise<void> {
  try {
    const user = auth().currentUser;
    if (!user) throw new Error('No user logged in');
    await database().ref(`/users/${user.uid}/photoURL`).remove();
  } catch (error) {
    console.error('Delete Profile Photo Error:', error);
    throw error;
  }
}

/** Change user password (requires reauthentication) */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  try {
    const user = auth().currentUser;
    if (!user || !user.email) throw new Error('No user logged in');

    // Re-authenticate
    const credential = auth.EmailAuthProvider.credential(user.email, currentPassword);
    await user.reauthenticateWithCredential(credential);

    // Update password
    await user.updatePassword(newPassword);
  } catch (error: any) {
    console.error('Change Password Error:', error);
    throw error;
  }
}

// ==================== TWO-FACTOR AUTHENTICATION ====================

/** Check if 2FA is enabled for a user */
export async function isTwoFactorEnabled(uid: string): Promise<boolean> {
  try {
    const snapshot = await database().ref(`/users/${uid}/twoFactorEnabled`).once('value');
    return snapshot.val() === true;
  } catch (error) {
    console.error('Check 2FA Error:', error);
    return false;
  }
}

/** Enable or disable 2FA for the current user */
export async function setTwoFactorEnabled(enabled: boolean): Promise<void> {
  try {
    const user = auth().currentUser;
    if (!user) throw new Error('No user logged in');
    await database().ref(`/users/${user.uid}`).update({ twoFactorEnabled: enabled });
  } catch (error) {
    console.error('Set 2FA Error:', error);
    throw error;
  }
}

/** Generate a 6-digit OTP and store in database with 5-minute expiry */
export async function generateOTP(uid: string): Promise<string> {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    await database().ref(`/users/${uid}/otp`).set({
      code: otp,
      expiresAt,
      verified: false,
    });

    return otp;
  } catch (error) {
    console.error('Generate OTP Error:', error);
    throw error;
  }
}

/** Verify a submitted OTP code against the stored one */
export async function verifyOTP(uid: string, submittedCode: string): Promise<boolean> {
  try {
    const snapshot = await database().ref(`/users/${uid}/otp`).once('value');
    const otpData = snapshot.val();

    if (!otpData) throw new Error('No OTP found. Please request a new one.');
    if (Date.now() > otpData.expiresAt) {
      await database().ref(`/users/${uid}/otp`).remove();
      throw new Error('OTP has expired. Please request a new one.');
    }
    if (otpData.code !== submittedCode) {
      throw new Error('Invalid OTP code.');
    }

    // OTP verified — clear it
    await database().ref(`/users/${uid}/otp`).remove();
    return true;
  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    throw error;
  }
}

// ==================== DEVICE VERIFICATION (Persistence) ====================

/** Record that the current device has verified 2FA for this user */
export async function recordDeviceVerification(uid: string, deviceId: string): Promise<void> {
  try {
    await database()
      .ref(`/users/${uid}/verifiedDevices/${deviceId}`)
      .set({
        verifiedAt: database.ServerValue.TIMESTAMP,
      });
  } catch (error) {
    console.error('[AuthService] Record Device Verification Error:', error);
  }
}

/** Check if the current device has already verified 2FA */
export async function checkDeviceVerification(uid: string, deviceId: string): Promise<boolean> {
  try {
    const snapshot = await database()
      .ref(`/users/${uid}/verifiedDevices/${deviceId}`)
      .once('value');
    return snapshot.exists();
  } catch (error) {
    console.error('[AuthService] Check Device Verification Error:', error);
    return false;
  }
}

/** Remove verification for a specific device (e.g., on logout) */
export async function removeDeviceVerification(uid: string, deviceId: string): Promise<void> {
  try {
    await database()
      .ref(`/users/${uid}/verifiedDevices/${deviceId}`)
      .remove();
  } catch (error) {
    console.error('[AuthService] Remove Device Verification Error:', error);
  }
}
