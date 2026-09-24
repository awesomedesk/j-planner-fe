import apiClient from '../client';

/** 서버 상태 확인 경로 (/api/v1 뒤). 응답 `{"status":"UP"}`, DB는 확인하지 않음 (08-api-design 1절, D-036) */
export const HEALTH_CHECK_PATH = '/health';

/** 서버 상태 확인 (US-03). 성공하면 응답 그대로, 실패하면 ApiError */
export const systemApi = {
  checkHealth: () => apiClient.get<unknown>(HEALTH_CHECK_PATH),
};
