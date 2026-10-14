import { vi } from 'vitest';

/**
 * 가짜 BE (fetch 대체). 08-api-design의 응답 모양을 테스트에서 직접 정한다.
 *
 * @example
 * const api = mockApi({
 *   'GET /categories': () => json(200, [defaultCategory]),
 *   'POST /categories': (req) => json(201, { ...req.body, id: 9 }),
 * });
 * expect(api.calls('POST /categories')[0].body).toEqual({ name: '공부', color: null });
 */
export interface MockRequest {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
  /** 보낸 헤더 (이름은 소문자). CSRF 헤더 확인용 (US-34) */
  headers: Record<string, string>;
}

export interface MockResponse {
  status: number;
  body?: unknown;
  contentType?: string;
  /** 응답 헤더 (예: 429의 Retry-After) */
  headers?: Record<string, string>;
}

type Handler = (request: MockRequest) => MockResponse | Promise<MockResponse>;

export const json = (status: number, body?: unknown): MockResponse => ({ status, body });

/** Problem Details 오류 응답 (08-api-design 2-6) */
export const problem = (status: number, code: string, detail: string, errors: { field: string; message: string }[] = []): MockResponse => ({
  status,
  contentType: 'application/problem+json',
  body: { title: 'Error', status, detail, code, errors },
});

export const mockApi = (routes: Record<string, Handler>) => {
  const requests: (MockRequest & { key: string })[] = [];

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    // 같은 주소(상대 경로 /api/v1/...)로 부르는 경우도 받는다 (US-34, 08 13-1)
    const url = new URL(String(input), 'http://localhost');
    const method = (init?.method ?? 'GET').toUpperCase();
    const path = url.pathname.replace(/^\/api\/v1/, '');
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const headers = Object.fromEntries(Object.entries((init?.headers ?? {}) as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v]));
    const request = { method, path, query: url.searchParams, body, headers };

    // 정확한 경로 먼저, 없으면 숫자 id를 :id로 바꿔 찾는다
    const exactKey = `${method} ${path}`;
    const patternKey = `${method} ${path.replace(/\/\d+/g, '/:id')}`;
    const key = routes[exactKey] ? exactKey : patternKey;
    requests.push({ ...request, key });

    const handler = routes[key];
    if (!handler) throw new TypeError(`mockApi: 처리할 경로가 없음 ${exactKey}`);
    const response = await handler(request);
    const text = response.body === undefined ? '' : JSON.stringify(response.body);
    return new Response(response.status === 204 ? null : text, {
      status: response.status,
      headers: { 'Content-Type': response.contentType ?? 'application/json', ...response.headers },
    });
  });

  vi.stubGlobal('fetch', fetchMock);

  return {
    fetch: fetchMock,
    /** 경로별 요청 기록 ('POST /categories', 'PATCH /categories/:id' 등) */
    calls: (key: string) => requests.filter((r) => r.key === key),
    all: () => requests,
  };
};
