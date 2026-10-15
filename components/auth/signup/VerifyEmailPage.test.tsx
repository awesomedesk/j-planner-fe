import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { goTo } from '@utils/navigation';

import VerifyEmailPage from './VerifyEmailPage';

vi.mock('@utils/navigation', () => ({ goTo: vi.fn(), currentPath: () => window.location.pathname + window.location.search }));

const TOKEN = 'a'.repeat(43);
const ME = { email: 'other@example.com', name: '다른 계정', hasPassword: true, loginMethods: ['EMAIL'] };
const NOT_LOGGED_IN = () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요');
const signedOut = (routes: Parameters<typeof mockApi>[0] = {}) =>
  mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': NOT_LOGGED_IN, ...routes });

const openVerify = (search = `?token=${TOKEN}`) => {
  window.history.replaceState(null, '', `/signup/verify${search}`);
  return renderWithStore(<VerifyEmailPage />);
};

beforeEach(() => {
  vi.mocked(goTo).mockClear();
  sessionStorage.clear();
});
afterEach(() => window.history.replaceState(null, '', '/'));

describe('이메일 인증 /signup/verify (US-33, D-079 · SITE-05d)', () => {
  it('열자마자 보내지 않는다: "가입을 마무리할게요" + [인증 끝내기] (메일 보안 검사기 대비)', async () => {
    const api = signedOut({ 'POST /auth/signup/verify': () => json(201) });
    openVerify();
    expect(await screen.findByRole('heading', { name: '가입을 마무리할게요' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '인증 끝내기' })).toBeEnabled();
    expect(api.calls('POST /auth/signup/verify')).toHaveLength(0);
  });

  it('토큰을 읽은 뒤 주소창에서 지운다 (history.replaceState)', async () => {
    signedOut();
    openVerify();
    await screen.findByRole('button', { name: '인증 끝내기' });
    expect(window.location.pathname).toBe('/signup/verify');
    expect(window.location.search).toBe('');
  });

  it('[인증 끝내기] → POST /auth/signup/verify {token} → 201이면 /login + 초록 안내 (자동 로그인 없음, D-066)', async () => {
    const api = signedOut({ 'POST /auth/signup/verify': () => json(201) });
    const { user } = openVerify();
    await user.click(await screen.findByRole('button', { name: '인증 끝내기' }));
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/login'));
    expect(api.calls('POST /auth/signup/verify')[0].body).toEqual({ token: TOKEN });
    expect(api.calls('POST /auth/signup/verify')[0].headers['x-xsrf-token']).toBe('test-csrf');
    expect(sessionStorage.getItem('jp.auth.loginNotice')).toBe('verified');
  });

  it('다른 계정으로 로그인 중이면 그대로 두고 "인증이 끝났어요" + [달력으로]', async () => {
    mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': () => json(200, ME), 'POST /auth/signup/verify': () => json(201) });
    const { user } = openVerify();
    await user.click(await screen.findByRole('button', { name: '인증 끝내기' }));
    expect(await screen.findByRole('heading', { name: '인증이 끝났어요' })).toBeInTheDocument();
    expect(goTo).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '달력으로' }));
    expect(goTo).toHaveBeenCalledWith('/');
  });

  it('400 TOKEN_INVALID → "링크가 만료됐거나 이미 사용됐어요" + [로그인]·[다시 가입하기]', async () => {
    signedOut({ 'POST /auth/signup/verify': () => problem(400, 'TOKEN_INVALID', '링크가 올바르지 않아요') });
    const { user } = openVerify();
    await user.click(await screen.findByRole('button', { name: '인증 끝내기' }));
    expect(await screen.findByRole('heading', { name: '링크가 만료됐거나 이미 사용됐어요' })).toBeInTheDocument();
    expect(screen.getByText('이미 인증했다면 로그인하면 돼요')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: '다시 가입하기' })).toHaveAttribute('href', '/signup');
  });

  it('토큰이 없으면 보내지 않고 바로 실패 모양', async () => {
    const api = signedOut();
    openVerify('');
    expect(await screen.findByRole('heading', { name: '링크가 만료됐거나 이미 사용됐어요' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '인증 끝내기' })).not.toBeInTheDocument();
    expect(api.calls('POST /auth/signup/verify')).toHaveLength(0);
  });

  it('429·서버 오류는 카드 오류 줄, 다시 누를 수 있다', async () => {
    let fail = true;
    signedOut({
      'POST /auth/signup/verify': () =>
        fail ? json(503, { title: 'x', status: 503, code: 'INTERNAL_ERROR', detail: 'x', errors: [] }) : json(201),
    });
    const { user } = openVerify();
    await user.click(await screen.findByRole('button', { name: '인증 끝내기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('잠시 문제가 있어요. 잠시 뒤 다시 시도해 주세요');
    fail = false;
    await user.click(screen.getByRole('button', { name: '인증 끝내기' }));
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/login'));
  });

  it('로그인 확인이 끝나기 전에도(서버에 못 닿아도) 화면은 열린다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    openVerify();
    expect(await screen.findByRole('button', { name: '인증 끝내기' })).toBeInTheDocument();
  });
});
