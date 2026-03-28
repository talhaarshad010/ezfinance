import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  twoFactorEnabled: boolean;
}

const initialState: SettingsState = {
  twoFactorEnabled: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTwoFactor: (state, action: PayloadAction<boolean>) => {
      state.twoFactorEnabled = action.payload;
    },
    resetSettings: (state) => {
      state.twoFactorEnabled = false;
    },
  },
});

export const { setTwoFactor, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
