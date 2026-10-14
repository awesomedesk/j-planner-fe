import { act, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NoticeCenter from '@components/notice/NoticeCenter';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { goTo } from '@utils/navigation';

import LoginPage from './LoginPage';

vi.mock('@utils/navigation', () => ({ goTo: vi.fn(), currentPath: () => window.location.pathname + window.location.search }));

const ME = { email: 'qa@example.com', name: '검수', hasPassword: true, loginMethods: ['EMAIL'] };
const NOT_LOGGED_IN = () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요');
const FAILED = '이메일 또는 비밀번호가 맞지 않아요';

const openLogin = (search = '') => {
  window.history.replaceState(null, '', `/login${search}`);
  return renderWithStore(
    <>
      <LoginPage />
      <NoticeCenter />
    </>
  );
};

const fillAndSubmit = async (user: ReturnType<typeof openLogin>['user'], email = 'qa@example.com', password = 'pw-123456789012') => {
  await user.type(await screen.findByRole('textbox', { name: '이메일' }), email);
  await user.type(screen.getByLabelText('비밀번호'), password);
  await user.click(screen.getByRole('button', { name: '로그인' }));
};

beforeEach(() => vi.mocked(goTo).mockClear());
afterEach(() => window.history.replaceState(null, '', '/'));

describe('로그인 화면 /login (US-34, D-072)', () => {
  it('카드: J의 계획 · 구글로 계속하기 · 이메일 · 비밀번호(보기) · 로그인 · 비밀번호 찾기 · 가입하기 · 약관', async () => {
    mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': NOT_LOGGED_IN });
    openLogin();
    expect(await screen.findByRole('heading', { name: 'J의 계획' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '구글로 계속하기' })).toBeInTheDocument();
    expect(screen.getByText('또는')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '이메일' })).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
    for (const name of ['비밀번호 찾기', '가입하기', '이용약관', '개인정보처리방침']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('비밀번호 보기 버튼으로 글자를 보였다 숨긴다', async () => {
    mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': NOT_LOGGED_IN });
    const { user } = openLogin();
    const toggle = await screen.findByRole('button', { name: '비밀번호 보기' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('type', 'text');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await user.click(toggle);
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('type', 'password');
  });

  it.each(['구글로 계속하기', '비밀번호 찾기', '가입하기', '이용약관', '개인정보처리방침'])(
    '점선 자리 "%s"는 눌러도 오류 없이 "준비 중이에요" (D-008 방식)',
    async (name) => {
      const api = mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': NOT_LOGGED_IN });
      const { user } = openLogin();
      await user.click(await screen.findByRole('button', { name }));
      expect(await screen.findByRole('status')).toHaveTextContent('준비 중이에요');
      expect(api.all().map((r) => r.key)).toEqual(['GET /auth/csrf', 'GET /me']);
      expect(goTo).not.toHaveBeenCalled();
    }
  );

  it('로그인 성공 → POST /auth/login {email, password} → ?next= 화면으로', async () => {
    const api = mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': NOT_LOGGED_IN, 'POST /auth/login': () => json(200, ME) });
    const { user } = openLogin('?next=%2F%3Fview%3Dweek');
    await fillAndSubmit(user);
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/?view=week'));
    expect(api.calls('POST /auth/login')[0].body).toEqual({ email: 'qa@example.com', password: 'pw-123456789012' });
    expect(api.calls('POST /auth/login')[0].headers['x-xsrf-token']).toBe('test-csrf');
  });

  it('?next=가 바깥 주소면 무시하고 달력(/)으로', async () => {
    mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': NOT_LOGGED_IN, 'POST /auth/login': () => json(200, ME) });
    const { user } = openLogin('?next=https%3A%2F%2Fevil.example.com');
    await fillAndSubmit(user);
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/'));
  });

  it('Enter로도 로그인한다', async () => {
    const api = mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': NOT_LOGGED_IN, 'POST /auth/login': () => json(200, ME) });
    const { user } = openLogin();
    await user.type(await screen.findByRole('textbox', { name: '이메일' }), 'qa@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'pw{Enter}');
    await waitFor(() => expect(api.calls('POST /auth/login')).toHaveLength(1));
  });

  it('실패하면 BE 문구 한 줄, 화면은 그대로 (입력값 유지)', async () => {
    mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': NOT_LOGGED_IN, 'POST /auth/login': () => problem(401, 'UNAUTHENTICATED', FAILED) });
    const { user } = openLogin();
    await fillAndSubmit(user);
    expect(await screen.findByRole('alert')).toHaveTextContent(FAILED);
    expect(screen.getByRole('textbox', { name: '이메일' })).toHaveValue('qa@example.com');
    expect(goTo).not.toHaveBeenCalled();
  });

  it('정지 계정 403은 BE 문구 그대로', async () => {
    mockApi({
      'GET /auth/csrf': () => json(204),
      'GET /me': NOT_LOGGED_IN,
      'POST /auth/login': () => problem(403, 'ACCOUNT_SUSPENDED', '이용이 제한된 계정이에요.'),
    });
    const { user } = openLogin();
    await fillAndSubmit(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('이용이 제한된 계정이에요.');
  });

  it('늦추기(429) 중: 같은 문구 + "n초 뒤에 다시 시도할 수 있어요", 그동안 [로그인] 잠금 (Retry-After)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockApi({
      'GET /auth/csrf': () => json(204),
      'GET /me': NOT_LOGGED_IN,
      'POST /auth/login': () => ({ ...problem(429, 'TOO_MANY_REQUESTS', FAILED), headers: { 'Retry-After': '3' } }),
    });
    const { user } = openLogin();
    await fillAndSubmit(user);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(FAILED);
    expect(alert).toHaveTextContent('3초 뒤에 다시 시도할 수 있어요');
    expect(screen.getByRole('button', { name: '로그인' })).toBeDisabled();

    await act(async () => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('alert')).toHaveTextContent('2초 뒤에 다시 시도할 수 있어요');

    await act(async () => vi.advanceTimersByTime(2000));
    expect(screen.getByRole('button', { name: '로그인' })).toBeEnabled();
    expect(screen.getByRole('alert')).not.toHaveTextContent('초 뒤에');
  });

  it('보내는 중에는 [로그인] 잠금 → 두 번 눌러도 요청 한 번', async () => {
    let finish: (value: ReturnType<typeof json>) => void = () => {};
    const api = mockApi({
      'GET /auth/csrf': () => json(204),
      'GET /me': NOT_LOGGED_IN,
      'POST /auth/login': () => new Promise((resolve) => (finish = resolve)),
    });
    const { user } = openLogin();
    await fillAndSubmit(user);
    expect(screen.getByRole('button', { name: '로그인' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '로그인' }));
    expect(api.calls('POST /auth/login')).toHaveLength(1);
    await act(async () => finish(json(200, ME)));
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/'));
  });

  it('이미 로그인했는데 /login에 오면 달력(/)으로', async () => {
    mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': () => json(200, ME) });
    openLogin('?next=%2F%3Fview%3Dday');
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/'));
    expect(screen.queryByRole('button', { name: '로그인' })).not.toBeInTheDocument();
  });
});
