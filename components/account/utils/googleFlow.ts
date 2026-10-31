/**
 * 내 계정에서 구글로 떠날 때 '무엇을 하러 갔는지'(본인 확인 / 연결)만 같은 탭에 적어 둔다 (US-37, 제가 정한 부분).
 * BE는 둘 다 실패하면 `/me?error=GOOGLE_FAILED`로 돌려보내서, 이 표시로 06 SITE-09의 두 문구를 고른다.
 * 비밀번호·탈퇴 같은 작업 내용은 적지 않는다 (돌아와서 저절로 실행하지 않게).
 */
const KEY = 'jp.account.googleFlow';

export type GoogleFlow = 'reauth' | 'connect';

export function markGoogleFlow(flow: GoogleFlow) {
  try {
    window.sessionStorage.setItem(KEY, flow);
  } catch {
    // 못 쓰면 연결 문구로 본다
  }
}

/** 읽기만 (없으면 null) — 처음 그릴 때. 지우기는 화면이 뜬 뒤 clearGoogleFlow (StrictMode에서 두 번 읽어도 같게) */
export function peekGoogleFlow(): GoogleFlow | null {
  try {
    const value = window.sessionStorage.getItem(KEY);
    return value === 'reauth' || value === 'connect' ? value : null;
  } catch {
    return null;
  }
}

export function clearGoogleFlow() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // 못 지우면 다음 결과 때 다시 읽힐 뿐
  }
}
