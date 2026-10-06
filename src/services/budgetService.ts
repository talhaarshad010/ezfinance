/**
 * Mock Budget Service (Pure UI Mode - No Backend/Database)
 */
import { BudgetCategory } from '../store/slices/budgetSlice';

export const fetchBudget = async (): Promise<{ categories: BudgetCategory[], totalMonthlyBudget: number }> => {
  return {
    categories: [],
    totalMonthlyBudget: 150000,
  };
};

export const saveCategory = async (category: Omit<BudgetCategory, 'id'>): Promise<BudgetCategory> => {
  const id = 'cat_' + Date.now();
  return { ...category, id };
};

export const updateCategory = async (_category: BudgetCategory): Promise<void> => {
  return Promise.resolve();
};

export const deleteCategoryFromDb = async (_categoryId: string): Promise<void> => {
  return Promise.resolve();
};

export const updateMonthlyBudget = async (_amount: number): Promise<void> => {
  return Promise.resolve();
};
