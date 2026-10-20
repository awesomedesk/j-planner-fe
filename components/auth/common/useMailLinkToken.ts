"use client";

import { useEffect, useState, useSyncExternalStore } from 'react';

const noSubscribe = () => () => {};

/**
 * 메일 링크의 `?token=` (US-33·35, D-079 · 06 SITE-05 공통 규칙)
 * 읽은 뒤 주소창에서 지운다(history.replaceState) — 기록·화면 공유·Referer로 새지 않게.
 * 처음 그릴 때 읽고(StrictMode에서 두 번 읽어도 같은 값), 지우기는 화면이 뜬 뒤에.
 * @returns 토큰 (없으면 ''). 서버 렌더와 hydration 중에는 null — 서버는 토큰을 모르므로
 *   그때는 화면을 정하지 않아야 서버·브라우저 첫 화면이 같다 (hydration 오류 방지)
 */
export function useMailLinkToken(): string | null {
  const [token] = useState(() => (typeof window === 'undefined' ? '' : (new URLSearchParams(window.location.search).get('token') ?? '')));
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);

  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
  }, []);

  return hydrated ? token : null;
}
