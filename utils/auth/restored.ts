/**
 * 휴면 복원 안내 (US-38 · 06 '휴면 복원 안내' · 08 restored, BE #8 합의)
 * - 이메일 로그인: 응답 `restored: true` → 갈 화면 주소에 `restored=1`을 붙여 그 화면이 안내 (페이지를 새로 열어도 한 번)
 * - 구글 로그인: BE가 302 주소에 `restored=1`을 붙인다
 * - 로그인한 화면(RequireLogin)이 `restored`를 읽고 주소에서 지운다. 값은 `1`만 '복원됨' (안내용, 로그인 확인은 서버 응답으로)
 */
export const RESTORED_PARAM = 'restored';
export const RESTORED_TEXT = '휴면에서 돌아왔어요';

/** 사이트 안 경로에 `restored=1`을 붙인다 (다른 쿼리는 그대로) */
export function withRestored(path: string): string {
  const url = new URL(path, 'http://local');
  url.searchParams.set(RESTORED_PARAM, '1');
  return `${url.pathname}${url.search}${url.hash}`;
}

/** 지금 주소의 restored를 지우고, `1`이었으면 true */
export function takeRestoredFromUrl(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (!params.has(RESTORED_PARAM)) return false;
  const restored = params.get(RESTORED_PARAM) === '1';
  params.delete(RESTORED_PARAM);
  const rest = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${rest ? `?${rest}` : ''}${window.location.hash}`);
  return restored;
}
