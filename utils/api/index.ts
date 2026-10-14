// HTTP 클라이언트
export { default as apiClient, ApiError, isApiError, API_PREFIX, setUnauthenticatedHandler } from './client';
export type { HttpMethod, UnauthenticatedHandler } from './client';

// 오류 → 화면 문구
export { toErrorMessage, DEFAULT_ERROR_MESSAGE } from './errorMessage';

// 공통 API 타입
export type {
  ApiErrorCode,
  ClientErrorCode,
  FieldErrorDetail,
  ProblemDetail,
  QueryParams,
  QueryValue,
} from './types';

// 리소스별 API 함수
export * from './resources';
