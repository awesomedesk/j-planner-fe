import { envConfig, logger } from '@env/config';
import type { AwesomeResponse } from './types';

/**
 * API 클라이언트 설정
 */
interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * API 에러 타입
 */
export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

/**
 * 타입 가드: error가 ApiError 타입인지 확인
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'status' in error &&
    typeof (error as ApiError).message === 'string' &&
    typeof (error as ApiError).status === 'number'
  );
}

/**
 * HTTP 클라이언트
 *
 * fetch API를 래핑하여 타임아웃, 에러 핸들링, 인증 등을 처리
 * 모든 메서드는 AwesomeResponse<T> 형식으로 응답
 */
class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 10000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw {
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          code: 'HTTP_ERROR',
        } as ApiError;
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw {
            message: 'Request timeout',
            status: 0,
            code: 'TIMEOUT',
          } as ApiError;
        }
        throw {
          message: error.message,
          status: 0,
          code: 'NETWORK_ERROR',
        } as ApiError;
      }

      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<AwesomeResponse<T>> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;

    return this.request<AwesomeResponse<T>>(url, { method: 'GET' });
  }

  async post<T, D = unknown>(endpoint: string, data?: D): Promise<AwesomeResponse<T>> {
    return this.request<AwesomeResponse<T>>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T, D = unknown>(endpoint: string, data?: D): Promise<AwesomeResponse<T>> {
    return this.request<AwesomeResponse<T>>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<AwesomeResponse<T>> {
    return this.request<AwesomeResponse<T>>(endpoint, { method: 'DELETE' });
  }

  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }
}

// API 클라이언트 인스턴스 생성
const apiClient = new ApiClient({
  baseURL: envConfig.apiBaseUrl,
  timeout: 10000,
});

// 환경별 로깅
logger.info('API Client initialized', {
  baseURL: envConfig.apiBaseUrl,
  environment: envConfig.appEnv,
});

export default apiClient;
