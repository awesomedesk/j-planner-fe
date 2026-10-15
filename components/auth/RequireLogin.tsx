"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { useAppDispatch } from '@/app/hooks';
import type { Me } from '@/types/api';
import ThemeButton from '@components/button/ThemeButton';
import { sessionRenewed } from '@store/slices/authSlice';
import { authApi, setUnauthenticatedHandler } from '@utils/api';
import { isSameAccount } from '@utils/auth/account';
import { loginPathFor } from '@utils/auth/nextPath';
import { currentPath, goTo } from '@utils/navigation';

import ReloginDialog from './ReloginDialog';
import { useSession } from './useSession';

/** 서버에 닿지 않을 때 (ServerStatusCheck와 같은 문구) */
const UNREACHABLE = '서버에 연결할 수 없어요. 잠시 후 다시 시도하세요.';

/**
 * RequireLogin - 로그인해야 보이는 앱 화면 (US-34, D-072)
 * - 확인하는 동안에는 아무것도 그리지 않는다 (데이터 요청이 401로 실패하지 않게)
 * - 로그인 안 했으면 `/login?next=<지금 화면>`
 * - 보던 중 세션이 끝나 보기 요청(GET)이 401이면 같은 곳으로
 * - **저장(바꾸는 요청)이 401이면** 쓰던 창 위에 로그인 창 → 같은 계정이면 새 CSRF로 같은 저장을 이어서,
 *   다른 계정이면 이어서 저장하지 않고 화면을 새로 연다 (남의 계정에 저장 방지)
 * - 로그인 창이 떠 있는 동안 온 401(보기 포함)은 그 창의 결과를 함께 기다린다 (제가 정한 부분)
 * - 서버에 닿지 않으면 로그인 화면으로 보내지 않고 안내 + [다시 시도] (제가 정한 부분)
 */
export default function RequireLogin({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { status, me, retry } = useSession();
  /** 떠 있는 로그인 창의 결과 (true = 같은 계정으로 다시 로그인함) */
  const [prompt, setPrompt] = useState<{ resolve: (signedInAgain: boolean) => void } | null>(null);
  const pendingRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    if (status === 'signedOut') goTo(loginPathFor(currentPath()));
  }, [status]);

  useEffect(() => {
    if (status !== 'signedIn') return;
    setUnauthenticatedHandler(({ method }) => {
      if (pendingRef.current) return pendingRef.current;
      if (method === 'GET') {
        goTo(loginPathFor(currentPath()));
        return Promise.resolve(false);
      }
      const pending = new Promise<boolean>((resolve) => setPrompt({ resolve })).finally(() => {
        pendingRef.current = null;
      });
      pendingRef.current = pending;
      return pending;
    });
    return () => setUnauthenticatedHandler(null);
  }, [status]);

  const onSignedIn = async (next: Me) => {
    if (!prompt) return;
    if (!me || !isSameAccount(me, next)) {
      // 다른 계정: 쓰던 것을 그 계정에 저장하지 않는다. store에 남은 이전 계정 데이터도 버린다
      goTo(currentPath());
      return;
    }
    await authApi.csrf();
    dispatch(sessionRenewed(next));
    setPrompt(null);
    prompt.resolve(true);
  };

  /** [취소]·Esc: 창만 닫고 그 저장은 실패로 끝낸다 — 쓰던 창은 그대로 (제가 정한 부분) */
  const onCancel = useCallback(() => {
    if (!prompt) return;
    setPrompt(null);
    prompt.resolve(false);
  }, [prompt]);

  if (status === 'error') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-tp-bg px-4 text-center text-sm text-tp-text">
        <p>{UNREACHABLE}</p>
        <ThemeButton variant="primary" onClick={retry}>
          다시 시도
        </ThemeButton>
      </div>
    );
  }
  if (status !== 'signedIn') return null;
  return (
    <>
      {children}
      {prompt && <ReloginDialog email={me?.email ?? ''} onSignedIn={onSignedIn} onCancel={onCancel} />}
    </>
  );
}
