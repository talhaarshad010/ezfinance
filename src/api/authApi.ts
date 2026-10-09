import { apiRequest } from './client';
import type { AuthSession, ResetTokenResponse } from './types';

// Thin wrappers over /api/auth. Session storage and profile loading live in authService.

export const authApi = {
  /** Emails a 6-digit code; creates the account if the email is new. Same response either way. */
  emailCode: (email: string, fullName: string) =>
    apiRequest<void>('/api/auth/email-code', { method: 'POST', body: { email, fullName } }),

  verifyEmail: (email: string, code: string) =>
    apiRequest<AuthSession>('/api/auth/verify-email', { method: 'POST', body: { email, code } }),

  resendCode: (email: string) =>
    apiRequest<void>('/api/auth/resend-code', { method: 'POST', body: { email } }),

  login: (email: string, password: string) =>
    apiRequest<AuthSession>('/api/auth/login', { method: 'POST', body: { email, password } }),

  /** Exchanges a Google ID token from native Google Sign-In for a session. */
  google: (idToken: string) =>
    apiRequest<AuthSession>('/api/auth/google', { method: 'POST', body: { idToken } }),

  logout: () => apiRequest<void>('/api/auth/logout', { method: 'POST', auth: true }),

  forgotPassword: (email: string) =>
    apiRequest<void>('/api/auth/forgot-password', { method: 'POST', body: { email } }),

  verifyResetCode: (email: string, code: string) =>
    apiRequest<ResetTokenResponse>('/api/auth/verify-reset-code', { method: 'POST', body: { email, code } }),

  completeReset: (resetToken: string, newPassword: string) =>
    apiRequest<void>('/api/auth/complete-reset', { method: 'POST', body: { resetToken, newPassword } }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<void>('/api/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
      auth: true,
    }),

  /** Adds a password to an account that has none (created with Google). */
  setPassword: (newPassword: string) =>
    apiRequest<void>('/api/auth/set-password', { method: 'POST', body: { newPassword }, auth: true }),
};
