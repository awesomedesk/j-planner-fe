/**
 * 화면 사이에 넘기는 값 (US-33·35, D-079 · 06 SITE-05 공통 규칙)
 * - 이메일은 **주소(URL)에 넣지 않는다**(기록·공유로 새어 나감). 같은 탭의 sessionStorage로만 넘긴다.
 * - 받는 화면은 처음 그릴 때 `peek…`로 읽고, 화면이 뜬 뒤 `clear…`로 지운다
 *   (StrictMode에서 처음 값을 두 번 계산해도 같은 값이 나오게 읽기와 지우기를 나눈다).
 * - sessionStorage를 못 쓰는 브라우저(막힘·사생활 보호)는 빈 값으로 넘어간다.
 */
const EMAIL_KEY = 'jp.auth.email';
const NOTICE_KEY = 'jp.auth.loginNotice';

/** 로그인 화면 카드 위 초록 안내 (SITE-05a) */
export type LoginNotice = 'verified' | 'passwordReset';

export const LOGIN_NOTICE_TEXT: Record<LoginNotice, string> = {
  verified: '인증이 끝났어요. 로그인해 주세요',
  passwordReset: '비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요',
};

function write(key: string, value: string | null) {
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {
    // 못 쓰면 넘기지 않는다 (받는 화면은 빈 칸)
  }
}

function read(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/** 다음 화면에 이메일 넘기기 (빈 값이면 넘기지 않음) */
export const passEmail = (email: string) => write(EMAIL_KEY, email.trim() || null);
/** 넘겨받은 이메일 (없으면 '') */
export const peekHandoffEmail = () => read(EMAIL_KEY) ?? '';
export const clearHandoffEmail = () => write(EMAIL_KEY, null);

export const passLoginNotice = (notice: LoginNotice) => write(NOTICE_KEY, notice);
export function peekLoginNotice(): LoginNotice | null {
  const value = read(NOTICE_KEY);
  return value === 'verified' || value === 'passwordReset' ? value : null;
}
export const clearLoginNotice = () => write(NOTICE_KEY, null);
