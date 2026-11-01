import Link from 'next/link';
import type { ReactNode } from 'react';

import PublicFooter from './PublicFooter';

/**
 * 공개 화면 틀 (US-39, 06 SITE-01/02/04/06/07) — 위 'J의 계획'(→ /)·[로그인] · 가운데 읽기 좋은 폭 · 아래 공통 링크.
 * 메인은 본문에 [로그인]이 있어 위 [로그인]을 빼고(showLogin=false) 쓴다.
 * 로그인 확인·회원 API를 부르지 않는다 (공개 문서는 로그인/로그아웃 모두 열림).
 */
export default function PublicShell({ children, showLogin = true }: { children: ReactNode; showLogin?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col bg-tp-bg text-tp-text">
      <header className="mx-auto flex w-full max-w-[880px] items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="text-lg font-bold">
          J의 계획
        </Link>
        {showLogin && (
          <a href="/login" className="rounded-lg px-3 py-2 text-[13px] font-medium underline-offset-2 hover:underline">
            로그인
          </a>
        )}
      </header>
      <main className="mx-auto flex w-full max-w-[880px] flex-1 flex-col gap-6 px-4 pb-6">{children}</main>
      <PublicFooter />
    </div>
  );
}
