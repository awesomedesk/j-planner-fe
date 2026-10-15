import { act, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { passEmail } from '@utils/auth/handoff';
import { goTo } from '@utils/navigation';

import ForgotPasswordPage from './ForgotPasswordPage';

vi.mock('@utils/navigation', () => ({ goTo: vi.fn(), currentPath: () => window.location.pathname + window.location.search }));

const ME = { email: 'me@example.com', name: '나', hasPassword: true, loginMethods: ['EMAIL'] };
const NOT_LOGGED_IN = () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요');
const signedOut = (routes: Parameters<typeof mockApi>[0] = {}) =>
  mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': NOT_LOGGED_IN, ...routes });

const openForgot = () => {
  window.history.replaceState(null, '', '/password/forgot');
  return renderWithStore(<ForgotPasswordPage />);
};

beforeEach(() => {
  vi.mocked(goTo).mockClear();
  sessionStorage.clear();
});
afterEach(() => window.history.replaceState(null, '', '/'));

describe('비밀번호 찾기 /password/forgot (US-35, D-079 · SITE-05e)', () => {
  it('카드: "비밀번호 찾기" · 안내 · 이메일 · [재설정 메일 보내기] · 로그인으로 돌아가기', async () => {
    signedOut();
    openForgot();
    expect(await screen.findByRole('heading', { name: '비밀번호 찾기' })).toBeInTheDocument();
    expect(screen.getByText('가입한 이메일을 쓰면 비밀번호를 새로 만드는 링크를 보내 드려요')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '이메일' })).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByRole('button', { name: '재설정 메일 보내기' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '로그인으로 돌아가기' })).toHaveAttribute('href', '/login');
  });

  it('로그인한 채로 오면 달력(/)으로', async () => {
    mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': () => json(200, ME) });
    openForgot();
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/'));
  });

  it('로그인 화면에서 넘긴 이메일을 채워서 열고, 넘긴 값은 지운다', async () => {
    signedOut();
    passEmail('qa-fe-02@example.com');
    openForgot();
    expect(await screen.findByRole('textbox', { name: '이메일' })).toHaveValue('qa-fe-02@example.com');
    await waitFor(() => expect(sessionStorage.getItem('jp.auth.email')).toBeNull());
  });

  it('빈 칸·모양이 틀리면 보내지 않고 칸 아래 오류 + 포커스', async () => {
    const api = signedOut();
    const { user } = openForgot();
    await user.type(await screen.findByRole('textbox', { name: '이메일' }), 'qa-fe-02');
    await user.click(screen.getByRole('button', { name: '재설정 메일 보내기' }));
    expect(api.calls('POST /auth/password/forgot')).toHaveLength(0);
    expect(screen.getByRole('textbox', { name: '이메일' })).toHaveAccessibleDescription('이메일 주소를 확인해 주세요.');
    expect(screen.getByRole('textbox', { name: '이메일' })).toHaveFocus();
  });

  it('202 → 같은 주소에서 늘 같은 안내(가입 여부를 드러내지 않음) + [다시 보내기] + [로그인으로]', async () => {
    const api = signedOut({ 'POST /auth/password/forgot': () => json(202) });
    const { user } = openForgot();
    await user.type(await screen.findByRole('textbox', { name: '이메일' }), 'qa-fe-02@example.com');
    await user.click(screen.getByRole('button', { name: '재설정 메일 보내기' }));
    expect(await screen.findByText(/로 가입돼 있다면 메일을 보냈어요\. 30분 안에 링크를 눌러 주세요\./)).toBeInTheDocument();
    expect(screen.getByText('qa-fe-02@example.com')).toBeInTheDocument();
    expect(api.calls('POST /auth/password/forgot')[0].body).toEqual({ email: 'qa-fe-02@example.com' });
    expect(api.calls('POST /auth/password/forgot')[0].headers['x-xsrf-token']).toBe('test-csrf');
    expect(screen.getByRole('link', { name: '로그인으로' })).toHaveAttribute('href', '/login');
    expect(window.location.href).not.toContain('qa-fe-02');
  });

  it('[다시 보내기] → 같은 요청 + "다시 보냈어요" + 60초 잠금', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const api = signedOut({ 'POST /auth/password/forgot': () => json(202) });
    const { user } = openForgot();
    await user.type(await screen.findByRole('textbox', { name: '이메일' }), 'qa-fe-02@example.com');
    await user.click(screen.getByRole('button', { name: '재설정 메일 보내기' }));
    await user.click(await screen.findByRole('button', { name: '다시 보내기' }));
    expect(await screen.findByText('다시 보냈어요')).toBeInTheDocument();
    expect(api.calls('POST /auth/password/forgot')).toHaveLength(2);
    expect(screen.getByRole('button', { name: '다시 보내기' })).toBeDisabled();
    expect(screen.getByText('60초 뒤 다시 보낼 수 있어요')).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(60_000));
    expect(screen.getByRole('button', { name: '다시 보내기' })).toBeEnabled();
  });

  it('400은 이메일 칸 아래 BE 문구', async () => {
    signedOut({ 'POST /auth/password/forgot': () => problem(400, 'VALIDATION_FAILED', '입력값을 확인하세요', [{ field: 'email', message: '이메일 형식이 아니에요.' }]) });
    const { user } = openForgot();
    await user.type(await screen.findByRole('textbox', { name: '이메일' }), 'qa-fe-02@example.com');
    await user.click(screen.getByRole('button', { name: '재설정 메일 보내기' }));
    await waitFor(() => expect(screen.getByRole('textbox', { name: '이메일' })).toHaveAccessibleDescription('이메일 형식이 아니에요.'));
  });

  it('429 → 카드 오류 줄 + 버튼 잠금', async () => {
    signedOut({ 'POST /auth/password/forgot': () => ({ ...problem(429, 'TOO_MANY_REQUESTS', 'x'), headers: { 'Retry-After': '30' } }) });
    const { user } = openForgot();
    await user.type(await screen.findByRole('textbox', { name: '이메일' }), 'qa-fe-02@example.com');
    await user.click(screen.getByRole('button', { name: '재설정 메일 보내기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('요청이 너무 많아요. 30초 뒤에 다시 시도할 수 있어요');
    expect(screen.getByRole('button', { name: '재설정 메일 보내기' })).toBeDisabled();
  });
});
