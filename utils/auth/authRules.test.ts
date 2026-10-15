import { describe, expect, it } from 'vitest';

import { ApiError } from '@utils/api';

import { cardErrorOf, checkEmail, checkNewPassword, checkSignup, fieldErrorsOf, passwordLength, SERVER_TROUBLE, tooManyMessage } from './authRules';

const apiError = (status: number, code: string, message = '', errors: { field: string; message: string }[] = []) =>
  new ApiError({ status, code: code as never, message, errors });

describe('가입·비밀번호 화면 규칙 (US-33·35, D-079 · 06 SITE-05 공통 규칙)', () => {
  it('비밀번호 글자 수는 코드 포인트로 센다 (BE와 같음, 이모지 1자)', () => {
    expect(passwordLength('abc')).toBe(3);
    expect(passwordLength('😀😀')).toBe(2);
    expect(passwordLength('한글 비밀번호')).toBe(7);
  });

  it('새 비밀번호: 빈 칸·15자 미만은 서버에 보내기 전에 막는다 (유출·128자 초과는 서버 결과로)', () => {
    expect(checkNewPassword('')).toBe('비밀번호를 입력해 주세요.');
    expect(checkNewPassword('a'.repeat(14))).toBe('비밀번호는 15자 이상이어야 해요.');
    expect(checkNewPassword('a'.repeat(15))).toBeUndefined();
    expect(checkNewPassword('a'.repeat(200))).toBeUndefined();
  });

  it('이메일: 빈 칸·모양', () => {
    expect(checkEmail('  ')).toBe('이메일을 입력해 주세요.');
    expect(checkEmail('qa@example')).toBe('이메일 주소를 확인해 주세요.');
    expect(checkEmail('qa example.com')).toBe('이메일 주소를 확인해 주세요.');
    expect(checkEmail(' qa@example.com ')).toBeUndefined();
  });

  it('가입: 빈 칸·이메일 모양·비밀번호 15자 미만·만 14세 미체크 → 칸별 오류 (SITE-05b 2)', () => {
    expect(checkSignup({ email: '', name: ' ', password: 'short', ageOver14: false })).toEqual({
      email: '이메일을 입력해 주세요.',
      name: '이름을 입력해 주세요.',
      password: '비밀번호는 15자 이상이어야 해요.',
      ageOver14: '만 14세 이상만 가입할 수 있어요.',
    });
    expect(checkSignup({ email: 'qa@example.com', name: '검수', password: 'a'.repeat(15), ageOver14: true })).toEqual({});
  });

  it('BE errors → 칸 오류 (VALIDATION_FAILED·PASSWORD_REJECTED, 칸마다 첫 문구)', () => {
    const error = apiError(400, 'VALIDATION_FAILED', '입력값을 확인하세요', [
      { field: 'email', message: '이메일 주소를 확인해 주세요.' },
      { field: 'email', message: '두 번째' },
      { field: 'ageOver14', message: '만 14세 이상만 가입할 수 있어요.' },
    ]);
    expect(fieldErrorsOf(error)).toEqual({ email: '이메일 주소를 확인해 주세요.', ageOver14: '만 14세 이상만 가입할 수 있어요.' });
    expect(fieldErrorsOf(apiError(400, 'PASSWORD_REJECTED', 'x', [{ field: 'newPassword', message: '유출된 적이 있는 비밀번호예요. 다른 비밀번호를 써 주세요.' }]))).toEqual({
      newPassword: '유출된 적이 있는 비밀번호예요. 다른 비밀번호를 써 주세요.',
    });
    expect(fieldErrorsOf(apiError(429, 'TOO_MANY_REQUESTS'))).toEqual({});
    expect(fieldErrorsOf(new Error('x'))).toEqual({});
  });

  it('카드 오류 줄: 서버에 못 닿음·500은 "잠시 문제가 있어요", 그 밖에는 BE 문구', () => {
    expect(SERVER_TROUBLE).toBe('잠시 문제가 있어요. 잠시 뒤 다시 시도해 주세요');
    expect(cardErrorOf(apiError(0, 'NETWORK_ERROR', '서버에 연결할 수 없어요.'))).toBe(SERVER_TROUBLE);
    expect(cardErrorOf(apiError(500, 'INTERNAL_ERROR', '서버 오류'))).toBe(SERVER_TROUBLE);
    expect(cardErrorOf(apiError(502, 'UNKNOWN_ERROR', 'x'))).toBe(SERVER_TROUBLE);
    expect(cardErrorOf(new Error('x'))).toBe(SERVER_TROUBLE);
    expect(cardErrorOf(apiError(400, 'TOKEN_INVALID', '링크가 올바르지 않아요'))).toBe('링크가 올바르지 않아요');
  });

  it('429 문구 (로그인과 같은 방식)', () => {
    expect(tooManyMessage(12)).toBe('요청이 너무 많아요. 12초 뒤에 다시 시도할 수 있어요');
  });
});
