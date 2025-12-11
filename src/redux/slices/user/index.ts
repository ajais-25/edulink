import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SocialLinks {
  linkedIn?: string;
  twitter?: string;
}

export interface Profile {
  bio?: string;
  avatar?: {
    fileId: string;
    url: string;
  };
  socialLinks?: SocialLinks;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "student" | "instructor";
  profile?: Profile;
  isVerified: boolean;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { setUser, clearUser, setLoading, setError } = userSlice.actions;
export default userSlice.reducer;
