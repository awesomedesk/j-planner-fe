"use client";

import { useEffect, useState } from 'react';

/**
 * 메일 링크의 `?token=` (US-33·35, D-079 · 06 SITE-05 공통 규칙)
 * 읽은 뒤 주소창에서 지운다(history.replaceState) — 기록·화면 공유·Referer로 새지 않게.
 * 처음 그릴 때 읽고(StrictMode에서 두 번 읽어도 같은 값), 지우기는 화면이 뜬 뒤에.
 */
export function useMailLinkToken(): string {
  const [token] = useState(() => (typeof window === 'undefined' ? '' : (new URLSearchParams(window.location.search).get('token') ?? '')));

  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
  }, []);

  return token;
}
