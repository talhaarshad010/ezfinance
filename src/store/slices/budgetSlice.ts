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

const initialCategories: BudgetCategory[] = [
  {
    id: 'cat_housing',
    name: 'Housing & Rent',
    icon: 'home',
    limit: 60000,
    color: '#0047AB',
    isMain: true,
  },
  {
    id: 'cat_groceries',
    name: 'Groceries & Dining',
    icon: 'coffee',
    limit: 35000,
    color: '#00C853',
    isMain: true,
  },
  {
    id: 'cat_transport',
    name: 'Transportation & Fuel',
    icon: 'truck',
    limit: 15000,
    color: '#FF9500',
    isMain: true,
  },
  {
    id: 'cat_utilities',
    name: 'Utilities & Bills',
    icon: 'zap',
    limit: 18000,
    color: '#5AC8FA',
    isMain: false,
  },
  {
    id: 'cat_shopping',
    name: 'Shopping & Essentials',
    icon: 'shopping-bag',
    limit: 12000,
    color: '#AF52DE',
    isMain: false,
  },
];

const initialState: BudgetState = {
  totalMonthlyBudget: 150000,
  categories: initialCategories,
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
