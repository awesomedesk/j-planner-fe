import { isApiError } from '@utils/api';

/**
 * 가입·비밀번호 화면 규칙 (US-33·35, D-079 · 06 SITE-05 공통 규칙)
 * 문구는 BE 검사 문구와 같게 맞춘다 (화면에서 먼저 막아도, 서버가 막아도 같은 말).
 */

/** 비밀번호 최소 글자 수 (11 문서 3-2, 08 13-6) */
export const PASSWORD_MIN = 15;

export const SERVER_TROUBLE = '잠시 문제가 있어요. 잠시 뒤 다시 시도해 주세요';
export const tooManyMessage = (seconds: number) => `요청이 너무 많아요. ${seconds}초 뒤에 다시 시도할 수 있어요`;

/** 글자 수 = 코드 포인트 (BE `codePointCount`와 같음) */
export const passwordLength = (password: string) => Array.from(password).length;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function checkEmail(email: string): string | undefined {
  const value = email.trim();
  if (!value) return '이메일을 입력해 주세요.';
  if (!EMAIL_SHAPE.test(value)) return '이메일 주소를 확인해 주세요.';
  return undefined;
}

/** 새 비밀번호: 빈 칸·15자 미만만 화면에서 막는다 (유출·128자 초과는 서버 결과로) */
export function checkNewPassword(password: string): string | undefined {
  if (!password) return '비밀번호를 입력해 주세요.';
  if (passwordLength(password) < PASSWORD_MIN) return `비밀번호는 ${PASSWORD_MIN}자 이상이어야 해요.`;
  return undefined;
}

export interface SignupInput {
  email: string;
  name: string;
  password: string;
  ageOver14: boolean;
}

/** 칸 이름 → 오류 문구. 칸 이름은 BE errors의 field와 같다 */
export type FieldErrors = Partial<Record<string, string>>;

/** 가입: 빈 칸·이메일 모양·비밀번호 15자 미만·만 14세 미체크 (SITE-05b 2) */
export function checkSignup(input: SignupInput): FieldErrors {
  const errors: FieldErrors = {};
  const email = checkEmail(input.email);
  if (email) errors.email = email;
  if (!input.name.trim()) errors.name = '이름을 입력해 주세요.';
  const password = checkNewPassword(input.password);
  if (password) errors.password = password;
  if (!input.ageOver14) errors.ageOver14 = '만 14세 이상만 가입할 수 있어요.';
  return errors;
}

/** BE errors(field·message) → 칸 오류. 한 칸에 여러 개면 첫 문구 */
export function fieldErrorsOf(error: unknown): FieldErrors {
  if (!isApiError(error)) return {};
  const result: FieldErrors = {};
  for (const { field, message } of error.errors) {
    if (!(field in result)) result[field] = message;
  }
  return result;
}

/** 카드 오류 줄: 서버에 못 닿음·5xx·알 수 없는 오류는 한 문구, 그 밖에는 BE 문구 */
export function cardErrorOf(error: unknown): string {
  if (!isApiError(error) || error.status === 0 || error.status >= 500) return SERVER_TROUBLE;
  return error.message || SERVER_TROUBLE;
}

/** 칸 순서대로 첫 오류 칸 */
export const firstErrorField = (order: readonly string[], errors: FieldErrors) => order.find((field) => errors[field]);
