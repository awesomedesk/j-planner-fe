import type { DeviceSession, EmailRequest, Identity, Me, MeUpdateRequest, NewPasswordRequest, PasswordRequest, TokenRequest } from '@/types/api';

import apiClient from '../client';

/** 구글 본인 확인 — 브라우저 이동 → `/me?reauth=google` 또는 `/me?error=…` */
export const REAUTH_GOOGLE_PATH = '/api/v1/me/reauth/google';
/** 구글 연결 — 브라우저 이동 (재인증 뒤) → `/me?linked=google` 또는 `/me?error=…` */
export const CONNECT_GOOGLE_PATH = '/api/v1/me/identities/google/connect';

/**
 * 내 계정 (US-37 · 08 13-4). 민감 작업(이메일·비밀번호·구글 해제·탈퇴)은 재인증 5분이 지나면 403 REAUTH_REQUIRED.
 * 기기 로그아웃(`DELETE /me/sessions`)은 authApi.logoutOtherDevices.
 */
export const meApi = {
  /** 이름 → 200 내 정보 / 400 errors name (재인증 없음) */
  updateName: (body: MeUpdateRequest) => apiClient.patch<Me, MeUpdateRequest>('/me', body),
  /** 비밀번호 재인증 → 204 / 400 REAUTH_FAILED(errors password) / 429 */
  reauth: (body: PasswordRequest) => apiClient.post<void, PasswordRequest>('/me/reauth', body),
  /** 이메일 바꾸기 → 202(새 주소로 인증 링크) / 400 errors email / 409 EMAIL_ALREADY_REGISTERED / 403 / 429 */
  changeEmail: (body: EmailRequest) => apiClient.put<void, EmailRequest>('/me/email', body),
  /** 새 이메일 인증 (로그인 없이) → 204(모든 기기 로그아웃) / 400 TOKEN_INVALID / 429 */
  verifyEmailChange: (body: TokenRequest) => apiClient.post<void, TokenRequest>('/me/email/verify', body),
  /** 비밀번호 바꾸기·추가 → 204(이 기기 유지, 다른 기기 로그아웃) / 400 PASSWORD_REJECTED(errors newPassword) / 403 */
  changePassword: (body: NewPasswordRequest) => apiClient.put<void, NewPasswordRequest>('/me/password', body),
  /** 연결된 로그인 수단 (없으면 []) */
  identities: () => apiClient.get<Identity[]>('/me/identities'),
  /** 구글 연결 해제 → 204 / 404 / 409 LAST_IDENTITY / 403 */
  disconnectGoogle: () => apiClient.delete('/me/identities/google'),
  /** 로그인한 기기 (최근 사용순) */
  sessions: () => apiClient.get<DeviceSession[]>('/me/sessions'),
  /** 그 기기만 로그아웃 → 204 / 404 (지금 기기면 이 기기 로그아웃) */
  endSession: (id: string) => apiClient.delete(`/me/sessions/${encodeURIComponent(id)}`),
  /** 탈퇴 → 204(모든 기기 로그아웃 + 데이터 즉시 삭제) / 403 */
  deleteAccount: () => apiClient.delete('/me'),
};
