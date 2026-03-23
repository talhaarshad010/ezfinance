import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  twoFactorEnabled: boolean;
  biometricsEnabled: boolean;
}

const initialState: SettingsState = {
  twoFactorEnabled: false,
  biometricsEnabled: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTwoFactor: (state, action: PayloadAction<boolean>) => {
      state.twoFactorEnabled = action.payload;
    },
    setBiometrics: (state, action: PayloadAction<boolean>) => {
      state.biometricsEnabled = action.payload;
    },
    resetSettings: (state) => {
      state.twoFactorEnabled = false;
      state.biometricsEnabled = false;
    },
  },
});

export const { setTwoFactor, setBiometrics, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
