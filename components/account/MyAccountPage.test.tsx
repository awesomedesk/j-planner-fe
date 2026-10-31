import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { json, mockApi, problem } from '@/test/mockApi';
import { goTo } from '@utils/navigation';

import { card, ME, ME_WITH_GOOGLE, GOOGLE_IDENTITY, openAccount, REAUTH_REQUIRED, reauthDialog, signedIn } from './testHelpers';

vi.mock('@utils/navigation', () => ({ goTo: vi.fn(), currentPath: () => window.location.pathname + window.location.search }));

beforeEach(() => {
  vi.mocked(goTo).mockClear();
  sessionStorage.clear();
});
afterEach(() => window.history.replaceState(null, '', '/'));

describe('내 계정 화면 /me — 진입·배치 (US-37 AC1, D-091 · 06 SITE-09)', () => {
  it('[달력으로 돌아가기] · 제목 "내 계정" · 카드 순서 기본 정보 → 비밀번호 → 로그인 수단 → 로그인한 기기 → 회원 탈퇴', async () => {
    signedIn();
    openAccount();
    expect(await screen.findByRole('heading', { level: 1, name: '내 계정' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '달력으로 돌아가기' })).toHaveAttribute('href', '/');
    const regions = screen.getAllByRole('region').map((r) => r.getAttribute('aria-label') ?? within(r).getAllByRole('heading')[0].textContent);
    expect(regions).toEqual(['기본 정보', '비밀번호 바꾸기', '로그인 수단', '로그인한 기기', '회원 탈퇴']);
  });

  it('로그인하지 않았으면 /login?next=/me', async () => {
    mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요') });
    openAccount();
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/login?next=%2Fme'));
  });
});

describe('내 계정 — 기본 정보: 이름 (US-37 AC4, SITE-09)', () => {
  it('이름 칸에 지금 이름, [이름 저장] → PATCH /me {name}(앞뒤 공백 정리, 재인증 없음) → "이름을 바꿨어요" + 헤더 이름도 바뀜', async () => {
    const api = signedIn({ 'PATCH /me': () => json(200, { ...ME, name: '새 이름' }) });
    const { user, store } = openAccount();
    const basic = await card('기본 정보');
    const name = basic.getByRole('textbox', { name: '이름' });
    expect(name).toHaveValue('검수');
    await user.clear(name);
    await user.type(name, '  새 이름  ');
    await user.click(basic.getByRole('button', { name: '이름 저장' }));
    expect(await basic.findByRole('status')).toHaveTextContent('이름을 바꿨어요');
    expect(api.calls('PATCH /me')[0].body).toEqual({ name: '새 이름' });
    expect(api.calls('POST /me/reauth')).toHaveLength(0);
    expect(store.getState().auth.me?.name).toBe('새 이름');
  });

  it.each([
    ['', '이름을 입력해 주세요'],
    ['가'.repeat(51), '이름은 1~50자로 입력해 주세요'],
  ])('이름 "%s" → 보내지 않고 칸 아래 "%s", 칸에 포커스', async (value, message) => {
    const api = signedIn();
    const { user } = openAccount();
    const basic = await card('기본 정보');
    const name = basic.getByRole('textbox', { name: '이름' });
    await user.clear(name);
    if (value) await user.type(name, value);
    await user.click(basic.getByRole('button', { name: '이름 저장' }));
    expect(name).toHaveAccessibleDescription(message);
    expect(name).toHaveFocus();
    expect(api.calls('PATCH /me')).toHaveLength(0);
  });

  it('서버 400 errors name은 칸 아래 그대로, 입력은 유지', async () => {
    signedIn({ 'PATCH /me': () => problem(400, 'VALIDATION_FAILED', '입력값을 확인해 주세요', [{ field: 'name', message: '이름은 1~50자로 입력해 주세요' }]) });
    const { user } = openAccount();
    const basic = await card('기본 정보');
    const name = basic.getByRole('textbox', { name: '이름' });
    await user.type(name, '!');
    await user.click(basic.getByRole('button', { name: '이름 저장' }));
    await waitFor(() => expect(name).toHaveAccessibleDescription('이름은 1~50자로 입력해 주세요'));
    expect(name).toHaveValue('검수!');
  });
});

describe('내 계정 — 기본 정보: 이메일 바꾸기 (US-37 AC4, D-066 · SITE-09)', () => {
  const openEmailForm = async (user: ReturnType<typeof openAccount>['user']) => {
    const basic = await card('기본 정보');
    expect(basic.getByRole('textbox', { name: '이메일' })).toHaveAttribute('readonly');
    await user.click(basic.getByRole('button', { name: '이메일 바꾸기' }));
    return basic;
  };

  it('[이메일 바꾸기] → 새 이메일 칸 · 설명 · [인증 메일 보내기] · [취소]', async () => {
    signedIn();
    const { user } = openAccount();
    const basic = await openEmailForm(user);
    expect(basic.getByRole('textbox', { name: '새 이메일' })).toHaveAccessibleDescription(
      '새 이메일을 인증하기 전까지 지금 이메일을 써요. 인증을 마치면 모든 기기에서 로그아웃돼요.'
    );
    await user.click(basic.getByRole('button', { name: '취소' }));
    expect(basic.queryByRole('textbox', { name: '새 이메일' })).not.toBeInTheDocument();
  });

  it('이메일 모양이 아니면 보내지 않고 칸 아래 오류', async () => {
    const api = signedIn();
    const { user } = openAccount();
    const basic = await openEmailForm(user);
    await user.type(basic.getByRole('textbox', { name: '새 이메일' }), 'new@example');
    await user.click(basic.getByRole('button', { name: '인증 메일 보내기' }));
    expect(basic.getByRole('textbox', { name: '새 이메일' })).toHaveAccessibleDescription(/이메일 주소를 확인해 주세요\./);
    expect(api.calls('PUT /me/email')).toHaveLength(0);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('재인증 → PUT /me/email {email} 202 → 보낸 안내, 지금 이메일은 그대로 + [다른 이메일로 요청]', async () => {
    const api = signedIn({ 'POST /me/reauth': () => json(204), 'PUT /me/email': () => json(202) });
    const { user } = openAccount();
    const basic = await openEmailForm(user);
    await user.type(basic.getByRole('textbox', { name: '새 이메일' }), 'new@example.com');
    await user.click(basic.getByRole('button', { name: '인증 메일 보내기' }));

    const dialog = await reauthDialog();
    await user.type(dialog.getByLabelText('현재 비밀번호'), 'current-password-1');
    await user.click(dialog.getByRole('button', { name: '확인' }));

    expect(await basic.findByText(/새 이메일로 인증 메일을 보냈어요\. 24시간 안에 메일의 링크를 눌러 주세요\. 기존 이메일에도 변경 요청을 알려 드렸어요\./)).toBeInTheDocument();
    expect(api.calls('POST /me/reauth')[0].body).toEqual({ password: 'current-password-1' });
    expect(api.calls('PUT /me/email')[0].body).toEqual({ email: 'new@example.com' });
    expect(basic.getByRole('textbox', { name: '이메일' })).toHaveValue('qa-fe@example.com');

    await user.click(basic.getByRole('button', { name: '다른 이메일로 요청' }));
    expect(basic.getByRole('textbox', { name: '새 이메일' })).toBeInTheDocument();
    expect(basic.getByText('새로 요청하면 이전 링크는 쓸 수 없어요.')).toBeInTheDocument();
  });

  it('5분 안에 다시 하면 본인 확인을 다시 묻지 않는다, 서버가 403 REAUTH_REQUIRED면 다시 묻고 이어서 보낸다', async () => {
    let first = true;
    const api = signedIn({
      'POST /me/reauth': () => json(204),
      'PUT /me/email': () => {
        if (first) {
          first = false;
          return json(202);
        }
        return api.calls('PUT /me/email').length === 2 ? REAUTH_REQUIRED() : json(202);
      },
    });
    const { user } = openAccount();
    const basic = await openEmailForm(user);
    await user.type(basic.getByRole('textbox', { name: '새 이메일' }), 'new@example.com');
    await user.click(basic.getByRole('button', { name: '인증 메일 보내기' }));
    const dialog = await reauthDialog();
    await user.type(dialog.getByLabelText('현재 비밀번호'), 'current-password-1');
    await user.click(dialog.getByRole('button', { name: '확인' }));
    await user.click(await basic.findByRole('button', { name: '다른 이메일로 요청' }));

    // 두 번째: 기억한 본인 확인으로 바로 보내고, 서버가 403이면 다시 묻는다
    await user.type(basic.getByRole('textbox', { name: '새 이메일' }), 'new2@example.com');
    await user.click(basic.getByRole('button', { name: '인증 메일 보내기' }));
    const again = await reauthDialog();
    expect(api.calls('POST /me/reauth')).toHaveLength(1);
    await user.type(again.getByLabelText('현재 비밀번호'), 'current-password-1');
    await user.click(again.getByRole('button', { name: '확인' }));
    await basic.findByRole('button', { name: '다른 이메일로 요청' });
    expect(api.calls('PUT /me/email').map((c) => c.body)).toEqual([
      { email: 'new@example.com' },
      { email: 'new2@example.com' },
      { email: 'new2@example.com' },
    ]);
  });

  it('409 → 새 이메일 칸 아래 "이미 가입된 이메일이에요"만 (다른 계정의 로그인 수단은 보이지 않음)', async () => {
    signedIn({
      'POST /me/reauth': () => json(204),
      'PUT /me/email': () => ({
        ...problem(409, 'EMAIL_ALREADY_REGISTERED', '이미 가입된 이메일이에요'),
        body: { title: 'Conflict', status: 409, code: 'EMAIL_ALREADY_REGISTERED', detail: '이미 가입된 이메일이에요', errors: [], loginMethods: ['GOOGLE'] },
      }),
    });
    const { user } = openAccount();
    const basic = await openEmailForm(user);
    await user.type(basic.getByRole('textbox', { name: '새 이메일' }), 'taken@example.com');
    await user.click(basic.getByRole('button', { name: '인증 메일 보내기' }));
    const dialog = await reauthDialog();
    await user.type(dialog.getByLabelText('현재 비밀번호'), 'current-password-1');
    await user.click(dialog.getByRole('button', { name: '확인' }));
    await waitFor(() => expect(basic.getByRole('textbox', { name: '새 이메일' })).toHaveAccessibleDescription(/^이미 가입된 이메일이에요/));
    expect(screen.queryByRole('button', { name: '구글로 로그인' })).not.toBeInTheDocument();
  });

  it('본인 확인을 취소하면 보내지 않고 입력은 그대로', async () => {
    const api = signedIn();
    const { user } = openAccount();
    const basic = await openEmailForm(user);
    await user.type(basic.getByRole('textbox', { name: '새 이메일' }), 'new@example.com');
    await user.click(basic.getByRole('button', { name: '인증 메일 보내기' }));
    const dialog = await reauthDialog();
    await user.click(dialog.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.calls('PUT /me/email')).toHaveLength(0);
    expect(basic.getByRole('textbox', { name: '새 이메일' })).toHaveValue('new@example.com');
  });
});

describe('내 계정 — 구글 결과 주소 (SITE-09 · SITE-05a, 08 13-4)', () => {
  it.each([
    ['?reauth=google', '본인 확인이 끝났어요. 진행할 작업을 다시 선택해 주세요.'],
    ['?linked=google', '구글을 연결했어요'],
    ['?error=GOOGLE_ALREADY_LINKED', '이 구글 계정은 다른 계정에 연결돼 있어요'],
    ['?error=GOOGLE_ACCOUNT_MISMATCH', '연결된 구글 계정으로 다시 확인해 주세요'],
  ])('%s → "%s", 읽은 뒤 주소에서 지운다', async (search, text) => {
    signedIn({}, ME_WITH_GOOGLE, [GOOGLE_IDENTITY]);
    openAccount(search);
    expect(await screen.findByText(text)).toBeInTheDocument();
    await waitFor(() => expect(window.location.search).toBe(''));
  });

  it('?error=GOOGLE_FAILED: 본인 확인으로 갔다 왔으면 "구글 본인 확인을…", 연결로 갔다 왔으면 "구글 연결을…" (제가 정한 부분)', async () => {
    signedIn({}, ME_WITH_GOOGLE, [GOOGLE_IDENTITY]);
    sessionStorage.setItem('jp.account.googleFlow', 'reauth');
    const first = openAccount('?error=GOOGLE_FAILED');
    expect(await screen.findByText('구글 본인 확인을 마치지 못했어요. 다시 시도해 주세요.')).toBeInTheDocument();
    expect(sessionStorage.getItem('jp.account.googleFlow')).toBeNull();
    first.unmount();

    signedIn({}, ME);
    sessionStorage.setItem('jp.account.googleFlow', 'connect');
    openAccount('?error=GOOGLE_FAILED');
    expect(await screen.findByText('구글 연결을 마치지 못했어요')).toBeInTheDocument();
  });

  it('구글 본인 확인에서 돌아와도 비밀번호·탈퇴 같은 작업을 저절로 하지 않는다', async () => {
    const api = signedIn({}, ME_WITH_GOOGLE, [GOOGLE_IDENTITY]);
    openAccount('?reauth=google');
    await screen.findByText('본인 확인이 끝났어요. 진행할 작업을 다시 선택해 주세요.');
    expect(api.all().filter((c) => c.method !== 'GET')).toHaveLength(0);
  });
});
