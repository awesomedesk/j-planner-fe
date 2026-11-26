/**
 * 화면(HTML) CSP 정책 (#417 US-44 A02, PO 결정 1) — 지금은 Report-Only로만 보낸다(막기 전환은 배포 준비 때 🚧).
 * 스크립트: 같은 출처 + 요청마다 새 nonce(Next가 자기 스크립트에 붙임) + strict-dynamic. 인라인·eval 없음.
 * 스타일: 항목 색을 style 속성으로 쓰므로(CLAUDE.md 테마 규칙) 'unsafe-inline'을 둔다.
 * 개발 서버(next dev)만 'unsafe-eval'(React 디버그)과 웹소켓(화면 새로 고침)을 더 연다.
 */
export interface CspOptions {
  nonce: string;
  isDev: boolean;
  /** API가 다른 출처일 때 그 출처 (NEXT_PUBLIC_API_BASE_URL). 같은 주소면 null */
  apiOrigin?: string | null;
}

export const buildContentSecurityPolicy = ({ nonce, isDev, apiOrigin }: CspOptions): string =>
  [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    ["connect-src 'self'", apiOrigin, isDev ? 'ws: wss:' : null].filter(Boolean).join(' '),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

/** 절대 주소면 출처(https://host), 비었거나 상대 주소면 null */
export const apiOriginOf = (baseUrl: string | null | undefined): string | null => {
  if (!baseUrl) return null;
  try {
    return new URL(baseUrl).origin;
  } catch {
    return null;
  }
};

/** 요청마다 새 nonce (base64, 128비트) */
export const createNonce = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
};
