import apiClient from '../client';

/**
 * 서버 상태 확인 경로 (/api/v1 뒤)
 * TODO(BE 확인 필요): BE 창이 상태 확인 엔드포인트 경로·응답을 정하면 맞춘다. 지금은 가정값.
 */
export const HEALTH_CHECK_PATH = '/health';

/** 서버 상태 확인 (US-03). 성공하면 응답 그대로, 실패하면 ApiError */
export const systemApi = {
  checkHealth: () => apiClient.get<unknown>(HEALTH_CHECK_PATH),
};
