import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import settingsReducer from './slices/settingsSlice';
import bankAccountsReducer from './slices/bankAccountsSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    settings: settingsReducer,
    bankAccounts: bankAccountsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
