import { goTo } from '@utils/navigation';

import { safeNextPath } from './nextPath';

/**
 * 구글 로그인 (US-36, D-082 · 08 13-3·13-5)
 * fetch가 아니라 **브라우저 이동**으로 시작한다(같은 주소, Next rewrites로 BE). 결과는 BE가 FE 주소로 302.
 * - 로그인·가입 화면: `/api/v1/auth/google?next=` → 성공 / 또는 `/login?error=코드`
 * - 작성 중 '다시 로그인' 창: 팝업 `?popup=true` → 끝 화면 `/login/google-done(?error=코드)`이 원래 창에 알리고 닫힘
 */
const GOOGLE_START = '/api/v1/auth/google';

/** 다시 로그인 창이 여는 팝업 주소 (AC4) */
export const GOOGLE_POPUP_PATH = `${GOOGLE_START}?popup=true`;

/** 팝업 끝 화면 → 원래 창 메시지 종류 */
export const GOOGLE_DONE_MESSAGE = 'jp:google-done';

const POPUP_NAME = 'jp-google-login';
const POPUP_FEATURES = 'popup,width=480,height=640';
/** 팝업이 그냥 닫혔는지 보는 간격 */
const CLOSED_CHECK_MS = 500;

/** 로그인 화면·가입 화면의 [구글로 계속하기] 이동 주소. next는 사이트 안 경로만 (D-082 6) */
export function googleStartPath(next?: string | null): string {
  const safe = next ? safeNextPath(next) : '/';
  return safe === '/' ? GOOGLE_START : `${GOOGLE_START}?next=${encodeURIComponent(safe)}`;
}

/** [구글로 계속하기]·[구글로 로그인]: 구글 로그인으로 브라우저 이동 */
export function startGoogleLogin(next?: string | null): void {
  goTo(googleStartPath(next));
}

/** BE가 돌려주는 결과 코드 (06 SITE-05a) */
export type GoogleResultCode = 'GOOGLE_FAILED' | 'GOOGLE_EMAIL_ACCOUNT_EXISTS' | 'ACCOUNT_SUSPENDED' | 'GOOGLE_NOT_REGISTERED';

const KNOWN_CODES: readonly string[] = ['GOOGLE_EMAIL_ACCOUNT_EXISTS', 'ACCOUNT_SUSPENDED', 'GOOGLE_NOT_REGISTERED'];

const RESULT_TEXT: Record<GoogleResultCode | 'POPUP_BLOCKED', string> = {
  GOOGLE_FAILED: '구글 로그인을 마치지 못했어요. 다시 시도해 주세요.',
  GOOGLE_EMAIL_ACCOUNT_EXISTS: '이 이메일로 가입한 계정이 있어요. 이메일로 로그인한 뒤 내 계정에서 구글을 연결해 주세요.',
  ACCOUNT_SUSPENDED: '이용이 제한된 계정이에요.',
  // 팝업에서 처음 보는 구글 — 다시 로그인 창은 가입하지 않는다 (D-085)
  GOOGLE_NOT_REGISTERED: '이 구글 계정으로 가입된 계정이 없어요',
  // 브라우저가 팝업을 막았을 때 (제가 정한 부분)
  POPUP_BLOCKED: '팝업이 막혀 있어요. 이 사이트의 팝업을 허용한 뒤 다시 눌러 주세요.',
};

/** 주소의 `?error=` → 아는 코드. 없으면 null, 모르는 코드는 GOOGLE_FAILED (제가 정한 부분) */
export function toGoogleResultCode(raw: string | null | undefined): GoogleResultCode | null {
  if (!raw) return null;
  return KNOWN_CODES.includes(raw) ? (raw as GoogleResultCode) : 'GOOGLE_FAILED';
}

/** 결과 코드 → 화면 문구 */
export function googleResultMessage(code: GoogleResultCode | 'POPUP_BLOCKED'): string {
  return RESULT_TEXT[code];
}

/** 팝업 결과: 성공 / 실패(코드) / null = 알리지 않고 닫음 */
export type GooglePopupResult = { ok: true } | { ok: false; code: GoogleResultCode | 'POPUP_BLOCKED' } | null;

/**
 * 다시 로그인 창의 [Google로 계속하기] (AC4) — 팝업을 열고 끝 화면이 알릴 때까지 기다린다.
 * **같은 출처(origin)이면서 그 팝업에서 온** 메시지만 받는다.
 */
export function signInWithGooglePopup(): Promise<GooglePopupResult> {
  const popup = window.open(GOOGLE_POPUP_PATH, POPUP_NAME, POPUP_FEATURES);
  if (!popup) return Promise.resolve({ ok: false, code: 'POPUP_BLOCKED' });

  return new Promise((resolve) => {
    const finish = (result: GooglePopupResult) => {
      window.removeEventListener('message', onMessage);
      clearInterval(closedCheck);
      resolve(result);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== popup) return;
      const data = event.data as { type?: unknown; error?: unknown } | null;
      if (!data || data.type !== GOOGLE_DONE_MESSAGE) return;
      const code = toGoogleResultCode(typeof data.error === 'string' ? data.error : null);
      finish(code ? { ok: false, code } : { ok: true });
    };
    const closedCheck = setInterval(() => {
      if (popup.closed) finish(null);
    }, CLOSED_CHECK_MS);
    window.addEventListener('message', onMessage);
  });
}

/** 팝업 끝 화면: 원래 창에 결과를 알린다(같은 출처로만). 원래 창이 없으면 false */
export function postGoogleDone(rawError: string | null): boolean {
  const opener = window.opener as Window | null;
  if (!opener || opener.closed) return false;
  opener.postMessage({ type: GOOGLE_DONE_MESSAGE, error: toGoogleResultCode(rawError) }, window.location.origin);
  return true;
}
