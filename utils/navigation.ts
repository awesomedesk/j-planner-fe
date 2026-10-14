/**
 * 페이지 이동 (US-34). 로그인·로그아웃·세션 끝은 **페이지를 새로 연다** — 다른 계정의 데이터가
 * store에 남지 않게 하고, 앱을 열 때 하는 일(CSRF 받기·로그인 확인)을 다시 하게 한다.
 * 뒤로 가기로 로그인 화면에 되돌아오지 않게 replace를 쓴다.
 */
export function goTo(url: string) {
  window.location.replace(url);
}

/** 지금 화면의 경로 + 쿼리 (?next=에 넣을 값) */
export function currentPath() {
  return window.location.pathname + window.location.search;
}
