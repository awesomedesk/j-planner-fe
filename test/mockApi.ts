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
}

export interface MockResponse {
  status: number;
  body?: unknown;
  contentType?: string;
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
    const url = new URL(String(input));
    const method = (init?.method ?? 'GET').toUpperCase();
    const path = url.pathname.replace(/^\/api\/v1/, '');
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const request = { method, path, query: url.searchParams, body };

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
      headers: { 'Content-Type': response.contentType ?? 'application/json' },
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
