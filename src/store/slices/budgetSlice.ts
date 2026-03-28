import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  limit: number;
  color: string;
  isMain?: boolean;
}

interface BudgetState {
  categories: BudgetCategory[];
  totalMonthlyBudget: number;
}

const initialState: BudgetState = {
  totalMonthlyBudget: 10000,
  categories: [],
};

const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {
    setBudgetData: (state, action: PayloadAction<{ categories: BudgetCategory[], totalMonthlyBudget: number }>) => {
      state.categories = action.payload.categories;
      state.totalMonthlyBudget = action.payload.totalMonthlyBudget;
    },
    setTotalMonthlyBudget: (state, action: PayloadAction<number>) => {
      state.totalMonthlyBudget = action.payload;
    },
    addCategory: (state, action: PayloadAction<BudgetCategory>) => {
      state.categories.push(action.payload);
    },
    updateCategory: (state, action: PayloadAction<BudgetCategory>) => {
      const index = state.categories.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.categories[index] = action.payload;
      }
    },
    deleteCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(c => c.id !== action.payload);
    },
  },
});

export const { setBudgetData, setTotalMonthlyBudget, addCategory, updateCategory, deleteCategory } = budgetSlice.actions;
export default budgetSlice.reducer;
