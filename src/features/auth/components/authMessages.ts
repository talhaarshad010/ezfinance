// Copy and validation shared by the auth screens (Figma: onboarding v09/10/2026).
// Copy rule from the design: no hyphens or em dashes, short separate sentences.

export const MSG = {
  email: 'Enter a valid email address.',
  weakPassword: 'Use at least 8 characters with a number.',
  mismatch: "Passwords don't match.",
  loginFail: 'Email or password is incorrect.',
  maybeSent: "If an account exists, we've sent a code.",
  wrongOtp: "That code isn't right. Try again.",
  expiredOtp: 'That code has expired.',
  tooMany: 'Too many attempts. Try again in 5 minutes.',
  googleFail: "Couldn't sign in with Google. Try again or use your email.",
  generic: 'Something went wrong. Please try again.',
  offline: 'No internet connection',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value: string, emptyMsg = 'Enter your email.'): string | null {
  const s = value.trim();
  if (!s) return emptyMsg;
  return EMAIL_RE.test(s) ? null : MSG.email;
}

export function validatePassword(value: string, emptyMsg = 'Enter a password.'): string | null {
  if (!value) return emptyMsg;
  return value.length >= 8 && /\d/.test(value) ? null : MSG.weakPassword;
}

/** "talha@gmail.com" → "t***@gmail.com" */
export function maskEmail(value: string): string {
  const [user, domain] = value.trim().split('@');
  return domain ? `${user.slice(0, 1)}***@${domain}` : value.trim();
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
