/**
 * CSRF 토큰 (US-34, 08 13-1). BE(Spring Security csrf.spa)가 `GET /auth/csrf`로 주는 쿠키를 읽어
 * 바꾸는 요청(POST·PUT·PATCH·DELETE)마다 같은 값을 헤더로 보낸다.
 */
export const CSRF_COOKIE = '__Host-XSRF-TOKEN';
export const CSRF_HEADER = 'X-XSRF-TOKEN';

/** 쿠키 문자열에서 CSRF 토큰을 꺼낸다. 없으면 null */
export function readCsrfToken(cookie: string = typeof document === 'undefined' ? '' : document.cookie): string | null {
  for (const part of cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === CSRF_COOKIE) {
      const value = decodeURIComponent(rest.join('='));
      return value || null;
    }
  }
  return null;
}
