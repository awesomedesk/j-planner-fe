/**
 * CSRF 쿠키 흉내 (US-34, 08 13-1). jsdom은 http 주소에서 `__Host-` 쿠키를 받지 않아서
 * document.cookie 읽기를 대신한다. 기본은 쿠키가 있는 상태('test-csrf') — 예전 테스트는 그대로 돈다.
 *
 * @example setCsrfCookie(null)      // 아직 CSRF 쿠키를 못 받은 상태
 * @example setCsrfCookie('new-tok') // GET /auth/csrf가 새 쿠키를 준 상태
 */
export const DEFAULT_CSRF_TOKEN = 'test-csrf';

let current: string | null = DEFAULT_CSRF_TOKEN;

export const setCsrfCookie = (value: string | null) => {
  current = value;
};

export const resetCsrfCookie = () => {
  current = DEFAULT_CSRF_TOKEN;
};

export const installCsrfCookie = () => {
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    get: () => ['theme=x', current === null ? null : `__Host-XSRF-TOKEN=${encodeURIComponent(current)}`].filter(Boolean).join('; '),
    set: () => undefined,
  });
};
