/**
 * Mock Authentication Service
 * Replaces Firebase Auth with local placeholder logic as requested.
 */

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<any> {
  console.log('Mock Sign Up:', { name, email });
  return { user: { uid: 'mock-uid', displayName: name, email } };
}

/** Sign in an existing user with email/password */
export async function signIn(
  email: string,
  password: string,
): Promise<any> {
  console.log('Mock Sign In:', email);
  return { user: { uid: 'mock-uid', email } };
}

/** Sign out the current user */
export async function signOut(): Promise<void> {
  console.log('Mock Sign Out');
}

/** Subscribe to auth state changes. Returns unsubscribe function. */
export function onAuthStateChanged(
  callback: (user: any | null) => void,
): () => void {
  // Initially return null to show auth screens
  callback(null);
  return () => {};
}
