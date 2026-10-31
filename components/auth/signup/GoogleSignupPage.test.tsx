import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NoticeCenter from '@components/notice/NoticeCenter';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { goTo } from '@utils/navigation';

import GoogleSignupPage from './GoogleSignupPage';

vi.mock('@utils/navigation', () => ({ goTo: vi.fn(), currentPath: () => window.location.pathname + window.location.search }));

const ME = { email: 'me@example.com', name: '나', hasPassword: true, loginMethods: ['EMAIL'] };
const NEW_ME = { email: 'qa-google@example.com', name: '구글 이름', hasPassword: false, loginMethods: ['GOOGLE'] };
const NOT_LOGGED_IN = () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요');
const PENDING = { email: 'qa-google@example.com', name: '구글 이름' };
const EXPIRED = () => problem(400, 'GOOGLE_SIGNUP_EXPIRED', '구글 가입 정보가 없어요');

/** 로그인 안 됨 + 구글 가입 대기 정보 */
const pending = (routes: Parameters<typeof mockApi>[0] = {}, info: object = PENDING) =>
  mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': NOT_LOGGED_IN, 'GET /auth/google/signup': () => json(200, info), ...routes });

const openPage = () => {
  window.history.replaceState(null, '', '/signup/google');
  return renderWithStore(
    <>
      <GoogleSignupPage />
      <NoticeCenter />
    </>
  );
};

type User = ReturnType<typeof openPage>['user'];
const nameBox = () => screen.getByRole('textbox', { name: '이름' });
const ageBox = () => screen.getByRole('checkbox', { name: '만 14세 이상이에요' });
const submit = (user: User) => user.click(screen.getByRole('button', { name: '가입하기' }));
const expiredView = async () => expect(await screen.findByText('시간이 지나 다시 해야 해요')).toBeInTheDocument();

beforeEach(() => {
  vi.mocked(goTo).mockClear();
  sessionStorage.clear();
});
afterEach(() => window.history.replaceState(null, '', '/'));

describe('구글 가입 확인 화면 /signup/google (US-36, D-083 · 06 SITE-05g)', () => {
  it('카드: 거의 다 됐어요 · 구글 계정으로 가입해요 · 구글 이메일(고칠 수 없음) · 이름(구글 이름 채움) · 만 14세 · 가입하기 · 약관 안내 · 다른 방법으로 가입하기', async () => {
    const api = pending();
    openPage();
    expect(await screen.findByText('거의 다 됐어요')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '구글 계정으로 가입해요' })).toBeInTheDocument();
    const email = screen.getByRole('textbox', { name: '이메일' });
    expect(email).toHaveValue('qa-google@example.com');
    expect(email).toHaveAttribute('readonly');
    expect(nameBox()).toHaveValue('구글 이름');
    expect(nameBox()).toHaveAccessibleDescription('달력에 보일 이름이에요. 별명도 괜찮아요');
    expect(ageBox()).not.toBeChecked();
    expect(screen.getByRole('button', { name: '가입하기' })).toBeInTheDocument();
    expect(screen.getByText(/가입하면 이용약관과 개인정보처리방침에 동의하는 것으로 봐요/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '다른 방법으로 가입하기' })).toHaveAttribute('href', '/signup');
    expect(api.calls('GET /auth/google/signup')).toHaveLength(1);
  });

  it('이미 로그인한 채로 오면 달력(/)으로, 가입 정보는 읽지 않는다', async () => {
    const api = mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': () => json(200, ME), 'GET /auth/google/signup': () => json(200, PENDING) });
    openPage();
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/'));
    expect(api.calls('GET /auth/google/signup')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: '가입하기' })).not.toBeInTheDocument();
  });

  it('이름이 비었거나 14세 미체크면 서버에 보내지 않고 칸 아래 오류, 첫 오류 칸에 포커스', async () => {
    const api = pending();
    const { user } = openPage();
    await user.clear(await screen.findByRole('textbox', { name: '이름' }));
    await submit(user);
    expect(api.calls('POST /auth/google/signup')).toHaveLength(0);
    expect(nameBox()).toHaveAccessibleDescription(/이름을 입력해 주세요\./);
    expect(nameBox()).toHaveAttribute('aria-invalid', 'true');
    expect(nameBox()).toHaveFocus();
    expect(ageBox()).toHaveAccessibleDescription('만 14세 이상만 가입할 수 있어요.');
  });

  it('이름이 50자를 넘으면 칸 아래 "이름은 1~50자로 입력해 주세요." (BE 문구와 같게)', async () => {
    const api = pending();
    const { user } = openPage();
    await user.clear(await screen.findByRole('textbox', { name: '이름' }));
    await user.type(nameBox(), '가'.repeat(51));
    await user.click(ageBox());
    await submit(user);
    expect(api.calls('POST /auth/google/signup')).toHaveLength(0);
    expect(nameBox()).toHaveAccessibleDescription(/이름은 1~50자로 입력해 주세요\./);
  });

  it('칸에 다시 쓰면 그 칸 오류만 지운다', async () => {
    pending();
    const { user } = openPage();
    await user.clear(await screen.findByRole('textbox', { name: '이름' }));
    await submit(user);
    await user.type(nameBox(), '새 이름');
    expect(nameBox()).not.toHaveAttribute('aria-invalid');
    expect(ageBox()).toHaveAccessibleDescription('만 14세 이상만 가입할 수 있어요.');
  });

  it('201 → POST /auth/google/signup {name, ageOver14: true} + CSRF → 로그인된 채 달력(/)으로', async () => {
    const api = pending({ 'POST /auth/google/signup': () => json(201, NEW_ME) });
    const { user } = openPage();
    await user.click(await screen.findByRole('checkbox', { name: '만 14세 이상이에요' }));
    await submit(user);
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/'));
    expect(api.calls('POST /auth/google/signup')[0].body).toEqual({ name: '구글 이름', ageOver14: true });
    expect(api.calls('POST /auth/google/signup')[0].headers['x-xsrf-token']).toBe('test-csrf');
  });

  it('구글 시작 때 next가 있었으면 가입 뒤 그 화면으로, 바깥 주소면 달력으로', async () => {
    pending({ 'POST /auth/google/signup': () => json(201, NEW_ME) }, { ...PENDING, next: '/?view=day' });
    const first = openPage();
    await first.user.click(await screen.findByRole('checkbox', { name: '만 14세 이상이에요' }));
    await submit(first.user);
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/?view=day'));
    first.unmount();

    vi.mocked(goTo).mockClear();
    pending({ 'POST /auth/google/signup': () => json(201, NEW_ME) }, { ...PENDING, next: 'https://evil.example.com' });
    const second = openPage();
    await second.user.click(await screen.findByRole('checkbox', { name: '만 14세 이상이에요' }));
    await submit(second.user);
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/'));
  });

  it('앞뒤 공백은 지우고 보낸다', async () => {
    const api = pending({ 'POST /auth/google/signup': () => json(201, NEW_ME) });
    const { user } = openPage();
    await user.clear(await screen.findByRole('textbox', { name: '이름' }));
    await user.type(nameBox(), '  별명  ');
    await user.click(ageBox());
    await submit(user);
    await waitFor(() => expect(api.calls('POST /auth/google/signup')).toHaveLength(1));
    expect(api.calls('POST /auth/google/signup')[0].body).toEqual({ name: '별명', ageOver14: true });
  });

  it('대기 정보가 없으면(GET 400 GOOGLE_SIGNUP_EXPIRED) "시간이 지나 다시 해야 해요" + [구글로 계속하기] → 구글 처음부터', async () => {
    pending({ 'GET /auth/google/signup': EXPIRED });
    const { user } = openPage();
    await expiredView();
    expect(screen.queryByRole('button', { name: '가입하기' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '구글로 계속하기' }));
    expect(goTo).toHaveBeenCalledWith('/api/v1/auth/google');
  });

  it('가입하기에서 400 GOOGLE_SIGNUP_EXPIRED(10분 지남) → 같은 "시간이 지나…" 화면', async () => {
    pending({ 'POST /auth/google/signup': EXPIRED });
    const { user } = openPage();
    await user.click(await screen.findByRole('checkbox', { name: '만 14세 이상이에요' }));
    await submit(user);
    await expiredView();
    expect(screen.getByRole('button', { name: '구글로 계속하기' })).toBeInTheDocument();
  });

  it('400 VALIDATION_FAILED → BE 문구를 그 칸 아래, 첫 오류 칸에 포커스', async () => {
    pending({
      'POST /auth/google/signup': () =>
        problem(400, 'VALIDATION_FAILED', '입력값을 확인해 주세요', [{ field: 'name', message: '이름은 1~50자로 입력해 주세요.' }]),
    });
    const { user } = openPage();
    await user.click(await screen.findByRole('checkbox', { name: '만 14세 이상이에요' }));
    await submit(user);
    await waitFor(() => expect(nameBox()).toHaveAccessibleDescription(/이름은 1~50자로 입력해 주세요\./));
    expect(nameBox()).toHaveFocus();
  });

  it('409 이미 가입(기다리는 사이 같은 이메일) → 가입 화면과 같은 안내 + [로그인]·[비밀번호 찾기](이메일 넘김)', async () => {
    pending({
      'POST /auth/google/signup': () => ({
        ...problem(409, 'EMAIL_ALREADY_REGISTERED', '이미 가입된 이메일이에요'),
        body: { title: 'Conflict', status: 409, code: 'EMAIL_ALREADY_REGISTERED', detail: '이미 가입된 이메일이에요', errors: [], loginMethods: ['EMAIL'] },
      }),
    });
    const { user } = openPage();
    await user.click(await screen.findByRole('checkbox', { name: '만 14세 이상이에요' }));
    await submit(user);
    const email = screen.getByRole('textbox', { name: '이메일' });
    await waitFor(() => expect(email).toHaveAccessibleDescription(/이미 가입된 이메일이에요/));
    expect(screen.queryByRole('button', { name: '구글로 로그인' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '비밀번호 찾기' }));
    expect(goTo).toHaveBeenCalledWith('/password/forgot');
    expect(sessionStorage.getItem('jp.auth.email')).toBe('qa-google@example.com');

    await user.click(screen.getByRole('button', { name: '로그인' }));
    expect(goTo).toHaveBeenLastCalledWith('/login');
  });

  it('409 loginMethods에 GOOGLE이 있으면 [구글로 로그인] → 구글 로그인 시작', async () => {
    pending({
      'POST /auth/google/signup': () => ({
        ...problem(409, 'EMAIL_ALREADY_REGISTERED', '이미 가입된 이메일이에요'),
        body: { title: 'Conflict', status: 409, code: 'EMAIL_ALREADY_REGISTERED', detail: '이미 가입된 이메일이에요', errors: [], loginMethods: ['GOOGLE'] },
      }),
    });
    const { user } = openPage();
    await user.click(await screen.findByRole('checkbox', { name: '만 14세 이상이에요' }));
    await submit(user);
    await user.click(await screen.findByRole('button', { name: '구글로 로그인' }));
    expect(goTo).toHaveBeenCalledWith('/api/v1/auth/google');
    expect(screen.queryByRole('button', { name: '비밀번호 찾기' })).not.toBeInTheDocument();
  });

  it('가입 정보를 못 읽으면(서버에 못 닿음·500) 카드 오류 줄 "잠시 문제가 있어요…"', async () => {
    pending({ 'GET /auth/google/signup': () => problem(500, 'INTERNAL_ERROR', '서버 오류') });
    openPage();
    expect(await screen.findByText('잠시 문제가 있어요. 잠시 뒤 다시 시도해 주세요')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '가입하기' })).not.toBeInTheDocument();
  });

  it('보내는 중에는 [가입하기] 잠금 + "보내는 중…", 두 번 눌러도 요청 한 번', async () => {
    let release: () => void = () => {};
    const api = pending({
      'POST /auth/google/signup': () => new Promise((resolve) => (release = () => resolve(json(201, NEW_ME)))),
    });
    const { user } = openPage();
    await user.click(await screen.findByRole('checkbox', { name: '만 14세 이상이에요' }));
    await submit(user);
    const button = await screen.findByRole('button', { name: '보내는 중…' });
    expect(button).toBeDisabled();
    await user.click(button);
    release();
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/'));
    expect(api.calls('POST /auth/google/signup')).toHaveLength(1);
  });
});
