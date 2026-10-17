import { apiRequest } from './client';

export type RowCheck = 'verified' | 'mismatch' | 'unchecked';

/** One statement row as read and checked by the backend (nothing is saved yet). */
export interface StatementRow {
  /** Stable id: importing the same row again is recognised, never duplicated. */
  id: string;
  /** YYYY-MM-DD */
  date: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  balance: number | null;
  /** verified: its running balance adds up · mismatch: it doesn't · unchecked: no balance printed. */
  check: RowCheck;
  category: string;
  alreadyImported: boolean;
  /** Whether the review screen ticks it to start with. */
  preselected: boolean;
}

export interface StatementPreview {
  fileType: 'csv' | 'excel' | 'pdf';
  /** rules: read exactly (no AI) · ai: structured by Gemini, then checked by arithmetic. */
  method: 'rules' | 'ai';
  bankName: string | null;
  openingBalance: number | null;
  closingBalance: number | null;
  balanceCheck: 'passed' | 'failed' | 'unavailable';
  from: string;
  to: string;
  rows: StatementRow[];
  warnings: string[];
}

export interface PickedStatement {
  uri: string;
  name: string;
  type: string;
}

export const importApi = {
  /** Reads and checks a statement. 422 password_required / wrong_password for protected PDFs. */
  preview: (file: PickedStatement, password?: string) => {
    const form = new FormData();
    form.append('file', file as any); // React Native's FormData takes { uri, type, name } for files
    if (password) form.append('password', password);
    return apiRequest<StatementPreview>('/api/imports/statement', {
      method: 'POST',
      form,
      auth: true,
      timeoutMs: 150_000,
    });
  },

  /** Saves the reviewed rows into one account, all at once. */
  importRows: (
    accountId: string,
    rows: { id: string; type: string; amount: number; category: string; note: string; date: string }[],
  ) =>
    apiRequest<{ imported: number; restored: number; skipped: number }>('/api/imports/transactions', {
      method: 'POST',
      body: { accountId, rows },
      auth: true,
      timeoutMs: 60_000,
    }),
};
