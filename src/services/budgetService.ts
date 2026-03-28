import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { BudgetCategory } from '../store/slices/budgetSlice';

const getUid = (): string => {
  const user = auth().currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.uid;
};

export const fetchBudget = async (): Promise<{ categories: BudgetCategory[], totalMonthlyBudget: number }> => {
  const uid = getUid();
  const snapshot = await database().ref(`/users/${uid}/budget`).once('value');
  const data = snapshot.val();
  
  if (!data) {
    return { categories: [], totalMonthlyBudget: 10000 };
  }

  const categories = data.categories 
    ? Object.entries(data.categories).map(([id, val]: [string, any]) => ({ id, ...val }))
    : [];

  return {
    categories,
    totalMonthlyBudget: data.totalMonthlyBudget || 10000
  };
};

export const saveCategory = async (category: Omit<BudgetCategory, 'id'>): Promise<BudgetCategory> => {
  const uid = getUid();
  const ref = database().ref(`/users/${uid}/budget/categories`).push();
  const id = ref.key!;
  const newCategory = { ...category, id };
  await ref.set(newCategory);
  return newCategory;
};

export const updateCategory = async (category: BudgetCategory): Promise<void> => {
  const uid = getUid();
  await database().ref(`/users/${uid}/budget/categories/${category.id}`).set(category);
};

export const deleteCategoryFromDb = async (categoryId: string): Promise<void> => {
  const uid = getUid();
  await database().ref(`/users/${uid}/budget/categories/${categoryId}`).remove();
};

export const updateMonthlyBudget = async (amount: number): Promise<void> => {
  const uid = getUid();
  await database().ref(`/users/${uid}/budget/totalMonthlyBudget`).set(amount);
};
