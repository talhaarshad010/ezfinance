import React, { useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { useAppDispatch } from '../store/hooks';
import { setAccounts, setAllTransactions } from '../store/slices/bankAccountsSlice';
import { setBudgetData } from '../store/slices/budgetSlice';
import { BankAccount, Transaction } from '../store/slices/bankAccountsSlice';
import { BudgetCategory } from '../store/slices/budgetSlice';

interface FirebaseSyncProviderProps {
  children: React.ReactNode;
}

export const FirebaseSyncProvider: React.FC<FirebaseSyncProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // 1. Auth Listener
    const unsubscribeAuth = auth().onAuthStateChanged((user) => {
      if (user) {
        const uid = user.uid;

        // --- ACCOUNTS LISTENER ---
        const accountsRef = database().ref(`/users/${uid}/bankAccounts`);
        const onAccountsChange = accountsRef.on('value', (snapshot) => {
          const data = snapshot.val();
          if (!data) {
            dispatch(setAccounts([]));
            return;
          }
          const accountsList: BankAccount[] = Object.entries(data).map(([id, val]: [string, any]) => ({
            id,
            ...val,
          }));
          dispatch(setAccounts(accountsList));
        });

        // --- TRANSACTIONS LISTENER ---
        const transactionsRef = database().ref(`/users/${uid}/transactions`);
        const onTransactionsChange = transactionsRef.on('value', (snapshot) => {
          const data = snapshot.val();
          if (!data) {
            dispatch(setAllTransactions({}));
            return;
          }
          
          const transactionsRecord: Record<string, Transaction[]> = {};
          Object.entries(data).forEach(([accountId, txs]: [string, any]) => {
            transactionsRecord[accountId] = Object.entries(txs)
              .map(([id, val]: [string, any]) => ({
                id,
                accountId,
                ...val,
              }))
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          });
          dispatch(setAllTransactions(transactionsRecord));
        });

        // --- BUDGET LISTENER ---
        const budgetRef = database().ref(`/users/${uid}/budget`);
        const onBudgetChange = budgetRef.on('value', (snapshot) => {
          const data = snapshot.val();
          if (!data) {
            dispatch(setBudgetData({ categories: [], totalMonthlyBudget: 10000 }));
            return;
          }
          const categories: BudgetCategory[] = data.categories
            ? Object.entries(data.categories).map(([id, val]: [string, any]) => ({
                id,
                ...val,
              }))
            : [];
          dispatch(setBudgetData({
            categories,
            totalMonthlyBudget: data.totalMonthlyBudget || 10000,
          }));
        });

        // Cleanup function for this specific user
        return () => {
          accountsRef.off('value', onAccountsChange);
          transactionsRef.off('value', onTransactionsChange);
          budgetRef.off('value', onBudgetChange);
        };
      } else {
        // User logged out, store is handled by auth actions or reset
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [dispatch]);

  return <>{children}</>;
};
