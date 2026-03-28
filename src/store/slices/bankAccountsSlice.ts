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

const initialState: BankAccountsState = {
  accounts: [],
  transactions: {},
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
      state.accounts.push(action.payload);
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
      const { accountId } = action.payload;
      if (!state.transactions[accountId]) {
        state.transactions[accountId] = [];
      }
      state.transactions[accountId].push(action.payload);
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
