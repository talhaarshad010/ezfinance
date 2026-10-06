/**
 * Mock Authentication Service (Pure UI Mode - No Backend/Database)
 */

export async function signUp(
  name: string,
  email: string,
  _password: string,
): Promise<any> {
  return {
    user: {
      uid: 'usr_demo_01',
      displayName: name,
      email,
      photoURL: null,
    },
  };
}

/** Sign in an existing user with email/password */
export async function signIn(
  email: string,
  _password: string,
): Promise<any> {
  return {
    user: {
      uid: 'usr_demo_01',
      displayName: 'Muhammad Talha Arshad',
      email,
      photoURL: null,
    },
  };
}

/** Sign out current user */
export async function signOut(): Promise<void> {
  return Promise.resolve();
}

/** Sign in with Google */
export async function signInWithGoogle(): Promise<any> {
  return {
    user: {
      uid: 'usr_demo_01',
      displayName: 'Muhammad Talha Arshad',
      email: 'talhaarshad010@gmail.com',
      photoURL: null,
    },
  };
}

/** Send password reset email */
export async function forgotPassword(_email: string): Promise<void> {
  return Promise.resolve();
}

/** Subscribe to auth state changes */
export function onAuthStateChanged(
  callback: (user: any | null) => void,
): () => void {
  callback({
    uid: 'usr_demo_01',
    displayName: 'Muhammad Talha Arshad',
    email: 'talhaarshad010@gmail.com',
    photoURL: null,
  });
  return () => {};
}

/** Get user profile data */
export async function getUserProfile(_uid: string): Promise<any> {
  return {
    name: 'Muhammad Talha Arshad',
    email: 'talhaarshad010@gmail.com',
    phone: '+92 300 1234567',
    photoURL: null,
  };
}

/** Update user profile data */
export async function updateUserProfile(_data: { name?: string; phone?: string }): Promise<void> {
  return Promise.resolve();
}

/** Update user profile photo URL */
export async function updateProfilePhoto(_photoURL: string): Promise<void> {
  return Promise.resolve();
}

/** Delete user profile photo */
export async function deleteProfilePhoto(): Promise<void> {
  return Promise.resolve();
}

/** Change user password */
export async function changePassword(_currentPassword: string, _newPassword: string): Promise<void> {
  return Promise.resolve();
}

// ==================== TWO-FACTOR AUTHENTICATION ====================

let mock2FAEnabled = false;

export async function isTwoFactorEnabled(_uid: string): Promise<boolean> {
  return mock2FAEnabled;
}

export async function setTwoFactorEnabled(enabled: boolean): Promise<void> {
  mock2FAEnabled = enabled;
  return Promise.resolve();
}

export async function generateOTP(_uid: string): Promise<string> {
  return '123456';
}

export async function verifyOTP(_uid: string, _submittedCode: string): Promise<boolean> {
  return true;
}

// ==================== DEVICE VERIFICATION ====================

export async function recordDeviceVerification(_uid: string, _deviceId: string): Promise<void> {
  return Promise.resolve();
}

export async function checkDeviceVerification(_uid: string, _deviceId: string): Promise<boolean> {
  return true;
}

export async function removeDeviceVerification(_uid: string, _deviceId: string): Promise<void> {
  return Promise.resolve();
}
