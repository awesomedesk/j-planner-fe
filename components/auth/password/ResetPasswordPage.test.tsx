import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { goTo } from '@utils/navigation';

import ResetPasswordPage from './ResetPasswordPage';

vi.mock('@utils/navigation', () => ({ goTo: vi.fn(), currentPath: () => window.location.pathname + window.location.search }));

const TOKEN = 'b'.repeat(43);
const NEW_PASSWORD = '새로 만든 긴 비밀번호 문장';
const ME = { email: 'qa-fe-03@example.com', name: '검수', hasPassword: true, loginMethods: ['EMAIL'] };
const NOT_LOGGED_IN = () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요');
const signedOut = (routes: Parameters<typeof mockApi>[0] = {}) =>
  mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': NOT_LOGGED_IN, ...routes });

const openReset = (search = `?token=${TOKEN}`) => {
  window.history.replaceState(null, '', `/password/reset${search}`);
  return renderWithStore(<ResetPasswordPage />);
};
type User = ReturnType<typeof openReset>['user'];
const change = async (user: User, password = NEW_PASSWORD) => {
  await user.type(await screen.findByLabelText('새 비밀번호'), password);
  await user.click(screen.getByRole('button', { name: '비밀번호 바꾸기' }));
};

beforeEach(() => {
  vi.mocked(goTo).mockClear();
  sessionStorage.clear();
});
afterEach(() => window.history.replaceState(null, '', '/'));

describe('새 비밀번호 /password/reset (US-35, D-079 · SITE-05f)', () => {
  it('카드: "새 비밀번호 만들기" · 새 비밀번호(공통 규칙) · [비밀번호 바꾸기], 토큰은 주소창에서 지운다', async () => {
    const api = signedOut();
    openReset();
    expect(await screen.findByRole('heading', { name: '새 비밀번호 만들기' })).toBeInTheDocument();
    expect(screen.getByLabelText('새 비밀번호')).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByRole('button', { name: '비밀번호 보기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '비밀번호 바꾸기' })).toBeInTheDocument();
    expect(window.location.search).toBe('');
    expect(window.location.pathname).toBe('/password/reset');
    expect(api.calls('POST /auth/password/reset')).toHaveLength(0);
  });

  it('15자 미만이면 보내지 않고 칸 아래 오류', async () => {
    const api = signedOut();
    const { user } = openReset();
    await change(user, 'short');
    expect(api.calls('POST /auth/password/reset')).toHaveLength(0);
    expect(screen.getByLabelText('새 비밀번호')).toHaveAccessibleDescription(/비밀번호는 15자 이상이어야 해요\./);
    expect(screen.getByLabelText('새 비밀번호')).toHaveFocus();
  });

  it('204 → POST /auth/password/reset {token, newPassword} → /login + 초록 안내', async () => {
    const api = signedOut({ 'POST /auth/password/reset': () => json(204) });
    const { user } = openReset();
    await change(user);
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/login'));
    expect(api.calls('POST /auth/password/reset')[0].body).toEqual({ token: TOKEN, newPassword: NEW_PASSWORD });
    expect(api.calls('POST /auth/password/reset')[0].headers['x-xsrf-token']).toBe('test-csrf');
    expect(sessionStorage.getItem('jp.auth.loginNotice')).toBe('passwordReset');
  });

  it('이 브라우저가 로그인 중이었으면 로그인 정보도 지운다 (POST /auth/logout, 실패해도 /login으로)', async () => {
    const api = mockApi({
      'GET /auth/csrf': () => json(204),
      'GET /me': () => json(200, ME),
      'POST /auth/password/reset': () => json(204),
      'POST /auth/logout': () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요'),
    });
    const { user } = openReset();
    await change(user);
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/login'));
    expect(api.calls('POST /auth/logout')).toHaveLength(1);
  });

  it('400 PASSWORD_REJECTED → 칸 아래 이유, 같은 링크로 다시 입력', async () => {
    let attempt = 0;
    const api = signedOut({
      'POST /auth/password/reset': () =>
        attempt++ === 0
          ? problem(400, 'PASSWORD_REJECTED', 'x', [{ field: 'newPassword', message: '유출된 적이 있는 비밀번호예요. 다른 비밀번호를 써 주세요.' }])
          : json(204),
    });
    const { user } = openReset();
    await change(user);
    const input = screen.getByLabelText('새 비밀번호');
    await waitFor(() => expect(input).toHaveAccessibleDescription(/유출된 적이 있는 비밀번호예요/));
    expect(input).toHaveFocus();
    await user.clear(input);
    await change(user, '다른 긴 비밀번호 문장 하나 더');
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/login'));
    expect(api.calls('POST /auth/password/reset')[1].body).toEqual({ token: TOKEN, newPassword: '다른 긴 비밀번호 문장 하나 더' });
  });

  it('400 TOKEN_INVALID → "링크가 만료됐거나 이미 사용됐어요…" + [다시 찾기]', async () => {
    signedOut({ 'POST /auth/password/reset': () => problem(400, 'TOKEN_INVALID', '링크가 올바르지 않아요') });
    const { user } = openReset();
    await change(user);
    expect(await screen.findByRole('heading', { name: '링크가 만료됐거나 이미 사용됐어요' })).toBeInTheDocument();
    expect(screen.getByText('링크는 30분 동안 한 번만 쓸 수 있어요')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '다시 찾기' })).toHaveAttribute('href', '/password/forgot');
  });

  it('토큰이 없으면 바로 실패 모양', async () => {
    signedOut();
    openReset('');
    expect(await screen.findByRole('heading', { name: '링크가 만료됐거나 이미 사용됐어요' })).toBeInTheDocument();
    expect(screen.queryByLabelText('새 비밀번호')).not.toBeInTheDocument();
  });

  it('429 → 카드 오류 줄 + 버튼 잠금', async () => {
    signedOut({ 'POST /auth/password/reset': () => ({ ...problem(429, 'TOO_MANY_REQUESTS', 'x'), headers: { 'Retry-After': '9' } }) });
    const { user } = openReset();
    await change(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('요청이 너무 많아요. 9초 뒤에 다시 시도할 수 있어요');
    expect(screen.getByRole('button', { name: '비밀번호 바꾸기' })).toBeDisabled();
  });
});
