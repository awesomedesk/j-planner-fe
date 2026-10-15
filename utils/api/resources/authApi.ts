import type { EmailRequest, LoginRequest, Me, PasswordResetRequest, SignupRequest, TokenRequest } from '@/types/api';

import apiClient from '../client';

/** 로그인·로그아웃·내 정보 (US-34), 가입·인증 (US-33), 비밀번호 찾기·재설정 (US-35) — 08 13-3·13-4 */
export const authApi = {
  /** CSRF 쿠키 받기 (`GET /auth/csrf` 204). 앱을 열 때 */
  csrf: () => apiClient.fetchCsrfToken(),
  /** 내 정보. 로그인 안 했으면 401 */
  me: () => apiClient.get<Me>('/me'),
  /** 로그인 → 내 정보 + 세션 쿠키. 실패 401 / 정지 403 / 늦추기 429(Retry-After) */
  login: (body: LoginRequest) => apiClient.post<Me, LoginRequest>('/auth/login', body),
  /** 이 기기 로그아웃 (204) */
  logout: () => apiClient.post<void>('/auth/logout'),
  /** 이 기기 빼고 모두 로그아웃 (204). '모든 기기 로그아웃' = 이것 + logout */
  logoutOtherDevices: () => apiClient.delete('/me/sessions'),

  /** 가입 → 202 임시 가입 + 인증 메일. 400 VALIDATION_FAILED·PASSWORD_REJECTED / 409 EMAIL_ALREADY_REGISTERED(loginMethods) / 429 */
  signup: (body: SignupRequest) => apiClient.post<void, SignupRequest>('/auth/signup', body),
  /** 인증 메일 다시 보내기 → 늘 202 (60초 안이면 메일만 안 감) */
  resendSignupMail: (body: EmailRequest) => apiClient.post<void, EmailRequest>('/auth/signup/resend', body),
  /** 메일 링크의 토큰으로 인증 → 201(로그인 안 됨) / 400 TOKEN_INVALID / 429 */
  verifySignup: (body: TokenRequest) => apiClient.post<void, TokenRequest>('/auth/signup/verify', body),
  /** 비밀번호 찾기 → 늘 202 (가입 여부를 드러내지 않음) */
  forgotPassword: (body: EmailRequest) => apiClient.post<void, EmailRequest>('/auth/password/forgot', body),
  /** 새 비밀번호 → 204(모든 기기 로그아웃, 로그인 안 됨) / 400 TOKEN_INVALID·PASSWORD_REJECTED(newPassword) / 429 */
  resetPassword: (body: PasswordResetRequest) => apiClient.post<void, PasswordResetRequest>('/auth/password/reset', body),
};
