import { useMemo } from 'react';
import { UserTx, useUserMode } from '../../../../context/UserModeContext';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  addAccount,
  BankAccount,
  removeAccount,
  Transaction,
  updateAccountBalance,
} from '../../../../store/slices/bankAccountsSlice';

/** How a user's account appears in the transaction sheet's account picker, e.g. "Meezan ••4521". */
export const accountLabel = (a: Pick<BankAccount, 'bankName' | 'accountNumber'>) =>
  `${a.bankName} ••${a.accountNumber.slice(-4)}`;

/** A user's transaction, shaped like the bank screens' transactions. */
const toBankTx = (t: UserTx, accountId: string): Transaction => ({
  id: String(t.id),
  accountId,
  description: t.note || t.category,
  amount: t.amount,
  type: t.type,
  category: t.category,
  date: t.date.toISOString(),
  createdAt: t.date.getTime(),
});

/**
 * Bank accounts for the bank screens: the signed-in user's own accounts, or the sample accounts
 * (Redux) in the Explore demo. A user's balance is the opening balance plus the transactions
 * logged to that account.
 */
export function useBankAccounts() {
  const userMode = useUserMode();
  const isUser = userMode.isNewUser;
  const dispatch = useAppDispatch();
  const sample = useAppSelector(state => state.bankAccounts);

  const userAccounts = useMemo(
    () =>
      userMode.bankAccounts.map(a => {
        const label = accountLabel(a);
        const net = userMode.txs
          .filter(t => t.account === label)
          .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
        return { ...a, balance: a.balance + net };
      }),
    [userMode.bankAccounts, userMode.txs],
  );

  const accounts = isUser ? userAccounts : sample.accounts;

  return {
    isUser,
    userMode,
    accounts,
    loading: isUser ? false : sample.loading,
    /** Newest first, as the account's transaction list shows them. */
    transactionsOf: (accountId: string): Transaction[] => {
      if (!isUser) return sample.transactions[accountId] || [];
      const acc = userMode.bankAccounts.find(a => a.id === accountId);
      if (!acc) return [];
      const label = accountLabel(acc);
      return userMode.txs
        .filter(t => t.account === label)
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map(t => toBankTx(t, accountId));
    },
    add: (a: BankAccount) =>
      isUser ? userMode.setBankAccounts(p => [...p, a]) : dispatch(addAccount(a)),
    remove: (id: string) =>
      isUser ? userMode.setBankAccounts(p => p.filter(a => a.id !== id)) : dispatch(removeAccount(id)),
    /** Sets what the account holds now; for a user, the opening balance absorbs the difference. */
    setBalance: (id: string, balance: number) => {
      if (!isUser) {
        dispatch(updateAccountBalance({ accountId: id, balance }));
        return;
      }
      const shown = userAccounts.find(a => a.id === id);
      if (!shown) return;
      const diff = balance - shown.balance;
      userMode.setBankAccounts(p => p.map(a => (a.id === id ? { ...a, balance: a.balance + diff } : a)));
    },
  };
}
