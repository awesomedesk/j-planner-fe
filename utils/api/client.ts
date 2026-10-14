import { envConfig, logger } from '@env/config';
import type {
  ApiErrorCode,
  ClientErrorCode,
  FieldErrorDetail,
  ProblemDetail,
  QueryParams,
} from './types';
import { CSRF_HEADER, readCsrfToken } from './csrf';

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
  /** 429일 때 다시 시도할 수 있기까지 남은 초 (Retry-After 헤더, US-34) */
  readonly retryAfterSeconds?: number;

  constructor(params: {
    message: string;
    status: number;
    code: ApiErrorCode | ClientErrorCode;
    errors?: FieldErrorDetail[];
    problem?: ProblemDetail;
    retryAfterSeconds?: number;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.errors = params.errors ?? [];
    this.problem = params.problem;
    this.retryAfterSeconds = params.retryAfterSeconds;
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

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * 로그인이 끝났을 때(401) 할 일 (US-34, D-072). 앱의 로그인 담당이 등록한다.
 * - 돌려준 값이 true면: 다시 로그인했으니 **같은 요청을 한 번 더** 보낸다 (새 CSRF로)
 * - false면: 401 오류를 그대로 던진다
 * 로그인 API(`/auth/...`)와 로그인 확인(`GET /me`)의 401은 알리지 않는다 (그 자리에서 처리).
 */
export type UnauthenticatedHandler = (request: { method: HttpMethod; path: string }) => Promise<boolean>;

let unauthenticatedHandler: UnauthenticatedHandler | null = null;

export function setUnauthenticatedHandler(handler: UnauthenticatedHandler | null) {
  unauthenticatedHandler = handler;
}

const isAuthCheck = (method: HttpMethod, path: string) => path.startsWith('/auth/') || (method === 'GET' && path === '/me');

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : undefined;
}

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
export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  /** 진행 중인 GET /auth/csrf (동시에 여러 번 받지 않게) */
  private csrfRequest: Promise<void> | null = null;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout ?? 10000;
    this.defaultHeaders = {
      Accept: 'application/json, application/problem+json',
      ...config.headers,
    };
  }

  /**
   * CSRF 쿠키를 새로 받는다 (`GET /auth/csrf`, 204). 앱을 열 때 한 번, 쿠키가 없거나 틀렸을 때 다시.
   * 동시에 불러도 요청은 한 번만 나간다.
   */
  fetchCsrfToken(): Promise<void> {
    if (!this.csrfRequest) {
      this.csrfRequest = this.send('GET', '/auth/csrf', {})
        .then(() => undefined)
        .finally(() => {
          this.csrfRequest = null;
        });
    }
    return this.csrfRequest;
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    options: { params?: QueryParams; body?: unknown } = {}
  ): Promise<T> {
    let response = await this.send(method, path, options);

    // CSRF 토큰이 틀렸으면 새로 받아 한 번만 다시 (08 13-2)
    if (response.status === 403) {
      const error = await this.toApiError(response);
      if (error.code !== 'CSRF_INVALID') throw error;
      await this.fetchCsrfToken();
      response = await this.send(method, path, options);
    }

    // 로그인이 끝났으면 로그인 담당에게 묻고, 다시 로그인했으면 같은 요청을 한 번만 다시 (D-072)
    if (response.status === 401 && unauthenticatedHandler && !isAuthCheck(method, path)) {
      const error = await this.toApiError(response);
      const retry = await unauthenticatedHandler({ method, path });
      if (!retry) throw error;
      response = await this.send(method, path, options);
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

  /** 요청 한 번 (바꾸는 요청이면 CSRF 헤더를 붙인다. 쿠키가 없으면 먼저 받는다) */
  private async send(method: HttpMethod, path: string, options: { params?: QueryParams; body?: unknown }): Promise<Response> {
    const url = `${this.baseURL}${API_PREFIX}${path}${buildQuery(options.params)}`;
    const hasBody = options.body !== undefined;

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    };
    if (method !== 'GET') {
      let token = readCsrfToken();
      if (!token) {
        await this.fetchCsrfToken();
        token = readCsrfToken();
      }
      if (token) headers[CSRF_HEADER] = token;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      return await fetch(url, {
        method,
        headers,
        body: hasBody ? JSON.stringify(options.body) : undefined,
        credentials: 'same-origin',
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
        retryAfterSeconds: parseRetryAfter(response.headers.get('Retry-After')),
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
