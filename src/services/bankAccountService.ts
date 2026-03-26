import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { BankAccount, Transaction } from '../store/slices/bankAccountsSlice';

const getUid = (): string => {
  const user = auth().currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.uid;
};

// ==================== ACCOUNTS ====================

export async function fetchAccounts(): Promise<BankAccount[]> {
  const uid = getUid();
  const snapshot = await database().ref(`/users/${uid}/bankAccounts`).once('value');
  const data = snapshot.val();
  if (!data) return [];
  return Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));
}

export async function saveAccount(account: Omit<BankAccount, 'id'>): Promise<BankAccount> {
  const uid = getUid();
  const ref = database().ref(`/users/${uid}/bankAccounts`).push();
  const id = ref.key!;
  const newAccount = { ...account, id };
  await ref.set(account);
  return newAccount;
}

export async function deleteAccount(accountId: string): Promise<void> {
  const uid = getUid();
  await database().ref(`/users/${uid}/bankAccounts/${accountId}`).remove();
  await database().ref(`/users/${uid}/transactions/${accountId}`).remove();
}

export async function updateBalance(accountId: string, balance: number): Promise<void> {
  const uid = getUid();
  await database().ref(`/users/${uid}/bankAccounts/${accountId}/balance`).set(balance);
}

// ==================== TRANSACTIONS ====================

export async function fetchTransactions(accountId: string): Promise<Transaction[]> {
  const uid = getUid();
  const snapshot = await database().ref(`/users/${uid}/transactions/${accountId}`).once('value');
  const data = snapshot.val();
  if (!data) return [];
  return Object.entries(data)
    .map(([id, val]: [string, any]) => ({ id, accountId, ...val }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function saveTransaction(
  accountId: string,
  tx: Omit<Transaction, 'id' | 'accountId'>,
): Promise<Transaction> {
  const uid = getUid();
  const ref = database().ref(`/users/${uid}/transactions/${accountId}`).push();
  const id = ref.key!;
  await ref.set(tx);

  // Update account balance
  const accSnap = await database().ref(`/users/${uid}/bankAccounts/${accountId}/balance`).once('value');
  const currentBalance = accSnap.val() || 0;
  const newBalance = tx.type === 'income'
    ? currentBalance + tx.amount
    : currentBalance - tx.amount;
  await database().ref(`/users/${uid}/bankAccounts/${accountId}/balance`).set(newBalance);

  return { id, accountId, ...tx };
}

export async function deleteTransaction(accountId: string, txId: string): Promise<void> {
  const uid = getUid();

  // Get transaction to reverse balance
  const txSnap = await database().ref(`/users/${uid}/transactions/${accountId}/${txId}`).once('value');
  const tx = txSnap.val();

  if (tx) {
    const accSnap = await database().ref(`/users/${uid}/bankAccounts/${accountId}/balance`).once('value');
    const currentBalance = accSnap.val() || 0;
    const newBalance = tx.type === 'income'
      ? currentBalance - tx.amount
      : currentBalance + tx.amount;
    await database().ref(`/users/${uid}/bankAccounts/${accountId}/balance`).set(newBalance);
  }

  await database().ref(`/users/${uid}/transactions/${accountId}/${txId}`).remove();
}

export async function importTransactions(
  accountId: string,
  txList: Omit<Transaction, 'id' | 'accountId'>[],
): Promise<Transaction[]> {
  const uid = getUid();
  const results: Transaction[] = [];
  let balanceDelta = 0;

  const updates: Record<string, any> = {};
  for (const tx of txList) {
    const ref = database().ref(`/users/${uid}/transactions/${accountId}`).push();
    const id = ref.key!;
    updates[`/users/${uid}/transactions/${accountId}/${id}`] = tx;
    results.push({ id, accountId, ...tx });
    balanceDelta += tx.type === 'income' ? tx.amount : -tx.amount;
  }

  await database().ref().update(updates);

  // Update balance
  const accSnap = await database().ref(`/users/${uid}/bankAccounts/${accountId}/balance`).once('value');
  const currentBalance = accSnap.val() || 0;
  await database().ref(`/users/${uid}/bankAccounts/${accountId}/balance`).set(currentBalance + balanceDelta);

  return results;
}
