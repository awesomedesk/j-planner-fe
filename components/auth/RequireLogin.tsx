"use client";

import { useEffect, type ReactNode } from 'react';

import ThemeButton from '@components/button/ThemeButton';
import { setUnauthenticatedHandler } from '@utils/api';
import { loginPathFor } from '@utils/auth/nextPath';
import { currentPath, goTo } from '@utils/navigation';

import { useSession } from './useSession';

/** 서버에 닿지 않을 때 (ServerStatusCheck와 같은 문구) */
const UNREACHABLE = '서버에 연결할 수 없어요. 잠시 후 다시 시도하세요.';

/**
 * RequireLogin - 로그인해야 보이는 앱 화면 (US-34, D-072)
 * - 확인하는 동안에는 아무것도 그리지 않는다 (데이터 요청이 401로 실패하지 않게)
 * - 로그인 안 했으면 `/login?next=<지금 화면>`
 * - 보던 중 세션이 끝나 어느 API든 401이면 같은 곳으로
 * - 서버에 닿지 않으면 로그인 화면으로 보내지 않고 안내 + [다시 시도] (제가 정한 부분)
 */
export default function RequireLogin({ children }: { children: ReactNode }) {
  const { status, retry } = useSession();

  useEffect(() => {
    if (status === 'signedOut') goTo(loginPathFor(currentPath()));
  }, [status]);

  useEffect(() => {
    if (status !== 'signedIn') return;
    setUnauthenticatedHandler(async () => {
      goTo(loginPathFor(currentPath()));
      return false;
    });
    return () => setUnauthenticatedHandler(null);
  }, [status]);

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
  return <>{children}</>;
}
