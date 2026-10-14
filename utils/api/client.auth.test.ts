import { afterEach, describe, expect, it, vi } from 'vitest';

import { setCsrfCookie } from '@/test/csrfCookie';
import { json, mockApi, problem } from '@/test/mockApi';

import apiClient, { ApiClient, ApiError, setUnauthenticatedHandler } from './client';

afterEach(() => setUnauthenticatedHandler(null));

describe('같은 주소로 부르기 (US-34, 08 13-1)', () => {
  it('baseURL이 비어 있으면 상대 경로 /api/v1/... 로 부른다 (Next rewrites가 BE로 넘김)', async () => {
    const api = mockApi({ 'GET /categories': () => json(200, []) });
    await new ApiClient({ baseURL: '' }).get('/categories');
    expect(String(api.fetch.mock.calls[0][0])).toBe('/api/v1/categories');
  });

  it('세션 쿠키가 같이 가도록 credentials는 same-origin', async () => {
    const api = mockApi({ 'GET /categories': () => json(200, []) });
    await apiClient.get('/categories');
    expect(api.fetch.mock.calls[0][1]).toMatchObject({ credentials: 'same-origin' });
  });
});

describe('CSRF 헤더 (US-34 AC2, 08 13-1·13-2)', () => {
  it.each(['POST', 'PUT', 'PATCH', 'DELETE'] as const)('%s 요청에 X-XSRF-TOKEN = __Host-XSRF-TOKEN 쿠키 값', async (method) => {
    setCsrfCookie('tok-1');
    const api = mockApi({ [`${method} /todos/:id`]: () => json(204) });
    const call = {
      POST: () => apiClient.post('/todos/1', {}),
      PUT: () => apiClient.put('/todos/1', {}),
      PATCH: () => apiClient.patch('/todos/1', {}),
      DELETE: () => apiClient.delete('/todos/1'),
    }[method];
    await call();
    expect(api.calls(`${method} /todos/:id`)[0].headers['x-xsrf-token']).toBe('tok-1');
  });

  it('GET에는 CSRF 헤더를 붙이지 않는다', async () => {
    const api = mockApi({ 'GET /todos': () => json(200, []) });
    await apiClient.get('/todos');
    expect(api.calls('GET /todos')[0].headers['x-xsrf-token']).toBeUndefined();
  });

  it('CSRF 쿠키가 아직 없으면 GET /auth/csrf로 먼저 받고 보낸다', async () => {
    setCsrfCookie(null);
    const api = mockApi({
      'GET /auth/csrf': () => {
        setCsrfCookie('fresh');
        return json(204);
      },
      'POST /todos': () => json(201, { id: 1 }),
    });
    await apiClient.post('/todos', { title: 'a' });
    expect(api.all().map((r) => r.key)).toEqual(['GET /auth/csrf', 'POST /todos']);
    expect(api.calls('POST /todos')[0].headers['x-xsrf-token']).toBe('fresh');
  });

  it('동시에 여러 요청이 쿠키 없이 나가도 GET /auth/csrf는 한 번만', async () => {
    setCsrfCookie(null);
    const api = mockApi({
      'GET /auth/csrf': async () => {
        await new Promise((r) => setTimeout(r, 5));
        setCsrfCookie('one');
        return json(204);
      },
      'POST /todos': () => json(201, {}),
    });
    await Promise.all([apiClient.post('/todos', {}), apiClient.post('/todos', {})]);
    expect(api.calls('GET /auth/csrf')).toHaveLength(1);
  });

  it('403 CSRF_INVALID면 CSRF를 다시 받고 한 번 더 보낸다', async () => {
    setCsrfCookie('old');
    let tries = 0;
    const api = mockApi({
      'GET /auth/csrf': () => {
        setCsrfCookie('new');
        return json(204);
      },
      'PATCH /todos/:id': () => (++tries === 1 ? problem(403, 'CSRF_INVALID', '요청을 다시 시도하세요') : json(200, { id: 1 })),
    });
    await expect(apiClient.patch('/todos/1', { completed: true })).resolves.toEqual({ id: 1 });
    expect(api.calls('PATCH /todos/:id').map((r) => r.headers['x-xsrf-token'])).toEqual(['old', 'new']);
    expect(api.calls('PATCH /todos/:id')[1].body).toEqual({ completed: true });
  });

  it('다시 보내도 403 CSRF_INVALID면 더 시도하지 않고 오류', async () => {
    const api = mockApi({
      'GET /auth/csrf': () => json(204),
      'POST /todos': () => problem(403, 'CSRF_INVALID', '요청을 다시 시도하세요'),
    });
    const error = await apiClient.post('/todos', {}).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 403, code: 'CSRF_INVALID' });
    expect(api.calls('POST /todos')).toHaveLength(2);
  });

  it('CSRF 아닌 403(ACCOUNT_SUSPENDED 등)은 다시 보내지 않는다', async () => {
    const api = mockApi({ 'POST /auth/login': () => problem(403, 'ACCOUNT_SUSPENDED', '이용이 제한된 계정이에요.') });
    await expect(apiClient.post('/auth/login', {})).rejects.toMatchObject({ code: 'ACCOUNT_SUSPENDED' });
    expect(api.calls('POST /auth/login')).toHaveLength(1);
  });
});

describe('401 — 로그인이 끝남 (US-34, D-072)', () => {
  it('어느 API든 401이면 등록된 처리기에 알린다 (보기 요청)', async () => {
    const handler = vi.fn(async () => false);
    setUnauthenticatedHandler(handler);
    mockApi({ 'GET /todos': () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요') });
    await expect(apiClient.get('/todos')).rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
    expect(handler).toHaveBeenCalledWith({ method: 'GET', path: '/todos' });
  });

  it('저장 요청이 401이고 처리기가 다시 로그인하면(true) 같은 요청을 새 CSRF로 한 번 더 보낸다', async () => {
    setCsrfCookie('before');
    let tries = 0;
    setUnauthenticatedHandler(async () => {
      setCsrfCookie('after-login');
      return true;
    });
    const api = mockApi({
      'POST /schedules': () => (++tries === 1 ? problem(401, 'UNAUTHENTICATED', '로그인이 필요해요') : json(201, { id: 7 })),
    });
    await expect(apiClient.post('/schedules', { title: '회의' })).resolves.toEqual({ id: 7 });
    const sent = api.calls('POST /schedules');
    expect(sent.map((r) => r.headers['x-xsrf-token'])).toEqual(['before', 'after-login']);
    expect(sent[1].body).toEqual({ title: '회의' });
  });

  it('처리기가 다시 보내지 않기로 하면(false) 401 오류 그대로', async () => {
    setUnauthenticatedHandler(async () => false);
    const api = mockApi({ 'POST /schedules': () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요') });
    await expect(apiClient.post('/schedules', {})).rejects.toMatchObject({ status: 401 });
    expect(api.calls('POST /schedules')).toHaveLength(1);
  });

  it('로그인 API(/auth/...)의 401은 "비밀번호가 틀림"이라 처리기에 알리지 않는다', async () => {
    const handler = vi.fn(async () => true);
    setUnauthenticatedHandler(handler);
    mockApi({ 'POST /auth/login': () => problem(401, 'UNAUTHENTICATED', '이메일 또는 비밀번호가 맞지 않아요') });
    await expect(apiClient.post('/auth/login', {})).rejects.toMatchObject({ message: '이메일 또는 비밀번호가 맞지 않아요' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('GET /me의 401도 처리기에 알리지 않는다 (앱을 열 때 로그인 확인용)', async () => {
    const handler = vi.fn(async () => true);
    setUnauthenticatedHandler(handler);
    mockApi({ 'GET /me': () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요') });
    await expect(apiClient.get('/me')).rejects.toMatchObject({ status: 401 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('다시 보낸 요청도 401이면 더 묻지 않고 오류', async () => {
    const handler = vi.fn(async () => true);
    setUnauthenticatedHandler(handler);
    const api = mockApi({ 'PUT /memos/:id': () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요') });
    await expect(apiClient.put('/memos/1', {})).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(api.calls('PUT /memos/:id')).toHaveLength(2);
  });
});

describe('429 대기 시간 (US-34, D-072)', () => {
  it('Retry-After(초)를 ApiError.retryAfterSeconds로 준다', async () => {
    mockApi({
      'POST /auth/login': () => ({ ...problem(429, 'TOO_MANY_REQUESTS', '이메일 또는 비밀번호가 맞지 않아요'), headers: { 'Retry-After': '28' } }),
    });
    const error = await apiClient.post('/auth/login', {}).catch((e) => e);
    expect(error).toMatchObject({ status: 429, retryAfterSeconds: 28 });
  });
});
