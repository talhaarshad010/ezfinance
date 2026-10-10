/**
 * Seed data for the expense ledger module (transactions, recurring bills,
 * category envelopes, debts, statement import and the SMS parsing engine).
 * Icon fields hold Feather icon names.
 */

export type TxType = 'income' | 'expense' | 'transfer';

export interface LedgerTransaction {
  /** Sample rows use numbers; a signed-in user's rows use their UUID. */
  id: number | string;
  icon: string;
  label: string;
  account: string;
  category: string;
  amount: number;
  dateGroup: string;
  time: string;
  type: TxType;
  smsRef: string;
  status: string;
  /** Left out of budget totals (a signed-in user's choice). */
  excluded?: boolean;
}

export const TRANSACTIONS: LedgerTransaction[] = [
  { id: 1, icon: 'shopping-cart', label: 'Carrefour Hyperstar', account: 'HBL Debit *1234', category: 'Groceries', amount: -3240, dateGroup: 'TODAY', time: '11:42 AM', type: 'expense', smsRef: 'HBL-TXN-20260816-1142', status: 'Settled' },
  { id: 2, icon: 'truck', label: 'Uber Pakistan', account: 'Meezan *5678', category: 'Transport', amount: -380, dateGroup: 'TODAY', time: '09:15 AM', type: 'expense', smsRef: 'MEZ-TXN-20260816-0915', status: 'Settled' },
  { id: 3, icon: 'home', label: 'Rent — DHA Phase 6', account: 'Alfalah Transfer', category: 'Housing', amount: -25000, dateGroup: 'YESTERDAY', time: '12:01 AM', type: 'expense', smsRef: 'ALF-TXN-20260815-0001', status: 'Settled' },
  { id: 4, icon: 'zap', label: 'LESCO Bill', account: 'HBL Debit *1234', category: 'Utilities', amount: -2800, dateGroup: 'YESTERDAY', time: '10:30 AM', type: 'expense', smsRef: 'HBL-TXN-20260815-1030', status: 'Settled' },
  { id: 10, icon: 'refresh-cw', label: 'Meezan → Easypaisa', account: 'Meezan Checking', category: 'Transfer', amount: -5000, dateGroup: 'YESTERDAY', time: '03:30 PM', type: 'transfer', smsRef: 'MEZ-TFR-20260815-1530', status: 'Settled' },
  { id: 5, icon: 'coffee', label: 'Espresso — Gulberg', account: 'Meezan *5678', category: 'Dining', amount: -1450, dateGroup: '14 AUG', time: '08:20 AM', type: 'expense', smsRef: 'MEZ-TXN-20260814-0820', status: 'Settled' },
  { id: 11, icon: 'refresh-cw', label: 'HBL → Meezan Checking', account: 'HBL Checking', category: 'Transfer', amount: -20000, dateGroup: '14 AUG', time: '11:00 AM', type: 'transfer', smsRef: 'HBL-TFR-20260814-1100', status: 'Settled' },
  { id: 6, icon: 'smartphone', label: 'Jazz Postpaid', account: 'UBL Debit', category: 'Telecom', amount: -1200, dateGroup: '13 AUG', time: '02:00 PM', type: 'expense', smsRef: 'UBL-TXN-20260813-1400', status: 'Settled' },
  { id: 9, icon: 'arrow-up-right', label: 'Meezan Fund Dividend', account: 'Meezan Islamic', category: 'Investment', amount: 4200, dateGroup: '13 AUG', time: '12:00 PM', type: 'income', smsRef: 'MEZ-DIV-20260813-1200', status: 'Settled' },
  { id: 7, icon: 'shopping-cart', label: 'Chase Up Superstore', account: 'Alfalah Debit', category: 'Groceries', amount: -4560, dateGroup: '01 AUG', time: '05:45 PM', type: 'expense', smsRef: 'ALF-TXN-20260801-1745', status: 'Settled' },
  { id: 8, icon: 'arrow-up-right', label: 'Salary Credit', account: 'HBL Checking', category: 'Salary', amount: 150000, dateGroup: '01 AUG', time: '09:00 AM', type: 'income', smsRef: 'HBL-SAL-20260801-0900', status: 'Settled' },
];

export const DATE_LABELS: Record<string, string> = {
  TODAY: '16.08.2026',
  YESTERDAY: '15.08.2026',
  '14 AUG': '14.08.2026',
  '13 AUG': '13.08.2026',
  '01 AUG': '01.08.2026',
};

export function groupByDate(txs: LedgerTransaction[]) {
  const map = new Map<string, LedgerTransaction[]>();
  const order: string[] = [];
  txs.forEach(tx => {
    if (!map.has(tx.dateGroup)) {
      map.set(tx.dateGroup, []);
      order.push(tx.dateGroup);
    }
    map.get(tx.dateGroup)!.push(tx);
  });
  return order.map(date => ({ date, items: map.get(date)! }));
}

export const RECURRING = [
  { id: 1, icon: 'home', label: 'House Rent', amount: 25000, cadence: 'Monthly on 1st', category: 'Housing' },
  { id: 2, icon: 'smartphone', label: 'Jazz Postpaid', amount: 1200, cadence: 'Monthly on 5th', category: 'Telecom' },
  { id: 3, icon: 'activity', label: 'Gym Membership', amount: 3500, cadence: 'Monthly on 10th', category: 'Health' },
  { id: 4, icon: 'film', label: 'Netflix Pakistan', amount: 1100, cadence: 'Monthly on 15th', category: 'Entertainment' },
  { id: 5, icon: 'wifi', label: 'PTCL Broadband', amount: 2000, cadence: 'Monthly on 20th', category: 'Utilities' },
  { id: 6, icon: 'truck', label: 'Vehicle EMI', amount: 15000, cadence: 'Monthly on 25th', category: 'Loan' },
];

export interface UpcomingBill {
  /** Sample bills use numbers; a signed-in user's bills use their UUID. */
  id: number | string;
  icon: string;
  label: string;
  amount: number;
  date: string;
  dueIn: number;
  tag: string;
  tagColor: string;
  paid: boolean;
  /** A signed-in user's bill: the account it's paid from, its day of the month and category. */
  accountId?: string;
  dueDay?: number;
  category?: string;
  remindDaysBefore?: number;
}

export const UPCOMING_BILLS: UpcomingBill[] = [
  { id: 1, icon: 'film', label: 'Netflix Subscription', amount: 1500, date: '04 Sep', dueIn: 3, tag: 'Meezan Card', tagColor: '#00A3FF', paid: false },
  { id: 2, icon: 'zap', label: 'K-Electric Bill', amount: 14500, date: '08 Sep', dueIn: 7, tag: '1Link Auto', tagColor: '#00C853', paid: false },
  { id: 3, icon: 'home', label: 'House Rent', amount: 25000, date: '11 Sep', dueIn: 10, tag: 'IBAN Transfer', tagColor: '#86868B', paid: false },
  { id: 4, icon: 'truck', label: 'Vehicle EMI Installment', amount: 20000, date: '19 Sep', dueIn: 18, tag: 'Auto-Debit', tagColor: '#FF9500', paid: false },
  { id: 5, icon: 'wifi', label: 'StormFiber Internet', amount: 3800, date: '25 Sep', dueIn: 24, tag: 'Manual Bill', tagColor: '#86868B', paid: false },
];

export const CATEGORY_BUDGETS: Record<
  string,
  { budget: number; spent: number; manual: boolean }
> = {
  'Housing & Rent': { budget: 25000, spent: 25000, manual: false },
  Groceries: { budget: 30000, spent: 22000, manual: true },
  Transport: { budget: 5000, spent: 380, manual: false },
  Utilities: { budget: 15000, spent: 2800, manual: false },
  Dining: { budget: 8000, spent: 1450, manual: true },
  Telecom: { budget: 3000, spent: 1200, manual: false },
};

export const CATEGORY_GROUPS = [
  { label: 'Housing & Rent', icon: 'home', total: 25000, items: [{ label: 'Rent — DHA Phase 6', amount: 25000 }] },
  { label: 'Groceries', icon: 'shopping-cart', total: 7800, items: [{ label: 'Carrefour Hyperstar', amount: 3240 }, { label: 'Chase Up Superstore', amount: 4560 }] },
  { label: 'Transport', icon: 'truck', total: 380, items: [{ label: 'Uber Pakistan', amount: 380 }] },
  { label: 'Utilities', icon: 'zap', total: 2800, items: [{ label: 'LESCO Bill', amount: 2800 }] },
  { label: 'Dining', icon: 'coffee', total: 1450, items: [{ label: 'Espresso — Gulberg', amount: 1450 }] },
  { label: 'Telecom', icon: 'smartphone', total: 1200, items: [{ label: 'Jazz Postpaid', amount: 1200 }] },
];

export const EXPENSE_CATEGORIES = [
  { label: 'Groceries', icon: 'shopping-cart' },
  { label: 'Transport', icon: 'truck' },
  { label: 'Housing/Rent', icon: 'home' },
  { label: 'Utilities', icon: 'zap' },
  { label: 'Education', icon: 'book-open' },
  { label: 'Dining', icon: 'coffee' },
  { label: 'Healthcare', icon: 'heart' },
  { label: 'Entertainment', icon: 'film' },
  { label: 'Misc', icon: 'tag' },
];

export const LINKED_ACCOUNTS = [
  { name: 'Meezan Bank (Current)', balance: 72000, type: 'Islamic' },
  { name: 'HBL (Savings)', balance: 150000, type: 'Savings' },
  { name: 'Bank Alfalah (Credit Card)', balance: 45000, type: 'Credit' },
  { name: 'Easypaisa Mobile Account', balance: 8500, type: 'Digital' },
  { name: 'Physical Cash Wallet', balance: 12000, type: 'Cash' },
];

/* ── Debts ── */

export interface DebtEntry {
  /** Sample entries use numbers; a signed-in user's loans use their UUID. */
  id: number | string;
  name: string;
  lender: string;
  totalAmount: number;
  remaining: number;
  interestRate: number;
  emi: number;
  dueDayOfMonth: number;
  remindDaysBefore: number;
  remindOnDue: boolean;
}

export const SEED_DEBTS: DebtEntry[] = [
  { id: 1, name: 'Auto Loan', lender: 'Bank Alfalah', totalAmount: 480000, remaining: 240000, interestRate: 14.5, emi: 20000, dueDayOfMonth: 19, remindDaysBefore: 3, remindOnDue: true },
  { id: 2, name: 'Personal Line of Credit', lender: 'Meezan Bank', totalAmount: 150000, remaining: 45000, interestRate: 18.0, emi: 15000, dueDayOfMonth: 5, remindDaysBefore: 5, remindOnDue: true },
];

/* ── Statement import ── */

export const SUPPORTED_BANKS = [
  'HBL', 'Meezan', 'Alfalah', 'Standard Chartered',
  'UBL', 'MCB', 'Easypaisa', 'JazzCash',
];

export const MOCK_STATEMENT_TXS = [
  { id: 1, date: '12 Aug', merchant: 'Shell Gulshan', cat: 'Fuel & Commute', amount: -3200, checked: true, dup: false },
  { id: 2, date: '12 Aug', merchant: 'Carrefour Hyperstar', cat: 'Groceries', amount: -4800, checked: true, dup: false },
  { id: 3, date: '11 Aug', merchant: 'Netflix Pakistan', cat: 'Entertainment', amount: -1100, checked: true, dup: false },
  { id: 4, date: '11 Aug', merchant: 'Shell Gulshan', cat: 'Fuel & Commute', amount: -3200, checked: false, dup: true },
  { id: 5, date: '10 Aug', merchant: 'LESCO Bill', cat: '', amount: -2800, checked: true, dup: false },
  { id: 6, date: '09 Aug', merchant: 'Uber Pakistan', cat: 'Transport', amount: -380, checked: true, dup: false },
  { id: 7, date: '08 Aug', merchant: 'Espresso Gulberg', cat: 'Dining', amount: -1450, checked: true, dup: false },
  { id: 8, date: '01 Aug', merchant: 'Salary Credit PSEB', cat: 'Salary', amount: 150000, checked: true, dup: false },
];

/* ── SMS parsing engine ── */

export const SMS_LOGS = [
  { bank: 'HBL', conf: 98, raw: 'HBL: PKR 3,240.00 debited from a/c XX1234 at CARREFOUR HYPERSTAR DHA on 16-Aug-26. Avail Bal: PKR 67,180.', parsed: { Merchant: 'Carrefour Hyperstar', Category: 'Groceries', Amount: 'Rs. 3,240' } },
  { bank: 'Meezan', conf: 96, raw: 'Meezan Bank: Rs.380 debited from a/c ending 5678 for UBER PAKISTAN on 16-Aug-26. Avail Balance Rs.12,440.', parsed: { Merchant: 'Uber Pakistan', Category: 'Transport', Amount: 'Rs. 380' } },
  { bank: 'Alfalah', conf: 91, raw: 'Dear customer, Rs. 25,000 debited from Bank Alfalah a/c XX9012 as RENT PAYMENT on 15-Aug-26.', parsed: { Merchant: 'Rent — DHA Phase 6', Category: 'Housing', Amount: 'Rs. 25,000' } },
];

export const CONNECTED_BANKS = [
  { name: 'Meezan Bank', status: 'SMS Ingestion: ACTIVE', active: true, sub: 'Live Sync · Shortcode 8225' },
  { name: 'HBL', status: 'SMS Ingestion: ACTIVE', active: true, sub: 'Live Sync · Shortcode 4250' },
  { name: 'Easypaisa', status: 'API Connected', active: true, sub: 'Wallet Real-time Sync' },
  { name: 'Bank Alfalah', status: 'Sync Paused · Re-authenticate', active: false, sub: 'Action Required' },
];

export const BANK_DIRECTORY = [
  { name: 'HBL', code: 'HBL' },
  { name: 'Meezan Bank', code: 'MEZ' },
  { name: 'UBL', code: 'UBL' },
  { name: 'MCB', code: 'MCB' },
  { name: 'Bank Alfalah', code: 'ALF' },
  { name: 'Standard Chartered', code: 'SCB' },
  { name: 'Allied Bank', code: 'ABL' },
  { name: 'Faysal Bank', code: 'FBL' },
  { name: 'JazzCash', code: 'JCH' },
  { name: 'Easypaisa', code: 'EPS' },
  { name: 'NayaPay', code: 'NPY' },
  { name: 'Sadapay', code: 'SDP' },
];

export const PARSE_RULES = [
  { id: 1, label: 'Auto-categorize known merchants', enabled: true, locked: false },
  { id: 2, label: 'Flag transactions above PKR 20,000', enabled: true, locked: false },
  { id: 3, label: 'Ignore balance check SMS notifications', enabled: true, locked: false },
  { id: 4, label: 'Parse OTP & Authentication texts', enabled: false, locked: true },
];

export const PARSE_QUEUE = [
  { id: 1, from: '8225 (Meezan)', merchant: 'K-Electric', amount: 3200, category: 'Utilities' },
  { id: 2, from: '4250 (HBL)', merchant: 'Careem', amount: 1800, category: 'Commute' },
];
