import type { ButtonHTMLAttributes, ReactNode } from 'react';

import GoogleLogo from './GoogleLogo';

/**
 * 구글 로그인 버튼 모양 (US-39 AC1) — 구글 브랜드 가이드의 '중립' 테마: 연회색 바탕(#F2F2F2)·진한 글자(#1F1F1F)·
 * 왼쪽 공식 G 로고. D-022(흰 버튼 금지)의 예외 (#340 ③). 글꼴은 서비스 글꼴 그대로 (제가 정한 부분)
 */
export default function GoogleButton({ children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      className={`inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-lg bg-google-neutral px-3 text-sm font-medium text-google-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...rest}
    >
      <GoogleLogo />
      <span>{children}</span>
    </button>
  );
}
