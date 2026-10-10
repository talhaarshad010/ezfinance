import type {
  ApiAccount,
  ApiBill,
  ApiEnvelope,
  ApiGoal,
  ApiLoan,
  ApiTransaction,
  ApiTransfer,
  ApiTxSource,
  LoanFieldsRequest,
  TransactionFieldsRequest,
} from '../api/types';
import type { TxSource, UserBill, UserGoal, UserTransfer, UserTx } from '../context/UserModeContext';
import type { BudgetCategory } from '../store/slices/budgetSlice';
import type { DebtEntry } from '../constants/ledgerData';
import type { BankAccount } from '../store/slices/bankAccountsSlice';
import { getBankById } from '../constants/pakistaniBanks';

/** "YYYY-MM-DD" for the local calendar day of `d` (no UTC shift). */
export function toApiDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local midnight of a "YYYY-MM-DD" date. */
export function fromApiDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** The API stores where a transaction came from; a failed scan entered by hand counts as manual. */
export const toApiSource = (s?: TxSource): ApiTxSource => (s === 'scan' || s === 'import' ? s : 'manual');

export function toUserTx(t: ApiTransaction): UserTx {
  return {
    id: t.id,
    type: t.type,
    category: t.category,
    amount: Number(t.amount),
    note: t.note ?? undefined,
    accountId: t.accountId,
    date: fromApiDate(t.date),
    source: t.source,
    excludeFromBudget: t.excludeFromBudget,
  };
}

export function toFields(t: Omit<UserTx, 'id'>): TransactionFieldsRequest {
  return {
    type: t.type,
    amount: Math.round(t.amount * 100) / 100,
    category: t.category,
    note: t.note?.trim() || null,
    accountId: t.accountId,
    date: toApiDate(t.date),
    excludeFromBudget: !!t.excludeFromBudget,
  };
}

/**
 * A linked account as the bank screens use it. `balance` holds the opening balance; the live
 * balance (opening plus the account's transactions) is worked out on screen so it updates as
 * soon as a transaction changes.
 */
export function toBankAccount(a: ApiAccount): BankAccount {
  const bank = getBankById(a.bankId);
  return {
    id: a.id,
    bankId: a.bankId,
    bankName: a.bankName,
    bankColor: bank?.color ?? '#555555',
    bankAbbreviation: bank?.abbreviation ?? a.bankName.slice(0, 3).toUpperCase(),
    accountTitle: a.accountTitle,
    accountNumber: a.accountLast4,
    balance: Number(a.openingBalance),
    createdAt: Date.parse(a.createdAt),
  };
}

export const toUserBill = (b: ApiBill): UserBill => ({
  id: b.id,
  accountId: b.accountId,
  name: b.name,
  amount: Number(b.amount),
  category: b.category,
  dueDay: b.dueDay,
  remindDaysBefore: b.remindDaysBefore,
  lastPaidOn: b.lastPaidOn ? fromApiDate(b.lastPaidOn) : null,
});

/** A loan, shaped like the Loans tab's entries. */
export const toUserLoan = (l: ApiLoan): DebtEntry => ({
  id: l.id,
  name: l.name,
  lender: l.lender,
  totalAmount: Number(l.totalAmount),
  remaining: Number(l.remaining),
  interestRate: Number(l.interestRate),
  emi: Number(l.emi),
  dueDayOfMonth: l.dueDay,
  remindDaysBefore: l.remindDaysBefore,
  remindOnDue: l.remindOnDue,
});

export const toLoanFields = (d: DebtEntry): LoanFieldsRequest => ({
  name: d.name.trim(),
  lender: d.lender.trim(),
  totalAmount: d.totalAmount,
  remaining: Math.min(d.remaining, d.totalAmount),
  interestRate: d.interestRate,
  emi: d.emi,
  dueDay: Math.min(31, Math.max(1, Math.round(d.dueDayOfMonth))),
  remindDaysBefore: Math.min(14, Math.max(0, d.remindDaysBefore)),
  remindOnDue: d.remindOnDue,
});

export const toUserTransfer = (t: ApiTransfer): UserTransfer => ({
  id: t.id,
  fromAccountId: t.fromAccountId,
  toAccountId: t.toAccountId,
  amount: Number(t.amount),
  note: t.note ?? undefined,
  date: fromApiDate(t.date),
});

export const toUserGoal = (g: ApiGoal): UserGoal => ({
  id: g.id,
  name: g.name,
  target: Number(g.target),
  saved: Number(g.saved),
  deadline: g.deadline ? fromApiDate(g.deadline) : undefined,
  icon: g.icon ?? undefined,
  paused: g.paused,
});

export const toEnvelope = (e: ApiEnvelope): BudgetCategory => ({
  id: e.id,
  name: e.name,
  icon: e.icon,
  color: e.color,
  limit: Number(e.monthlyLimit),
  isMain: e.isMain,
});
