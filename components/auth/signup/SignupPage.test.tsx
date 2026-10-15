import { act, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NoticeCenter from '@components/notice/NoticeCenter';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { goTo } from '@utils/navigation';

import SignupPage from './SignupPage';

vi.mock('@utils/navigation', () => ({ goTo: vi.fn(), currentPath: () => window.location.pathname + window.location.search }));

const ME = { email: 'me@example.com', name: '나', hasPassword: true, loginMethods: ['EMAIL'] };
const NOT_LOGGED_IN = () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요');
const GOOD_PASSWORD = '긴 문장 비밀번호 열다섯자 넘음';
const signedOut = (routes: Parameters<typeof mockApi>[0] = {}) =>
  mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': NOT_LOGGED_IN, ...routes });

const openSignup = () => {
  window.history.replaceState(null, '', '/signup');
  return renderWithStore(
    <>
      <SignupPage />
      <NoticeCenter />
    </>
  );
};

type User = ReturnType<typeof openSignup>['user'];
const fill = async (user: User, { email = 'qa-fe-01@example.com', name = '검수', password = GOOD_PASSWORD, age = true } = {}) => {
  if (email) await user.type(await screen.findByRole('textbox', { name: '이메일' }), email);
  if (name) await user.type(screen.getByRole('textbox', { name: '이름' }), name);
  if (password) await user.type(screen.getByLabelText('비밀번호'), password);
  if (age) await user.click(screen.getByRole('checkbox', { name: '만 14세 이상이에요' }));
};
const submit = (user: User) => user.click(screen.getByRole('button', { name: '가입하기' }));

beforeEach(() => {
  vi.mocked(goTo).mockClear();
  sessionStorage.clear();
});
afterEach(() => window.history.replaceState(null, '', '/'));

describe('가입 화면 /signup (US-33, D-079 · SITE-05b)', () => {
  it('카드: J의 계획 · 구글로 계속하기(점선) · 또는 · 이메일 · 이름 · 비밀번호 · 만 14세 · 가입하기 · 약관 안내 · 로그인 링크', async () => {
    signedOut();
    openSignup();
    expect(await screen.findByRole('heading', { name: 'J의 계획' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '구글로 계속하기' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '이메일' })).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByRole('textbox', { name: '이름' })).toHaveAccessibleDescription('달력에 보일 이름이에요. 별명도 괜찮아요');
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByRole('checkbox', { name: '만 14세 이상이에요' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: '가입하기' })).toBeInTheDocument();
    expect(screen.getByText(/가입하면 이용약관과 개인정보처리방침에 동의하는 것으로 봐요/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이용약관' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login');
  });

  it('로그인한 채로 오면 달력(/)으로', async () => {
    mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': () => json(200, ME) });
    openSignup();
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/'));
    expect(screen.queryByRole('button', { name: '가입하기' })).not.toBeInTheDocument();
  });

  it('빈 칸·15자 미만·14세 미체크는 서버에 보내지 않고 칸 아래 오류, 첫 오류 칸에 포커스 (SITE-05b 2)', async () => {
    const api = signedOut();
    const { user } = openSignup();
    await fill(user, { email: 'qa-fe-01@example', name: '', password: 'short', age: false });
    await submit(user);
    expect(api.calls('POST /auth/signup')).toHaveLength(0);
    const email = screen.getByRole('textbox', { name: '이메일' });
    expect(email).toHaveAccessibleDescription('이메일 주소를 확인해 주세요.');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveFocus();
    expect(screen.getByRole('textbox', { name: '이름' })).toHaveAccessibleDescription(/이름을 입력해 주세요\./);
    expect(screen.getByLabelText('비밀번호')).toHaveAccessibleDescription(/비밀번호는 15자 이상이어야 해요\./);
    expect(screen.getByRole('checkbox', { name: '만 14세 이상이에요' })).toHaveAccessibleDescription('만 14세 이상만 가입할 수 있어요.');
  });

  it('칸에 다시 쓰면 그 칸 오류만 지운다', async () => {
    signedOut();
    const { user } = openSignup();
    await fill(user, { email: '', name: '', password: '', age: false });
    await submit(user);
    await user.type(screen.getByRole('textbox', { name: '이름' }), '검');
    expect(screen.getByRole('textbox', { name: '이름' })).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox', { name: '이메일' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('202 → POST /auth/signup {email, password, name, ageOver14: true} + CSRF → 같은 주소에서 "메일을 확인해 주세요" (SITE-05c)', async () => {
    const api = signedOut({ 'POST /auth/signup': () => json(202) });
    const { user } = openSignup();
    await fill(user);
    await submit(user);
    expect(await screen.findByRole('heading', { name: '메일을 확인해 주세요' })).toBeInTheDocument();
    expect(api.calls('POST /auth/signup')[0].body).toEqual({ email: 'qa-fe-01@example.com', password: GOOD_PASSWORD, name: '검수', ageOver14: true });
    expect(api.calls('POST /auth/signup')[0].headers['x-xsrf-token']).toBe('test-csrf');
    expect(screen.getByText('qa-fe-01@example.com')).toBeInTheDocument();
    expect(screen.getByText(/로 인증 메일을 보냈어요\. 24시간 안에 메일의 링크를 눌러 주세요\./)).toBeInTheDocument();
    expect(window.location.pathname + window.location.search).toBe('/signup');
    expect(goTo).not.toHaveBeenCalled();
  });

  it('400 VALIDATION_FAILED·PASSWORD_REJECTED → BE 문구를 그 칸 아래, 첫 오류 칸에 포커스', async () => {
    signedOut({
      'POST /auth/signup': () =>
        problem(400, 'PASSWORD_REJECTED', '비밀번호를 쓸 수 없어요', [{ field: 'password', message: '유출된 적이 있는 비밀번호예요. 다른 비밀번호를 써 주세요.' }]),
    });
    const { user } = openSignup();
    await fill(user);
    await submit(user);
    const password = screen.getByLabelText('비밀번호');
    await waitFor(() => expect(password).toHaveAccessibleDescription(/유출된 적이 있는 비밀번호예요/));
    expect(password).toHaveFocus();
    expect(screen.getByRole('textbox', { name: '이메일' })).toHaveValue('qa-fe-01@example.com');
  });

  it('409 이미 가입 → 이메일 칸 아래 안내 + [로그인]·[비밀번호 찾기](이메일 넘김), 비밀번호는 지운다', async () => {
    signedOut({
      'POST /auth/signup': () => ({
        ...problem(409, 'EMAIL_ALREADY_REGISTERED', '이미 가입된 이메일이에요'),
        body: { title: 'Conflict', status: 409, code: 'EMAIL_ALREADY_REGISTERED', detail: '이미 가입된 이메일이에요', errors: [], loginMethods: ['EMAIL'] },
      }),
    });
    const { user } = openSignup();
    await fill(user);
    await submit(user);
    const email = screen.getByRole('textbox', { name: '이메일' });
    await waitFor(() => expect(email).toHaveAccessibleDescription(/이미 가입된 이메일이에요/));
    expect(email).toHaveFocus();
    expect(screen.getByLabelText('비밀번호')).toHaveValue('');
    expect(screen.queryByRole('button', { name: '구글로 로그인' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '비밀번호 찾기' }));
    expect(goTo).toHaveBeenCalledWith('/password/forgot');
    expect(sessionStorage.getItem('jp.auth.email')).toBe('qa-fe-01@example.com');

    sessionStorage.clear();
    await user.click(screen.getByRole('button', { name: '로그인' }));
    expect(goTo).toHaveBeenLastCalledWith('/login');
    expect(sessionStorage.getItem('jp.auth.email')).toBe('qa-fe-01@example.com');
  });

  it('429 → 카드 오류 줄 "요청이 너무 많아요. n초 뒤에…" + [가입하기] 잠금, 초가 줄어든다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    signedOut({ 'POST /auth/signup': () => ({ ...problem(429, 'TOO_MANY_REQUESTS', '요청이 너무 많아요'), headers: { 'Retry-After': '2' } }) });
    const { user } = openSignup();
    await fill(user);
    await submit(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('요청이 너무 많아요. 2초 뒤에 다시 시도할 수 있어요');
    expect(screen.getByRole('button', { name: '가입하기' })).toBeDisabled();
    await act(async () => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('alert')).toHaveTextContent('1초 뒤에');
    await act(async () => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('button', { name: '가입하기' })).toBeEnabled();
  });

  it('서버에 못 닿으면 "잠시 문제가 있어요…", 쓴 내용은 그대로', async () => {
    signedOut({ 'POST /auth/signup': () => json(500, { title: 'x', status: 500, code: 'INTERNAL_ERROR', detail: '서버 오류', errors: [] }) });
    const { user } = openSignup();
    await fill(user);
    await submit(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('잠시 문제가 있어요. 잠시 뒤 다시 시도해 주세요');
    expect(screen.getByRole('textbox', { name: '이름' })).toHaveValue('검수');
    expect(screen.getByLabelText('비밀번호')).toHaveValue(GOOD_PASSWORD);
  });

  it('보내는 중에는 [가입하기] 잠금 + "보내는 중…", 두 번 눌러도 요청 한 번', async () => {
    let finish: (value: ReturnType<typeof json>) => void = () => {};
    const api = signedOut({ 'POST /auth/signup': () => new Promise((resolve) => (finish = resolve)) });
    const { user } = openSignup();
    await fill(user);
    await submit(user);
    const sending = screen.getByRole('button', { name: '보내는 중…' });
    expect(sending).toBeDisabled();
    await user.click(sending);
    expect(api.calls('POST /auth/signup')).toHaveLength(1);
    await act(async () => finish(json(202)));
    expect(await screen.findByRole('heading', { name: '메일을 확인해 주세요' })).toBeInTheDocument();
  });
});

describe('메일 확인 안내 (US-33, D-079 · SITE-05c)', () => {
  const openSent = async (routes: Parameters<typeof mockApi>[0] = {}) => {
    const api = signedOut({ 'POST /auth/signup': () => json(202), 'POST /auth/signup/resend': () => json(202), ...routes });
    const view = openSignup();
    await fill(view.user);
    await submit(view.user);
    await screen.findByRole('heading', { name: '메일을 확인해 주세요' });
    return { ...view, api };
  };

  it('[인증 메일 다시 보내기] → POST /auth/signup/resend {email} → "다시 보냈어요" + 60초 잠금', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { user, api } = await openSent();
    await user.click(screen.getByRole('button', { name: '인증 메일 다시 보내기' }));
    expect(await screen.findByText('다시 보냈어요')).toBeInTheDocument();
    expect(api.calls('POST /auth/signup/resend')[0].body).toEqual({ email: 'qa-fe-01@example.com' });
    expect(screen.getByRole('button', { name: '인증 메일 다시 보내기' })).toBeDisabled();
    expect(screen.getByText('60초 뒤 다시 보낼 수 있어요')).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(1000));
    expect(screen.getByText('59초 뒤 다시 보낼 수 있어요')).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(59_000));
    expect(screen.getByRole('button', { name: '인증 메일 다시 보내기' })).toBeEnabled();
  });

  it('스팸함 안내 + [다시 가입하기] → 빈 가입 화면', async () => {
    const { user } = await openSent();
    expect(screen.getByText(/메일이 안 왔나요\? 스팸함을 확인해 주세요\. 이메일을 잘못 썼다면/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다시 가입하기' }));
    expect(await screen.findByRole('textbox', { name: '이메일' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: '이름' })).toHaveValue('');
    expect(screen.getByLabelText('비밀번호')).toHaveValue('');
  });

  it('이메일은 주소(URL)·sessionStorage에 남기지 않는다', async () => {
    await openSent();
    expect(window.location.href).not.toContain('qa-fe-01');
    expect(JSON.stringify({ ...sessionStorage })).not.toContain('qa-fe-01');
  });
});
