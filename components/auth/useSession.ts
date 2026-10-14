"use client";

import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { checkSession, selectAuth } from '@store/slices/authSlice';

/** 로그인 상태. 아직 확인 안 했으면 확인한다 (앱을 열 때 한 번, US-34) */
export function useSession() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);

  useEffect(() => {
    if (auth.status === 'idle') void dispatch(checkSession());
  }, [auth.status, dispatch]);

  return { ...auth, retry: () => void dispatch(checkSession()) };
}
