import type { ReactNode } from 'react';

import { themeButtonClass, type ThemeButtonVariant } from '@components/button/ThemeButton';

/**
 * 로그인·가입·비밀번호 화면의 가운데 카드 (06 SITE-05, D-072·D-079)
 * - 서비스 이름 'J의 계획' 위, 모바일은 전체 폭. 헤더·사이드바 없음.
 * - `notice`는 카드 위 초록 안내 한 줄 (SITE-05a).
 * - 메일 링크 화면(/signup/verify, /password/reset)도 쓰므로 바깥 리소스를 부르지 않는다.
 */
export function AuthFrame({ notice, children }: { notice?: ReactNode; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-start justify-center bg-white fold:items-center fold:bg-tp-bg fold:px-4 fold:py-10">
      <div className="flex w-full flex-col gap-3 fold:max-w-[400px]">
        {notice}
        <section className="flex w-full flex-col gap-4 bg-white px-5 py-8 text-ink fold:rounded-2xl fold:border fold:border-tp-line fold:px-8 fold:shadow-sm">
          <h1 className="text-center text-xl font-bold">J의 계획</h1>
          {children}
        </section>
      </div>
    </main>
  );
}

/** 카드 위 초록 안내 (인증 끝·재설정 끝) */
export function AuthNotice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="mx-5 mt-4 rounded-lg bg-success-bg px-4 py-3 text-center text-sm font-medium text-success fold:mx-0 fold:mt-0">
      {children}
    </p>
  );
}

/** 카드 안 화면 제목 ('메일을 확인해 주세요' 등) */
export function AuthHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-center text-lg font-bold">{children}</h2>;
}

/** 카드 안 설명 문단 */
export function AuthText({ children, small = false }: { children: ReactNode; small?: boolean }) {
  return <p className={`text-center ${small ? 'text-xs text-tp-muted' : 'text-sm'} leading-relaxed`}>{children}</p>;
}

/** 아직 없는 기능 자리 — 점선 (D-008 방식). 눌러도 '준비 중이에요' */
export function LaterButton({ label, onClick, block = false }: { label: string; onClick: () => void; block?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border border-dashed border-tp-line px-3 py-2 text-[13px] text-tp-muted ${block ? 'w-full py-2.5 text-sm' : ''}`}
    >
      {label}
    </button>
  );
}

/** '또는' 가름줄 */
export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-tp-muted">
      <span className="h-px flex-1 bg-tp-line" />
      <span>또는</span>
      <span className="h-px flex-1 bg-tp-line" />
    </div>
  );
}

/**
 * 카드 오류 줄 — 429·서버에 못 닿음 (로그인과 같은 방식, D-072).
 * 자리를 비워 두어 문구가 생겨도 카드가 덜 흔들리게.
 */
export function CardError({ message }: { message: string | null }) {
  return <div className="min-h-5 text-center text-[13px] text-danger">{message && <p role="alert">{message}</p>}</div>;
}

/** 버튼 모양 링크 (다른 화면으로 가기: [로그인]·[다시 가입하기]·[다시 찾기]…) */
export function ButtonLink({ href, variant = 'secondary', children }: { href: string; variant?: ThemeButtonVariant; children: ReactNode }) {
  return (
    <a href={href} className={`${themeButtonClass(variant, 'md')} w-full`}>
      {children}
    </a>
  );
}

export interface AuthLinkItem {
  label: string;
  href: string;
  /** 넘어가기 전에 할 일 (예: 입력한 이메일 넘기기). 기본 이동은 막지 않는다 */
  onClick?: () => void;
}

/** 카드 아래 작은 글씨 링크: 로그인 ↔ 가입하기 ↔ 비밀번호 찾기 (SITE-05 공통 규칙) */
export function AuthLinks({ links }: { links: AuthLinkItem[] }) {
  return (
    <nav aria-label="다른 화면으로" className="flex flex-wrap items-center justify-center gap-x-2 text-[13px] text-tp-muted">
      {links.map((link, index) => (
        <span key={link.href} className="flex items-center gap-2">
          {index > 0 && <span aria-hidden="true">·</span>}
          <a href={link.href} onClick={link.onClick} className="underline-offset-2 hover:underline">
            {link.label}
          </a>
        </span>
      ))}
    </nav>
  );
}
