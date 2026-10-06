import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BankAccount {
  id: string;
  bankId: string;
  bankName: string;
  bankColor: string;
  bankAbbreviation: string;
  accountTitle: string;
  accountNumber: string;
  balance: number;
  createdAt: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  date: string; // ISO string
  createdAt: number;
}

interface BankAccountsState {
  accounts: BankAccount[];
  transactions: Record<string, Transaction[]>; // keyed by accountId
  loading: boolean;
  error: string | null;
}

const initialAccounts: BankAccount[] = [
  {
    id: 'acc_meezan_01',
    bankId: 'meezan',
    bankName: 'Meezan Bank',
    bankColor: '#004B87',
    bankAbbreviation: 'MBL',
    accountTitle: 'Talha Arshad',
    accountNumber: '0201010349281',
    balance: 245000,
    createdAt: Date.now() - 30 * 86400000,
  },
  {
    id: 'acc_hbl_02',
    bankId: 'hbl',
    bankName: 'Habib Bank',
    bankColor: '#008248',
    bankAbbreviation: 'HBL',
    accountTitle: 'Talha Arshad',
    accountNumber: '230491829104',
    balance: 137000,
    createdAt: Date.now() - 60 * 86400000,
  },
];

const initialTransactions: Record<string, Transaction[]> = {
  acc_meezan_01: [
    {
      id: 'tx_01',
      accountId: 'acc_meezan_01',
      description: 'Consulting Retainer Income',
      amount: 150000,
      type: 'income',
      category: 'Income',
      date: new Date(Date.now() - 2 * 86400000).toISOString(),
      createdAt: Date.now() - 2 * 86400000,
    },
    {
      id: 'tx_02',
      accountId: 'acc_meezan_01',
      description: 'Metro Cash & Carry Grocery',
      amount: 18500,
      type: 'expense',
      category: 'Groceries',
      date: new Date(Date.now() - 4 * 86400000).toISOString(),
      createdAt: Date.now() - 4 * 86400000,
    },
    {
      id: 'tx_03',
      accountId: 'acc_meezan_01',
      description: 'Electricity Bill LESCO',
      amount: 24500,
      type: 'expense',
      category: 'Utilities',
      date: new Date(Date.now() - 7 * 86400000).toISOString(),
      createdAt: Date.now() - 7 * 86400000,
    },
  ],
  acc_hbl_02: [
    {
      id: 'tx_04',
      accountId: 'acc_hbl_02',
      description: 'Shell Fuel Station',
      amount: 8000,
      type: 'expense',
      category: 'Transport',
      date: new Date(Date.now() - 1 * 86400000).toISOString(),
      createdAt: Date.now() - 1 * 86400000,
    },
    {
      id: 'tx_05',
      accountId: 'acc_hbl_02',
      description: 'Dividends Payout',
      amount: 45000,
      type: 'income',
      category: 'Income',
      date: new Date(Date.now() - 10 * 86400000).toISOString(),
      createdAt: Date.now() - 10 * 86400000,
    },
  ],
};

const initialState: BankAccountsState = {
  accounts: initialAccounts,
  transactions: initialTransactions,
  loading: false,
  error: null,
};

const bankAccountsSlice = createSlice({
  name: 'bankAccounts',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setAccounts: (state, action: PayloadAction<BankAccount[]>) => {
      state.accounts = action.payload;
      state.loading = false;
    },
    addAccount: (state, action: PayloadAction<BankAccount>) => {
      const exists = state.accounts.some(a => a.id === action.payload.id);
      if (!exists) {
        state.accounts.push(action.payload);
      }
    },
    removeAccount: (state, action: PayloadAction<string>) => {
      state.accounts = state.accounts.filter(a => a.id !== action.payload);
      delete state.transactions[action.payload];
    },
    updateAccountBalance: (state, action: PayloadAction<{ accountId: string; balance: number }>) => {
      const acc = state.accounts.find(a => a.id === action.payload.accountId);
      if (acc) acc.balance = action.payload.balance;
    },
    setTransactions: (state, action: PayloadAction<{ accountId: string; transactions: Transaction[] }>) => {
      state.transactions[action.payload.accountId] = action.payload.transactions;
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      const { accountId, id } = action.payload;
      if (!state.transactions[accountId]) {
        state.transactions[accountId] = [];
      }
      const exists = state.transactions[accountId].some(t => t.id === id);
      if (!exists) {
        state.transactions[accountId].push(action.payload);
      }
    },
    removeTransaction: (state, action: PayloadAction<{ accountId: string; transactionId: string }>) => {
      const { accountId, transactionId } = action.payload;
      if (state.transactions[accountId]) {
        state.transactions[accountId] = state.transactions[accountId].filter(t => t.id !== transactionId);
      }
    },
    setAllTransactions: (state, action: PayloadAction<Record<string, Transaction[]>>) => {
      state.transactions = action.payload;
    },
    resetBankAccounts: (state) => {
      state.accounts = [];
      state.transactions = {};
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setAccounts,
  addAccount,
  removeAccount,
  updateAccountBalance,
  setTransactions,
  addTransaction,
  removeTransaction,
  setAllTransactions,
  resetBankAccounts,
} = bankAccountsSlice.actions;

export default bankAccountsSlice.reducer;
