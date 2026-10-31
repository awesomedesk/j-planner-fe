import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { goTo } from '@utils/navigation';

import EmailChangeVerifyPage from './EmailChangeVerifyPage';

vi.mock('@utils/navigation', () => ({ goTo: vi.fn(), currentPath: () => window.location.pathname + window.location.search }));

const TOKEN = 'b'.repeat(43);
const NOT_LOGGED_IN = () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요');
const server = (routes: Parameters<typeof mockApi>[0] = {}) =>
  mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': NOT_LOGGED_IN, ...routes });

const openVerify = (search = `?token=${TOKEN}`) => {
  window.history.replaceState(null, '', `/email/verify${search}`);
  return renderWithStore(<EmailChangeVerifyPage />);
};

beforeEach(() => {
  vi.mocked(goTo).mockClear();
  sessionStorage.clear();
});
afterEach(() => window.history.replaceState(null, '', '/'));

describe('새 이메일 인증 /email/verify (US-37 AC3, D-091 · 06 SITE-09a)', () => {
  it('열자마자 보내지 않는다: "이메일 변경을 마무리할게요" · 안내 · [이메일 변경 인증하기]', async () => {
    const api = server();
    openVerify();
    expect(await screen.findByRole('heading', { name: '이메일 변경을 마무리할게요' })).toBeInTheDocument();
    expect(screen.getByText('인증을 마치면 모든 기기에서 로그아웃돼요. 새 이메일로 다시 로그인해 주세요.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이메일 변경 인증하기' })).toBeInTheDocument();
    expect(api.calls('POST /me/email/verify')).toHaveLength(0);
  });

  it('토큰을 읽은 뒤 주소창에서 지운다', async () => {
    server();
    openVerify();
    await screen.findByRole('button', { name: '이메일 변경 인증하기' });
    await waitFor(() => expect(window.location.search).toBe(''));
  });

  it('[이메일 변경 인증하기] → POST /me/email/verify {token} → 204면 /login + "이메일을 바꿨어요…" (자동 로그인 없음)', async () => {
    const api = server({ 'POST /me/email/verify': () => json(204) });
    const { user } = openVerify();
    await user.click(await screen.findByRole('button', { name: '이메일 변경 인증하기' }));
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/login'));
    expect(api.calls('POST /me/email/verify')[0].body).toEqual({ token: TOKEN });
    expect(sessionStorage.getItem('jp.auth.loginNotice')).toBe('emailChanged');
  });

  it('400 TOKEN_INVALID → "링크가 만료됐거나 이미 사용됐어요. 내 계정에서 이메일 변경을 다시 요청해 주세요." + [로그인]', async () => {
    server({ 'POST /me/email/verify': () => problem(400, 'TOKEN_INVALID', '링크가 만료됐어요') });
    const { user } = openVerify();
    await user.click(await screen.findByRole('button', { name: '이메일 변경 인증하기' }));
    expect(await screen.findByText('링크가 만료됐거나 이미 사용됐어요. 내 계정에서 이메일 변경을 다시 요청해 주세요.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login');
  });

  it('토큰이 없으면 보내지 않고 같은 안내', async () => {
    const api = server();
    openVerify('');
    expect(await screen.findByText('링크가 만료됐거나 이미 사용됐어요. 내 계정에서 이메일 변경을 다시 요청해 주세요.')).toBeInTheDocument();
    expect(api.calls('POST /me/email/verify')).toHaveLength(0);
  });

  it('서버에 못 닿으면 카드 오류 줄, 토큰은 그대로 두고 다시 누를 수 있다', async () => {
    let fail = true;
    const api = server({ 'POST /me/email/verify': () => (fail ? problem(500, 'INTERNAL_ERROR', '서버 오류') : json(204)) });
    const { user } = openVerify();
    await user.click(await screen.findByRole('button', { name: '이메일 변경 인증하기' }));
    expect(await screen.findByText('잠시 문제가 있어요. 잠시 뒤 다시 시도해 주세요')).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole('button', { name: '이메일 변경 인증하기' }));
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/login'));
    expect(api.calls('POST /me/email/verify').map((c) => c.body)).toEqual([{ token: TOKEN }, { token: TOKEN }]);
  });
});
