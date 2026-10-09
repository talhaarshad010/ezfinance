import { useMemo } from 'react';
import { useUserMode } from '../../../../context/UserModeContext';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  addCategory,
  BudgetCategory,
  deleteCategory,
  setTotalMonthlyBudget,
  updateCategory,
} from '../../../../store/slices/budgetSlice';

const isThisMonth = (d: Date) => {
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

/**
 * The Budget Planner's data: the signed-in user's own monthly budget, envelopes and this month's
 * spending, or the sample budget (Redux) in the Explore demo. Both expose the same shape.
 */
export function useBudgetPlan() {
  const userMode = useUserMode();
  const isUser = userMode.isNewUser;
  const dispatch = useAppDispatch();

  const sampleCategories = useAppSelector(state => state.budget.categories);
  const sampleTotal = useAppSelector(state => state.budget.totalMonthlyBudget);
  const accounts = useAppSelector(state => state.bankAccounts.accounts);
  const sampleTxMap = useAppSelector(state => state.bankAccounts.transactions);

  // This month's expense transactions as { category, amount }.
  const monthExpenses = useMemo(() => {
    if (isUser) {
      return userMode.txs
        .filter(t => t.type === 'expense' && isThisMonth(t.date))
        .map(t => ({ category: t.category, amount: t.amount }));
    }
    const now = new Date();
    return Object.values(sampleTxMap)
      .flat()
      .filter(tx => {
        const d = new Date(tx.date);
        return (
          tx.type === 'expense' &&
          d.getUTCMonth() === now.getMonth() &&
          d.getUTCFullYear() === now.getFullYear()
        );
      })
      .map(tx => ({ category: tx.category, amount: tx.amount }));
  }, [isUser, userMode.txs, sampleTxMap]);

  const categories = isUser ? userMode.envelopes : sampleCategories;

  /** Spent this month in an envelope (a user's envelope matches transaction categories by name). */
  const spentIn = (cat: BudgetCategory) =>
    monthExpenses
      .filter(e => (isUser ? (e.category ?? '').toLowerCase() === cat.name.trim().toLowerCase() : e.category === cat.name))
      .reduce((a, e) => a + e.amount, 0);

  return {
    isUser,
    categories,
    /** False until a user sets a monthly budget (the sample always has one). */
    hasBudget: isUser ? userMode.budget !== null : true,
    totalMonthlyBudget: isUser ? userMode.budget ?? 0 : sampleTotal,
    spentIn,
    /** All spending this month, in or out of envelopes. */
    monthSpent: monthExpenses.reduce((a, e) => a + e.amount, 0),
    /** Linked account balance (sample only; 0 for users, who have no linked accounts yet). */
    accountBalance: isUser ? 0 : accounts.reduce((a, c) => a + c.balance, 0),
    setTotal: (n: number) => (isUser ? userMode.setBudget(n) : dispatch(setTotalMonthlyBudget(n))),
    add: (c: BudgetCategory) =>
      isUser ? userMode.setEnvelopes(p => [...p, c]) : dispatch(addCategory(c)),
    update: (c: BudgetCategory) =>
      isUser
        ? userMode.setEnvelopes(p => p.map(x => (x.id === c.id ? c : x)))
        : dispatch(updateCategory(c)),
    remove: (id: string) =>
      isUser ? userMode.setEnvelopes(p => p.filter(x => x.id !== id)) : dispatch(deleteCategory(id)),
  };
}
