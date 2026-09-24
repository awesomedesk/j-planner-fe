import { isApiError } from './client';

/** 알 수 없는 오류일 때 보여줄 문구 */
export const DEFAULT_ERROR_MESSAGE = '요청을 처리하지 못했어요. 잠시 후 다시 시도하세요.';

/**
 * 오류 → 화면에 보여줄 짧은 한국어 문구 (US-03)
 * - 서버 오류(Problem Details): 서버가 준 detail (화면용 한국어, 08-api-design 2-6)
 * - 네트워크·시간 초과: apiClient가 만든 문구
 * - 그 외: 기본 문구
 */
export const toErrorMessage = (error: unknown): string => {
  if (isApiError(error)) return error.message || DEFAULT_ERROR_MESSAGE;
  return DEFAULT_ERROR_MESSAGE;
};
