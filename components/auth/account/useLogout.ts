"use client";

import { useState } from 'react';

import { useAppDispatch } from '@/app/hooks';
import { showNotice } from '@store/slices/noticeSlice';
import { authApi, isApiError, toErrorMessage } from '@utils/api';
import { LOGIN_PATH } from '@utils/auth/nextPath';
import { goTo } from '@utils/navigation';

/**
 * 로그아웃 (US-34, 08 13-3·13-4)
 * - 이 기기: POST /auth/logout
 * - 모든 기기: DELETE /me/sessions(이 기기 빼고 모두) → POST /auth/logout
 * 끝나면 로그인 화면을 새로 연다. 이미 세션이 끝나 401이면 로그아웃된 것으로 본다.
 * 서버에 못 보내면 안내만 하고 화면은 그대로 (제가 정한 부분).
 */
export function useLogout() {
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);

  const run = async (everywhere: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      if (everywhere) await authApi.logoutOtherDevices();
      await authApi.logout();
      goTo(LOGIN_PATH);
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        goTo(LOGIN_PATH);
        return;
      }
      dispatch(showNotice(toErrorMessage(error), 'error'));
      setBusy(false);
    }
  };

  return { busy, logout: () => run(false), logoutEverywhere: () => run(true) };
}
