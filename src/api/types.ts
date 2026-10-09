// Shapes of the ezfinance backend API (see backend/README.md).

export interface AuthUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
}

/** Returned by login, verify-email, refresh and reset-password. */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  /** Unix time (seconds) when the access token expires. */
  expiresAt: number;
  user: AuthUser;
}

/** Single-use handle for setting a new password after the reset code was verified. */
export interface ResetTokenResponse {
  resetToken: string;
  expiresIn: number;
}

export type IncomeCode = 'under_25k' | '25k_50k' | '50k_100k' | '100k_150k' | '150k_plus';
export type ProvinceCode = 'Punjab' | 'Sindh' | 'KPK' | 'Balochistan' | 'ICT' | 'AJK' | 'GB';
export type FilerCode = 'filer' | 'non_filer' | 'unsure';

export interface ApiProfile {
  id: string;
  email: string;
  fullName: string;
  monthlyIncome: IncomeCode | null;
  city: string | null;
  province: ProvinceCode | null;
  filerStatus: FilerCode;
  createdAt: string;
  /** False for accounts created with Google until a password is set. */
  hasPassword: boolean;
}

export interface UpdateProfileRequest {
  fullName: string;
  monthlyIncome: IncomeCode | null;
  city: string | null;
  province: ProvinceCode | null;
  filerStatus: FilerCode;
}
