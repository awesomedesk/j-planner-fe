import { isApiError } from './client';

/** 알 수 없는 오류일 때 보여줄 문구 */
export const DEFAULT_ERROR_MESSAGE = '요청을 처리하지 못했어요. 잠시 후 다시 시도하세요.';

/**
 * 오류 → 화면에 보여줄 짧은 한국어 문구 (US-03)
 * - 서버 오류(Problem Details): 서버가 준 detail (화면용 한국어, 08-api-design 2-6)
 * - 네트워크·시간 초과: apiClient가 만든 문구
 * - 둘러보기에서 막은 저장(DEMO_READ_ONLY): 빈 문자열 — 안내(noticeSlice)는 빈 문구를 띄우지 않는다
 * - 그 외: 기본 문구
 */
export const toErrorMessage = (error: unknown): string => {
  // 둘러보기에서 막은 저장: 안내 창이 따로 뜨므로 오류 문구 없음 (US-40)
  if (isApiError(error) && error.code === 'DEMO_READ_ONLY') return '';
  if (isApiError(error)) return error.message || DEFAULT_ERROR_MESSAGE;
  return DEFAULT_ERROR_MESSAGE;
};
