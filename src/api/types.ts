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
  /** True once the first-visit app tour was finished or skipped. */
  tourCompleted: boolean;
  /** Signed, time-limited URL of the profile photo; null when there is none. */
  avatarUrl: string | null;
}

export interface UpdateProfileRequest {
  fullName: string;
  monthlyIncome: IncomeCode | null;
  city: string | null;
  province: ProvinceCode | null;
  filerStatus: FilerCode;
}

// ── Transactions ────────────────────────────────────────────────────────────

export type ApiTxType = 'expense' | 'income';
export type ApiTxSource = 'manual' | 'scan' | 'import';

/** A transaction as the API returns it. `date` is a calendar date, "YYYY-MM-DD". */
export interface ApiTransaction {
  id: string;
  type: ApiTxType;
  amount: number;
  category: string;
  note: string | null;
  /** The linked bank account it moved through. */
  accountId: string;
  date: string;
  source: ApiTxSource;
  excludeFromBudget: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTransactionPage {
  items: ApiTransaction[];
  nextCursor: string | null;
}

/** Fields the user edits (create and update). */
export interface TransactionFieldsRequest {
  type: ApiTxType;
  amount: number;
  category: string;
  note?: string | null;
  /** One of the user's linked bank accounts. */
  accountId: string;
  date: string;
  excludeFromBudget?: boolean;
}

export interface CreateTransactionRequest extends TransactionFieldsRequest {
  id: string;
  source?: ApiTxSource;
}

export interface SplitPartRequest {
  id: string;
  amount: number;
  category: string;
  note?: string | null;
}

// ── Bank accounts ───────────────────────────────────────────────────────────

/** A linked account; `balance` is the opening balance plus its transactions (worked out by the API). */
export interface ApiAccount {
  id: string;
  bankId: string;
  bankName: string;
  accountTitle: string;
  accountLast4: string;
  openingBalance: number;
  balance: number;
  createdAt: string;
}

export interface CreateAccountRequest {
  id: string;
  bankId: string;
  bankName: string;
  accountTitle: string;
  /** Only the last 4 digits; the full number stays on the phone. */
  accountLast4: string;
  /** What the account holds now. */
  balance: number;
}

// ── Repeated bills, loans, transfers ────────────────────────────────────────

export interface ApiBill {
  id: string;
  accountId: string;
  name: string;
  amount: number;
  category: string;
  dueDay: number;
  remindDaysBefore: number;
  /** "YYYY-MM-DD" of the last payment, or null. */
  lastPaidOn: string | null;
  createdAt: string;
}

export interface BillFieldsRequest {
  accountId: string;
  name: string;
  amount: number;
  category: string;
  dueDay: number;
  remindDaysBefore: number;
}

export interface ApiLoan {
  id: string;
  name: string;
  lender: string;
  totalAmount: number;
  remaining: number;
  interestRate: number;
  emi: number;
  dueDay: number;
  remindDaysBefore: number;
  remindOnDue: boolean;
  createdAt: string;
}

export type LoanFieldsRequest = Omit<ApiLoan, 'id' | 'createdAt'>;

export interface ApiTransfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note: string | null;
  date: string;
  createdAt: string;
}

export interface CreateTransferRequest {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note?: string | null;
  date: string;
}

// ── Goals & budget ──────────────────────────────────────────────────────────

export interface ApiGoal {
  id: string;
  name: string;
  target: number;
  /** Sum of the goal's contributions. */
  saved: number;
  deadline: string | null;
  icon: string | null;
  paused: boolean;
  createdAt: string;
}

export interface GoalFieldsRequest {
  name: string;
  target: number;
  deadline: string | null;
  icon: string | null;
  paused: boolean;
}

export interface ApiEnvelope {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthlyLimit: number;
  isMain: boolean;
}

export interface ApiBudget {
  monthlyLimit: number | null;
  envelopes: ApiEnvelope[];
}

export type EnvelopeFieldsRequest = Omit<ApiEnvelope, 'id'>;
