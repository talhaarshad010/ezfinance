import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
  phone?: string | null;
  // Collected during sign-up onboarding (all optional / skippable)
  monthlyIncome?: string | null;
  city?: string | null;
  province?: string | null;
  filerStatus?: 'yes' | 'no' | 'unsure' | null;
  /** False when the account was created with Google and has no password yet. */
  hasPassword?: boolean;
  /** True once the first-visit app tour was finished or skipped. */
  tourCompleted?: boolean;
  /** When the account was created (ISO date), for "Member since". */
  createdAt?: string;
}

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

// No one is signed in at launch, so the app always opens on the onboarding flow.
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
