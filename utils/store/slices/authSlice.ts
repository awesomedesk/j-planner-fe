import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Me } from '@/types/api';
import { authApi, isApiError } from '@utils/api';

import type { RootState } from '../store';

/**
 * 로그인 상태 (US-34)
 * - idle: 아직 확인 안 함 · checking: 확인 중
 * - signedIn: 로그인함(me 있음) · signedOut: 로그인 안 함
 * - error: 서버에 닿지 않아 모름 (로그인 화면으로 보내지 않고 다시 시도하게)
 */
export type AuthStatus = 'idle' | 'checking' | 'signedIn' | 'signedOut' | 'error';

interface AuthState {
  status: AuthStatus;
  me: Me | null;
}

const initialState: AuthState = { status: 'idle', me: null };

/** 앱을 열 때: CSRF 쿠키를 받고(GET /auth/csrf) 로그인했는지 확인(GET /me) — 08 13-1·13-4 */
export const checkSession = createAsyncThunk<Me | null, void, { state: RootState }>(
  'auth/checkSession',
  async () => {
    await authApi.csrf();
    try {
      return await authApi.me();
    } catch (error) {
      if (isApiError(error) && error.status === 401) return null;
      throw error;
    }
  },
  { condition: (_, { getState }) => getState().auth.status !== 'checking' }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** 작성 중 세션이 끝나 같은 계정으로 다시 로그인했을 때 (D-072) */
    sessionRenewed: (state, action: PayloadAction<Me>) => {
      state.me = action.payload;
      state.status = 'signedIn';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkSession.pending, (state) => {
        state.status = 'checking';
      })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.me = action.payload;
        state.status = action.payload ? 'signedIn' : 'signedOut';
      })
      .addCase(checkSession.rejected, (state) => {
        state.status = 'error';
      });
  },
});

export const { sessionRenewed } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;

export default authSlice.reducer;
