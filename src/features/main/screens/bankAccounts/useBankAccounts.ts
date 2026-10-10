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
import { accountsApi } from '../../../../api/accountsApi';
import { uuidv4 } from '../../../../utils/uuid';
import { toBankAccount } from '../../../../services/transactionMapping';
import { getBankById } from '../../../../constants/pakistaniBanks';

/** How an account appears in pickers and lists, e.g. "Meezan ••4521". */
export const accountLabel = (a: Pick<BankAccount, 'bankName' | 'accountNumber'>) =>
  `${a.bankName} ••${a.accountNumber.slice(-4)}`;

/** Name of the account a transaction moved through, or "Removed account". */
export const accountNameOf = (accountId: string | null | undefined, accounts: BankAccount[]) => {
  const acc = accounts.find(a => a.id === accountId);
  return acc ? accountLabel(acc) : 'Removed account';
};

/** Ids of transfer rows in an account's list start with this. */
export const TRANSFER_PREFIX = 'transfer:';

/** A user's transaction, shaped like the bank screens' transactions. */
const toBankTx = (t: UserTx, accountId: string): Transaction => ({
  id: t.id,
  accountId,
  description: t.note || t.category,
  amount: t.amount,
  type: t.type,
  category: t.category,
  date: t.date.toISOString(),
  createdAt: t.date.getTime(),
});

export interface NewAccount {
  bankId: string;
  bankName: string;
  accountTitle: string;
  /** The full number stays on the phone; only its last 4 digits are saved. */
  accountNumber: string;
  balance: number;
}

/**
 * Bank accounts for the bank screens: the signed-in user's linked accounts (saved on the server),
 * or the sample accounts (Redux) in the Explore demo. A user's balance is the opening balance plus
 * the transactions linked to that account, so it moves as soon as a transaction changes.
 * Adding, updating and removing a user's account need a connection; a failed save is undone and
 * the error is thrown for the caller to show.
 */
export function useBankAccounts() {
  const userMode = useUserMode();
  const isUser = userMode.isNewUser;
  const dispatch = useAppDispatch();
  const sample = useAppSelector(state => state.bankAccounts);

  const userAccounts = useMemo(
    () =>
      userMode.bankAccounts.map(a => {
        const net = userMode.txs
          .filter(t => t.accountId === a.id)
          .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
        // Transfers move money between the user's own accounts.
        const moved = userMode.transfers.reduce(
          (sum, t) => sum + (t.toAccountId === a.id ? t.amount : 0) - (t.fromAccountId === a.id ? t.amount : 0),
          0,
        );
        return { ...a, balance: a.balance + net + moved };
      }),
    [userMode.bankAccounts, userMode.txs, userMode.transfers],
  );

  const accounts = isUser ? userAccounts : sample.accounts;

  return {
    isUser,
    userMode,
    accounts,
    loading: isUser ? false : sample.loading,
    /**
     * Newest first, as the account's transaction list shows them. A user's transfers are included
     * (ids start with "transfer:"): money out of the account as an expense, money in as income.
     */
    transactionsOf: (accountId: string): Transaction[] => {
      if (!isUser) return sample.transactions[accountId] || [];
      const own = userMode.txs.filter(t => t.accountId === accountId).map(t => toBankTx(t, accountId));
      const moved = userMode.transfers
        .filter(t => t.fromAccountId === accountId || t.toAccountId === accountId)
        .map((t): Transaction => {
          const out = t.fromAccountId === accountId;
          const other = accountNameOf(out ? t.toAccountId : t.fromAccountId, userMode.bankAccounts);
          return {
            id: `${TRANSFER_PREFIX}${t.id}`,
            accountId,
            description: out ? `Transfer to ${other}` : `Transfer from ${other}`,
            amount: t.amount,
            type: out ? 'expense' : 'income',
            category: 'Transfer',
            date: t.date.toISOString(),
            createdAt: t.date.getTime(),
          };
        });
      return [...own, ...moved].sort((a, b) => b.createdAt - a.createdAt);
    },
    add: async (input: NewAccount) => {
      const digits = input.accountNumber.replace(/\D/g, '');
      if (!isUser) {
        dispatch(
          addAccount({
            id: `acc_${Date.now()}`,
            bankId: input.bankId,
            bankName: input.bankName,
            bankColor: getBankById(input.bankId)?.color ?? '#555555',
            bankAbbreviation: getBankById(input.bankId)?.abbreviation ?? input.bankName.slice(0, 3).toUpperCase(),
            accountTitle: input.accountTitle,
            accountNumber: input.accountNumber,
            balance: input.balance,
            createdAt: Date.now(),
          }),
        );
        return;
      }
      const id = uuidv4();
      const created = await accountsApi.create({
        id,
        bankId: input.bankId,
        bankName: input.bankName,
        accountTitle: input.accountTitle.trim(),
        accountLast4: digits.slice(-4),
        balance: input.balance,
      });
      userMode.setBankAccounts(p => [...p.filter(a => a.id !== id), toBankAccount(created)]);
    },
    remove: async (id: string) => {
      if (!isUser) {
        dispatch(removeAccount(id));
        return;
      }
      const index = userMode.bankAccounts.findIndex(a => a.id === id);
      const removed = userMode.bankAccounts[index];
      userMode.setBankAccounts(p => p.filter(a => a.id !== id));
      try {
        await accountsApi.remove(id);
      } catch (error) {
        if (removed) {
          userMode.setBankAccounts(p => {
            const n = [...p];
            n.splice(Math.min(index, n.length), 0, removed);
            return n;
          });
        }
        throw error;
      }
    },
    /** Sets what the account holds now; for a user, the opening balance absorbs the difference. */
    setBalance: async (id: string, balance: number) => {
      if (!isUser) {
        dispatch(updateAccountBalance({ accountId: id, balance }));
        return;
      }
      const shown = userAccounts.find(a => a.id === id);
      const before = userMode.bankAccounts.find(a => a.id === id);
      if (!shown || !before) return;
      const diff = balance - shown.balance;
      userMode.setBankAccounts(p => p.map(a => (a.id === id ? { ...a, balance: a.balance + diff } : a)));
      try {
        await accountsApi.updateBalance(id, balance);
      } catch (error) {
        userMode.setBankAccounts(p => p.map(a => (a.id === id ? before : a)));
        throw error;
      }
    },
  };
}
