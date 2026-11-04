import type { ButtonHTMLAttributes, ReactNode } from 'react';

import GoogleLogo from './GoogleLogo';

/**
 * 구글 로그인 버튼 모양 (US-39 AC1, D-097) — 구글 브랜딩 가이드(2026-11-03 확인)의 '중립(Neutral)' 테마:
 * 바탕 #F2F2F2 · 테두리 없음 · 글자 #1F1F1F, 글자 14/20 · Medium(500), 여백 왼쪽 12px · 로고 뒤 10px · 글자 뒤 12px,
 * 공식 G 로고(20px, 비율·색 그대로), 사각형 모서리.
 * 글꼴은 가이드의 Google Sans Medium (공식 14.000 같은 출처 자체 호스팅, OFL, #341). Google Sans에 한글이 없어 한글은 IBM Plex Sans KR
 */
export default function GoogleButton({ children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      className={`inline-flex h-10 w-full items-center justify-center rounded bg-google-neutral pl-3 pr-3 font-google-button text-sm font-medium leading-5 text-google-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...rest}
    >
      <span className="mr-2.5 inline-flex shrink-0">
        <GoogleLogo />
      </span>
      <span>{children}</span>
    </button>
  );
}
