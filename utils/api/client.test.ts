import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import type { components } from '@/types/api/schema';

import { json, mockApi, problem } from '@/test/mockApi';

import apiClient, { ApiError, isApiError } from './client';
import { toErrorMessage } from './errorMessage';
import type { ApiErrorCode } from './types';

describe('API 연결 — 순수 REST (US-03, D-031)', () => {
  it('성공 응답은 감싸기 없이 JSON 그대로, 주소 앞에 /api/v1', async () => {
    const api = mockApi({ 'GET /categories': () => json(200, [{ id: 1 }]) });
    await expect(apiClient.get('/categories')).resolves.toEqual([{ id: 1 }]);
    expect(String(api.fetch.mock.calls[0][0])).toBe('http://api.test/api/v1/categories');
  });

  it('204는 undefined', async () => {
    mockApi({ 'DELETE /categories/:id': () => json(204) });
    await expect(apiClient.delete('/categories/3')).resolves.toBeUndefined();
  });

  it('배열 쿼리는 같은 이름으로 반복, null·undefined는 빠짐', async () => {
    const api = mockApi({ 'GET /schedules': () => json(200, []) });
    await apiClient.get('/schedules', { from: '2026-09-01', to: '2026-09-30', categoryId: [1, 3], x: null });
    expect(api.calls('GET /schedules')[0].query.toString()).toBe('from=2026-09-01&to=2026-09-30&categoryId=1&categoryId=3');
  });

  it('PATCH는 JSON 본문 그대로 (Merge Patch)', async () => {
    const api = mockApi({ 'PATCH /schedules/:id': (req) => json(200, req.body) });
    await apiClient.patch('/schedules/1', { color: null });
    expect(api.calls('PATCH /schedules/:id')[0].body).toEqual({ color: null });
  });
});

describe('오류 → ApiError (US-03, 08-api-design 2-6)', () => {
  it('Problem Details: status·code·errors, 메시지 = 서버 detail', async () => {
    mockApi({
      'POST /schedules': () => problem(400, 'VALIDATION_FAILED', '입력값을 확인하세요.', [{ field: 'title', message: '제목을 입력하세요.' }]),
    });
    const error = await apiClient.post('/schedules', {}).catch((e) => e);
    expect(isApiError(error)).toBe(true);
    expect(error).toMatchObject({ status: 400, code: 'VALIDATION_FAILED', message: '입력값을 확인하세요.' });
    expect((error as ApiError).errors).toEqual([{ field: 'title', message: '제목을 입력하세요.' }]);
  });

  it('동시 저장 충돌 409 CONFLICT: 서버 detail을 그대로 안내 (BE a84d59c)', async () => {
    mockApi({ 'PUT /diaries/2026-09-25': () => problem(409, 'CONFLICT', '다른 요청과 겹쳐 저장하지 못했습니다. 다시 시도하세요.') });
    const error = await apiClient.put('/diaries/2026-09-25', { content: '오늘' }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: 'CONFLICT' });
    expect(toErrorMessage(error)).toBe('다른 요청과 겹쳐 저장하지 못했습니다. 다시 시도하세요.');
  });

  it('FE 오류 코드 목록은 API 명세(openapi)와 같다', () => {
    expectTypeOf<ApiErrorCode>().toEqualTypeOf<components['schemas']['Problem']['code']>();
  });

  it('형식이 틀린 값도 errors에 필드 이름이 온다 → 필드별로 받을 수 있다', async () => {
    mockApi({ 'POST /todos': () => problem(400, 'VALIDATION_FAILED', '입력값을 확인하세요', [{ field: 'type', message: '올바른 값이 아닙니다' }]) });
    const error = (await apiClient.post('/todos', { type: 'YEAR' }).catch((e) => e)) as ApiError;
    expect(error.errors).toEqual([{ field: 'type', message: '올바른 값이 아닙니다' }]);
  });

  it('Problem Details가 아닌 오류는 UNKNOWN_ERROR + 기본 문구', async () => {
    mockApi({ 'GET /categories': () => ({ status: 502, body: '<html>bad gateway</html>', contentType: 'text/html' }) });
    const error = await apiClient.get('/categories').catch((e) => e);
    expect(error).toMatchObject({ status: 502, code: 'UNKNOWN_ERROR', message: '요청을 처리하지 못했어요. 잠시 후 다시 시도하세요.' });
  });

  it('응답을 못 받으면 NETWORK_ERROR (status 0)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const error = await apiClient.get('/health').catch((e) => e);
    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR', message: '서버에 연결할 수 없어요. 잠시 후 다시 시도하세요.' });
  });

  it('화면 문구: ApiError면 그 메시지, 아니면 기본 문구', () => {
    expect(toErrorMessage(new ApiError({ message: '없어요', status: 404, code: 'NOT_FOUND' }))).toBe('없어요');
    expect(toErrorMessage(new Error('boom'))).toBe('요청을 처리하지 못했어요. 잠시 후 다시 시도하세요.');
  });
});
