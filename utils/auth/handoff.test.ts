import { beforeEach, describe, expect, it } from 'vitest';

import { clearHandoffEmail, clearLoginNotice, LOGIN_NOTICE_TEXT, passEmail, passLoginNotice, peekHandoffEmail, peekLoginNotice } from './handoff';

beforeEach(() => sessionStorage.clear());

describe('화면 사이에 넘기는 값 (D-079)', () => {
  it('이메일은 주소(URL)가 아니라 sessionStorage로 넘기고, 다 쓰면 지운다', () => {
    passEmail(' qa@example.com ');
    expect(peekHandoffEmail()).toBe('qa@example.com');
    expect(peekHandoffEmail()).toBe('qa@example.com');
    clearHandoffEmail();
    expect(peekHandoffEmail()).toBe('');
  });

  it('빈 이메일은 넘기지 않는다', () => {
    passEmail('qa@example.com');
    passEmail('   ');
    expect(peekHandoffEmail()).toBe('');
  });

  it('로그인 화면 초록 안내: 인증 끝 / 재설정 끝 (SITE-05a)', () => {
    expect(LOGIN_NOTICE_TEXT.verified).toBe('인증이 끝났어요. 로그인해 주세요');
    expect(LOGIN_NOTICE_TEXT.passwordReset).toBe('비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요');
    passLoginNotice('passwordReset');
    expect(peekLoginNotice()).toBe('passwordReset');
    clearLoginNotice();
    expect(peekLoginNotice()).toBeNull();
  });

  it('모르는 값은 안내하지 않는다', () => {
    sessionStorage.setItem('jp.auth.loginNotice', 'hello');
    expect(peekLoginNotice()).toBeNull();
  });

  it('sessionStorage를 못 쓰는 브라우저에서도 오류 없이 빈 값', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'sessionStorage')!;
    Object.defineProperty(window, 'sessionStorage', { configurable: true, get: () => { throw new Error('blocked'); } });
    try {
      expect(() => passEmail('qa@example.com')).not.toThrow();
      expect(peekHandoffEmail()).toBe('');
      expect(peekLoginNotice()).toBeNull();
    } finally {
      Object.defineProperty(window, 'sessionStorage', original);
    }
  });
});
