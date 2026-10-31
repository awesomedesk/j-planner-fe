import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  GOOGLE_DONE_MESSAGE,
  GOOGLE_POPUP_PATH,
  googleResultMessage,
  googleStartPath,
  postGoogleDone,
  signInWithGooglePopup,
  toGoogleResultCode,
} from './googleLogin';

/** jsdom의 window.opener는 값 속성이라 바꿔 끼운다 */
const setOpener = (value: unknown) => Object.defineProperty(window, 'opener', { value, configurable: true, writable: true });

afterEach(() => {
  vi.restoreAllMocks();
  setOpener(null);
  vi.useRealTimers();
});

describe('구글 로그인 시작 주소 (US-36, D-082 6)', () => {
  it('브라우저 이동 주소는 /api/v1/auth/google (같은 주소, rewrites로 BE)', () => {
    expect(googleStartPath()).toBe('/api/v1/auth/google');
  });

  it('?next=는 사이트 안 경로만 붙인다 (달력이면 안 붙임)', () => {
    expect(googleStartPath('/?view=day')).toBe('/api/v1/auth/google?next=%2F%3Fview%3Dday');
    expect(googleStartPath('https://evil.example.com')).toBe('/api/v1/auth/google');
    expect(googleStartPath('/')).toBe('/api/v1/auth/google');
  });

  it('다시 로그인 창은 팝업 주소 (?popup=true, AC4)', () => {
    expect(GOOGLE_POPUP_PATH).toBe('/api/v1/auth/google?popup=true');
  });
});

describe('구글 결과 안내 문구 (US-36, D-082 · 06 SITE-05a)', () => {
  it.each([
    ['GOOGLE_FAILED', '구글 로그인을 마치지 못했어요. 다시 시도해 주세요.'],
    ['GOOGLE_EMAIL_ACCOUNT_EXISTS', '이 이메일로 가입한 계정이 있어요. 이메일로 로그인한 뒤 내 계정에서 구글을 연결해 주세요.'],
    ['ACCOUNT_SUSPENDED', '이용이 제한된 계정이에요.'],
    ['GOOGLE_NOT_REGISTERED', '이 구글 계정으로 가입된 계정이 없어요'],
  ])('%s → "%s" (GOOGLE_NOT_REGISTERED = 팝업에서 처음 보는 구글, D-085)', (code, text) => {
    expect(googleResultMessage(toGoogleResultCode(code)!)).toBe(text);
  });

  it('코드가 없으면 null, 모르는 코드는 GOOGLE_FAILED로 본다 (제가 정한 부분)', () => {
    expect(toGoogleResultCode(null)).toBeNull();
    expect(toGoogleResultCode('')).toBeNull();
    expect(toGoogleResultCode('<script>')).toBe('GOOGLE_FAILED');
  });
});

/** 팝업 흉내 */
const fakePopup = () => ({ closed: false, close: vi.fn() }) as unknown as Window & { closed: boolean };
const sendFrom = (source: unknown, data: unknown, origin = window.location.origin) =>
  window.dispatchEvent(new MessageEvent('message', { data, origin, source: source as Window }));

describe('다시 로그인 창의 구글 팝업 (US-36 AC4)', () => {
  it('팝업을 열고, 끝 화면이 알리면 성공', async () => {
    const popup = fakePopup();
    const open = vi.spyOn(window, 'open').mockReturnValue(popup);
    const result = signInWithGooglePopup();
    expect(open).toHaveBeenCalledWith(GOOGLE_POPUP_PATH, 'jp-google-login', expect.stringContaining('popup'));
    sendFrom(popup, { type: GOOGLE_DONE_MESSAGE, error: null });
    await expect(result).resolves.toEqual({ ok: true, restored: false });
  });

  it('끝 화면이 restored: true를 알리면 성공 + restored (US-38)', async () => {
    const popup = fakePopup();
    vi.spyOn(window, 'open').mockReturnValue(popup);
    const result = signInWithGooglePopup();
    sendFrom(popup, { type: GOOGLE_DONE_MESSAGE, error: null, restored: true });
    await expect(result).resolves.toEqual({ ok: true, restored: true });
  });

  it('끝 화면이 오류 코드를 알리면 그 코드', async () => {
    const popup = fakePopup();
    vi.spyOn(window, 'open').mockReturnValue(popup);
    const result = signInWithGooglePopup();
    sendFrom(popup, { type: GOOGLE_DONE_MESSAGE, error: 'ACCOUNT_SUSPENDED' });
    await expect(result).resolves.toEqual({ ok: false, code: 'ACCOUNT_SUSPENDED' });
  });

  it('다른 사이트·다른 창에서 온 메시지는 무시한다', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const popup = fakePopup();
    vi.spyOn(window, 'open').mockReturnValue(popup);
    const result = signInWithGooglePopup();
    sendFrom(popup, { type: GOOGLE_DONE_MESSAGE, error: null }, 'https://evil.example.com');
    sendFrom(window, { type: GOOGLE_DONE_MESSAGE, error: null });
    popup.closed = true;
    vi.advanceTimersByTime(1000);
    await expect(result).resolves.toBeNull();
  });

  it('알리지 않고 팝업을 닫으면 null (아무 일 없음)', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const popup = fakePopup();
    vi.spyOn(window, 'open').mockReturnValue(popup);
    const result = signInWithGooglePopup();
    popup.closed = true;
    vi.advanceTimersByTime(1000);
    await expect(result).resolves.toBeNull();
  });

  it('팝업이 막히면 POPUP_BLOCKED + 안내 (제가 정한 부분)', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    await expect(signInWithGooglePopup()).resolves.toEqual({ ok: false, code: 'POPUP_BLOCKED' });
    expect(googleResultMessage('POPUP_BLOCKED')).toBe('팝업이 막혀 있어요. 이 사이트의 팝업을 허용한 뒤 다시 눌러 주세요.');
  });
});

describe('팝업 끝 화면이 원래 창에 알리기 (US-36 AC4)', () => {
  it('원래 창(opener)이 있으면 같은 출처로만 알린다', () => {
    const postMessage = vi.fn();
    setOpener({ closed: false, postMessage } as unknown as Window);
    expect(postGoogleDone(null)).toBe(true);
    expect(postMessage).toHaveBeenCalledWith({ type: GOOGLE_DONE_MESSAGE, error: null, restored: false }, window.location.origin);
  });

  it('오류 코드는 아는 코드로 바꿔 알린다', () => {
    const postMessage = vi.fn();
    setOpener({ closed: false, postMessage } as unknown as Window);
    postGoogleDone('weird');
    expect(postMessage).toHaveBeenCalledWith({ type: GOOGLE_DONE_MESSAGE, error: 'GOOGLE_FAILED', restored: false }, window.location.origin);
  });

  it('원래 창이 없으면 false', () => {
    setOpener(null);
    expect(postGoogleDone(null)).toBe(false);
  });
});
