import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
  phone?: string | null;
}

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.loading = false;
      state.error = null;
    },
    updatePhoto: (state, action: PayloadAction<string | null>) => {
      if (state.profile) {
        state.profile.photoURL = action.payload;
      }
    },
    updateName: (state, action: PayloadAction<string>) => {
      if (state.profile) {
        state.profile.name = action.payload;
      }
    },
    updatePhone: (state, action: PayloadAction<string | null>) => {
      if (state.profile) {
        state.profile.phone = action.payload;
      }
    },
    clearProfile: (state) => {
      state.profile = null;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setProfile, updatePhoto, updateName, updatePhone, clearProfile, setLoading, setError } = userSlice.actions;
export default userSlice.reducer;
