/**
 * Mock Bank Account Service (Pure UI Mode - No Backend/Database)
 */
import { BankAccount, Transaction } from '../store/slices/bankAccountsSlice';

// ==================== ACCOUNTS ====================

export async function fetchAccounts(): Promise<BankAccount[]> {
  return [];
}

export async function saveAccount(account: Omit<BankAccount, 'id'>): Promise<BankAccount> {
  const id = 'acc_' + Date.now();
  return { ...account, id };
}

export async function deleteAccount(_accountId: string): Promise<void> {
  return Promise.resolve();
}

export async function updateBalance(_accountId: string, _balance: number): Promise<void> {
  return Promise.resolve();
}

// ==================== TRANSACTIONS ====================

export async function fetchTransactions(_accountId: string): Promise<Transaction[]> {
  return [];
}

export async function saveTransaction(
  accountId: string,
  tx: Omit<Transaction, 'id' | 'accountId'>,
): Promise<Transaction> {
  const id = 'tx_' + Date.now();
  return { id, accountId, ...tx };
}

export async function deleteTransaction(_accountId: string, _txId: string): Promise<void> {
  return Promise.resolve();
}

export async function importTransactions(
  accountId: string,
  txList: Omit<Transaction, 'id' | 'accountId'>[],
): Promise<Transaction[]> {
  return txList.map((tx, idx) => ({
    id: `tx_imported_${Date.now()}_${idx}`,
    accountId,
    ...tx,
  }));
}
