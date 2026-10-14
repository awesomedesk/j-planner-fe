import type { LoginRequest, Me } from '@/types/api';

import apiClient from '../client';

/** 로그인·로그아웃·내 정보 (US-34, 08 13-3·13-4) */
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
};
