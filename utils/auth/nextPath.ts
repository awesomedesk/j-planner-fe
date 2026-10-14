/** 로그인 화면 주소 (D-072) */
export const LOGIN_PATH = '/login';

/** 첫 화면 = 달력 (D-009) */
const HOME_PATH = '/';

/**
 * 로그인 뒤 갈 곳 `?next=` (US-34, D-072). **우리 사이트 안의 경로만** 받는다.
 * - `/`로 시작해야 한다. `//host`·`/\host`는 브라우저가 다른 사이트로 읽으므로 막는다
 * - 로그인 화면 자신은 돌고 돌지 않게 막는다
 * - 그 밖에는 달력(/)
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return HOME_PATH;
  let url: URL;
  try {
    url = new URL(raw, 'http://same.origin');
  } catch {
    return HOME_PATH;
  }
  if (url.origin !== 'http://same.origin') return HOME_PATH;
  if (url.pathname === LOGIN_PATH || url.pathname.startsWith(`${LOGIN_PATH}/`)) return HOME_PATH;
  return url.pathname + url.search + url.hash;
}

/** 로그인 안 한 채 연 화면 → `/login?next=<그 화면>` (첫 화면이면 next 없이) */
export function loginPathFor(current: string): string {
  return current === HOME_PATH ? LOGIN_PATH : `${LOGIN_PATH}?next=${encodeURIComponent(current)}`;
}
