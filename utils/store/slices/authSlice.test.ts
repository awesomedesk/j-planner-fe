import { describe, expect, it } from 'vitest';

import { setCsrfCookie } from '@/test/csrfCookie';
import { json, mockApi, problem } from '@/test/mockApi';
import { makeStore } from '@store/store';

import { checkSession, selectAuth } from './authSlice';

const ME = { email: 'qa@example.com', name: '검수', hasPassword: true, loginMethods: ['EMAIL'] };

describe('앱을 열 때 로그인 확인 (US-34, 08 13-1·13-4)', () => {
  it('GET /auth/csrf로 CSRF 쿠키를 받고 GET /me 200이면 로그인 상태 + 내 정보', async () => {
    const api = mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': () => json(200, ME) });
    const store = makeStore();
    expect(selectAuth(store.getState()).status).toBe('idle');
    await store.dispatch(checkSession());
    expect(api.all().map((r) => r.key)).toEqual(['GET /auth/csrf', 'GET /me']);
    expect(selectAuth(store.getState())).toEqual({ status: 'signedIn', me: ME });
  });

  it('GET /me 401이면 로그인 안 한 상태', async () => {
    mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요') });
    const store = makeStore();
    await store.dispatch(checkSession());
    expect(selectAuth(store.getState())).toEqual({ status: 'signedOut', me: null });
  });

  it('서버에 닿지 않으면 error (로그인 화면으로 보내지 않음)', async () => {
    setCsrfCookie(null);
    mockApi({
      'GET /auth/csrf': () => {
        throw new TypeError('Failed to fetch');
      },
    });
    const store = makeStore();
    await store.dispatch(checkSession());
    expect(selectAuth(store.getState()).status).toBe('error');
  });

  it('확인 중에 다시 불러도 요청은 한 번', async () => {
    const api = mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': () => json(200, ME) });
    const store = makeStore();
    await Promise.all([store.dispatch(checkSession()), store.dispatch(checkSession())]);
    expect(api.calls('GET /me')).toHaveLength(1);
  });
});
