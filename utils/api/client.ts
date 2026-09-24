import { envConfig, logger } from '@env/config';
import type {
  ApiErrorCode,
  ClientErrorCode,
  FieldErrorDetail,
  ProblemDetail,
  QueryParams,
} from './types';

/** 모든 API 주소 앞에 붙는 경로 (08-api-design.md 2-1절) */
export const API_PREFIX = '/api/v1';

interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * API 오류
 *
 * - 서버가 Problem Details로 답하면: status·code·errors·problem이 서버 값
 * - 응답을 못 받으면: status 0, code TIMEOUT / NETWORK_ERROR
 * - Problem Details가 아닌 오류 응답(프록시 오류 HTML 등): code UNKNOWN_ERROR
 *
 * message = 화면에 보여줄 한국어 (서버 detail 또는 기본 문구)
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | ClientErrorCode;
  readonly errors: FieldErrorDetail[];
  readonly problem?: ProblemDetail;

  constructor(params: {
    message: string;
    status: number;
    code: ApiErrorCode | ClientErrorCode;
    errors?: FieldErrorDetail[];
    problem?: ProblemDetail;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.errors = params.errors ?? [];
    this.problem = params.problem;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function isProblemDetail(body: unknown): body is ProblemDetail {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as ProblemDetail).status === 'number' &&
    typeof (body as ProblemDetail).code === 'string'
  );
}

function buildQuery(params?: QueryParams): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) {
      if (v === null || v === undefined) continue;
      search.append(key, String(v));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * HTTP 클라이언트 (fetch 래퍼)
 *
 * - 성공: 응답 JSON을 그대로 T로 돌려준다. 204(본문 없음)는 undefined.
 * - 실패: ApiError를 던진다.
 *
 * @example
 * const todos = await apiClient.get<Todo[]>('/todos', { date: '2026-09-24' });
 * const todo  = await apiClient.patch<Todo>(`/todos/${id}`, { completed: true });
 * await apiClient.delete(`/todos/${id}`);
 */
class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout ?? 10000;
    this.defaultHeaders = {
      Accept: 'application/json, application/problem+json',
      ...config.headers,
    };
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    options: { params?: QueryParams; body?: unknown } = {}
  ): Promise<T> {
    const url = `${this.baseURL}${API_PREFIX}${path}${buildQuery(options.params)}`;
    const hasBody = options.body !== undefined;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          ...this.defaultHeaders,
          ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        },
        body: hasBody ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError({ message: '응답이 늦어 요청을 멈췄어요. 다시 시도하세요.', status: 0, code: 'TIMEOUT' });
      }
      throw new ApiError({ message: '서버에 연결할 수 없어요. 잠시 후 다시 시도하세요.', status: 0, code: 'NETWORK_ERROR' });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw await this.toApiError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  private async toApiError(response: Response): Promise<ApiError> {
    let body: unknown;
    try {
      const text = await response.text();
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = undefined;
    }

    if (isProblemDetail(body)) {
      logger.warn('API error', { status: body.status, code: body.code, instance: body.instance });
      return new ApiError({
        message: body.detail ?? body.title,
        status: body.status,
        code: body.code,
        errors: body.errors ?? [],
        problem: body,
      });
    }

    logger.error('API error (not Problem Details)', { status: response.status, url: response.url });
    return new ApiError({
      message: '요청을 처리하지 못했어요. 잠시 후 다시 시도하세요.',
      status: response.status,
      code: 'UNKNOWN_ERROR',
    });
  }

  get<T>(path: string, params?: QueryParams): Promise<T> {
    return this.request<T>('GET', path, { params });
  }

  post<T, D = unknown>(path: string, body?: D): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  put<T, D = unknown>(path: string, body?: D): Promise<T> {
    return this.request<T>('PUT', path, { body });
  }

  /** JSON Merge Patch: 보낸 필드만 바뀌고, null을 보내면 값을 지운다 (08-api-design.md 2-4절) */
  patch<T, D = unknown>(path: string, body: D): Promise<T> {
    return this.request<T>('PATCH', path, { body });
  }

  delete(path: string): Promise<void> {
    return this.request<void>('DELETE', path);
  }

  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }
}

const apiClient = new ApiClient({
  baseURL: envConfig.apiBaseUrl,
  timeout: 10000,
});

logger.info('API Client initialized', {
  baseURL: `${envConfig.apiBaseUrl}${API_PREFIX}`,
  environment: envConfig.appEnv,
});

export default apiClient;
