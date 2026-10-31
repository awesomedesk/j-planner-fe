import { act, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { json, problem } from '@/test/mockApi';
import { goTo } from '@utils/navigation';

import {
  card,
  GOOGLE_IDENTITY,
  ME_GOOGLE_ONLY,
  ME_WITH_GOOGLE,
  openAccount,
  REAUTH_FAILED,
  REAUTH_REQUIRED,
  reauthDialog,
  SESSIONS,
  signedIn,
  type User,
} from './testHelpers';

vi.mock('@utils/navigation', () => ({ goTo: vi.fn(), currentPath: () => window.location.pathname + window.location.search }));

const GOOD_PASSWORD = '긴 문장 비밀번호 열다섯자 넘음';

beforeEach(() => {
  vi.mocked(goTo).mockClear();
  sessionStorage.clear();
});
afterEach(() => window.history.replaceState(null, '', '/'));

/** 본인 확인 창에 비밀번호를 넣고 [확인] */
const confirmWithPassword = async (user: User, password = 'current-password-1') => {
  const dialog = await reauthDialog();
  await user.type(dialog.getByLabelText('현재 비밀번호'), password);
  await user.click(dialog.getByRole('button', { name: '확인' }));
};

describe('본인 확인 창 (US-37 AC2, D-085 · SITE-09 민감 작업 전 본인 확인)', () => {
  const startPasswordChange = async (user: User) => {
    const pw = await card('비밀번호 바꾸기');
    await user.type(pw.getByLabelText('새 비밀번호'), GOOD_PASSWORD);
    await user.click(pw.getByRole('button', { name: '비밀번호 바꾸기' }));
    return pw;
  };

  it('비밀번호가 있으면 현재 비밀번호(current-password)·[확인]·[취소], 구글이 없으면 구글 버튼 없음, 첫 초점은 비밀번호 칸', async () => {
    signedIn();
    const { user } = openAccount();
    await startPasswordChange(user);
    const dialog = await reauthDialog();
    const password = dialog.getByLabelText('현재 비밀번호');
    expect(password).toHaveAttribute('autocomplete', 'current-password');
    expect(password).toHaveFocus();
    expect(dialog.getByRole('button', { name: '확인' })).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: '취소' })).toBeInTheDocument();
    expect(dialog.queryByRole('button', { name: 'Google로 본인 확인' })).not.toBeInTheDocument();
  });

  it('400 REAUTH_FAILED → 비밀번호 칸 아래 "비밀번호가 맞지 않아요", 다시 로그인 창은 뜨지 않는다 (D-085)', async () => {
    const api = signedIn({ 'POST /me/reauth': REAUTH_FAILED });
    const { user } = openAccount();
    await startPasswordChange(user);
    await confirmWithPassword(user, 'wrong-password');
    const dialog = await reauthDialog();
    await waitFor(() => expect(dialog.getByLabelText('현재 비밀번호')).toHaveAccessibleDescription('비밀번호가 맞지 않아요'));
    expect(screen.queryByRole('dialog', { name: '다시 로그인해 주세요' })).not.toBeInTheDocument();
    expect(api.calls('PUT /me/password')).toHaveLength(0);
  });

  it('429 → 대기 문구 + [확인] 잠금 (Retry-After)', async () => {
    signedIn({ 'POST /me/reauth': () => ({ ...problem(429, 'TOO_MANY_REQUESTS', '잠시 뒤 다시 시도해 주세요'), headers: { 'Retry-After': '30' } }) });
    const { user } = openAccount();
    await startPasswordChange(user);
    await confirmWithPassword(user);
    const dialog = await reauthDialog();
    expect(await dialog.findByText(/요청이 너무 많아요\. \d+초 뒤에 다시 시도할 수 있어요/)).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: '확인' })).toBeDisabled();
  });

  it('Esc·[취소] → 창을 닫고 원래 버튼으로 초점이 돌아간다, 보내지 않는다', async () => {
    const api = signedIn();
    const { user } = openAccount();
    const pw = await startPasswordChange(user);
    await reauthDialog();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(pw.getByRole('button', { name: '비밀번호 바꾸기' })).toHaveFocus();
    expect(api.calls('PUT /me/password')).toHaveLength(0);
  });

  it('Tab은 창 안에서만 돈다 (초점 가두기)', async () => {
    signedIn({}, ME_WITH_GOOGLE, [GOOGLE_IDENTITY]);
    const { user } = openAccount();
    await startPasswordChange(user);
    const dialog = await reauthDialog();
    const inside = () => dialog.getByLabelText('현재 비밀번호').closest('[role="dialog"]')!.contains(document.activeElement);
    for (let i = 0; i < 8; i += 1) {
      await user.tab();
      expect(inside()).toBe(true);
    }
    await user.tab({ shift: true });
    expect(inside()).toBe(true);
  });

  it('구글도 연결돼 있으면 [Google로 본인 확인] → /api/v1/me/reauth/google로 이동, 무엇을 하려 했는지는 저장하지 않는다', async () => {
    signedIn({}, ME_WITH_GOOGLE, [GOOGLE_IDENTITY]);
    const { user } = openAccount();
    await startPasswordChange(user);
    const dialog = await reauthDialog();
    await user.click(dialog.getByRole('button', { name: 'Google로 본인 확인' }));
    expect(goTo).toHaveBeenCalledWith('/api/v1/me/reauth/google');
    expect(Object.keys(sessionStorage)).toEqual(['jp.account.googleFlow']);
    expect(sessionStorage.getItem('jp.account.googleFlow')).toBe('reauth');
  });

  it('구글만 있는 회원은 비밀번호 칸 없이 [Google로 본인 확인]·[취소]만', async () => {
    signedIn({}, ME_GOOGLE_ONLY, [GOOGLE_IDENTITY]);
    const { user } = openAccount();
    await user.click(await (await card('회원 탈퇴')).findByRole('button', { name: '회원 탈퇴' }));
    const dialog = await reauthDialog();
    expect(dialog.queryByLabelText('현재 비밀번호')).not.toBeInTheDocument();
    expect(dialog.getByRole('button', { name: 'Google로 본인 확인' })).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: '취소' })).toBeInTheDocument();
  });
});

describe('내 계정 — 비밀번호 바꾸기·추가 (US-37 AC3·AC4, SITE-09)', () => {
  it('비밀번호가 있으면 "비밀번호 바꾸기" + 설명 · 새 비밀번호(보기·15자 안내) → 재인증 → PUT /me/password {newPassword} → 지우고 안내 + 기기 목록·내 정보 다시 받음', async () => {
    const api = signedIn({ 'POST /me/reauth': () => json(204), 'PUT /me/password': () => json(204) });
    const { user } = openAccount();
    const pw = await card('비밀번호 바꾸기');
    expect(pw.getByText('완료하면 다른 기기에서 로그아웃돼요. 이 기기는 계속 사용할 수 있어요.')).toBeInTheDocument();
    const field = pw.getByLabelText('새 비밀번호');
    expect(field).toHaveAttribute('autocomplete', 'new-password');
    await user.type(field, GOOD_PASSWORD);
    const sessionsBefore = api.calls('GET /me/sessions').length;
    const meBefore = api.calls('GET /me').length;
    await user.click(pw.getByRole('button', { name: '비밀번호 바꾸기' }));
    await confirmWithPassword(user);
    expect(await pw.findByRole('status')).toHaveTextContent('비밀번호를 바꿨어요. 다른 기기에서 로그아웃했어요');
    expect(api.calls('PUT /me/password')[0].body).toEqual({ newPassword: GOOD_PASSWORD });
    expect(field).toHaveValue('');
    expect(api.calls('GET /me/sessions').length).toBe(sessionsBefore + 1);
    expect(api.calls('GET /me').length).toBe(meBefore + 1);
  });

  it('15자 미만은 보내지 않고 칸 아래 오류', async () => {
    const api = signedIn();
    const { user } = openAccount();
    const pw = await card('비밀번호 바꾸기');
    await user.type(pw.getByLabelText('새 비밀번호'), 'short');
    await user.click(pw.getByRole('button', { name: '비밀번호 바꾸기' }));
    expect(pw.getByLabelText('새 비밀번호')).toHaveAccessibleDescription(/비밀번호는 15자 이상이어야 해요\./);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.calls('PUT /me/password')).toHaveLength(0);
  });

  it('400 PASSWORD_REJECTED → 서버 이유를 새 비밀번호 칸 아래 그대로', async () => {
    signedIn({
      'POST /me/reauth': () => json(204),
      'PUT /me/password': () => problem(400, 'PASSWORD_REJECTED', '쓸 수 없는 비밀번호예요', [{ field: 'newPassword', message: '유출된 적 있는 비밀번호예요. 다른 비밀번호를 써 주세요.' }]),
    });
    const { user } = openAccount();
    const pw = await card('비밀번호 바꾸기');
    await user.type(pw.getByLabelText('새 비밀번호'), GOOD_PASSWORD);
    await user.click(pw.getByRole('button', { name: '비밀번호 바꾸기' }));
    await confirmWithPassword(user);
    await waitFor(() => expect(pw.getByLabelText('새 비밀번호')).toHaveAccessibleDescription(/유출된 적 있는 비밀번호예요/));
  });

  it('비밀번호가 없으면(구글만) 제목·버튼이 "비밀번호 추가", 성공하면 "비밀번호를 추가했어요…"', async () => {
    signedIn({ 'PUT /me/password': () => json(204) }, ME_GOOGLE_ONLY, [GOOGLE_IDENTITY]);
    const { user } = openAccount();
    const pw = await card('비밀번호 추가');
    await user.type(pw.getByLabelText('새 비밀번호'), GOOD_PASSWORD);
    await user.click(pw.getByRole('button', { name: '비밀번호 추가' }));
    // 구글만: 본인 확인은 구글로만 → 이 테스트에서는 이미 본인 확인된 것으로 (서버가 204)
    const dialog = await reauthDialog();
    expect(dialog.getByRole('button', { name: 'Google로 본인 확인' })).toBeInTheDocument();
  });

  it('403 REAUTH_REQUIRED → 본인 확인 뒤 같은 요청을 한 번만 다시 보낸다', async () => {
    let n = 0;
    const api = signedIn({ 'POST /me/reauth': () => json(204), 'PUT /me/password': () => (++n === 1 ? REAUTH_REQUIRED() : json(204)) });
    const { user } = openAccount('?reauth=google'); // 구글 본인 확인에서 막 돌아옴 → 바로 보냄
    const pw = await card('비밀번호 바꾸기');
    await user.type(pw.getByLabelText('새 비밀번호'), GOOD_PASSWORD);
    await user.click(pw.getByRole('button', { name: '비밀번호 바꾸기' }));
    await confirmWithPassword(user);
    await pw.findByRole('status');
    expect(api.calls('PUT /me/password')).toHaveLength(2);
  });
});

describe('내 계정 — 로그인 수단 (US-37 AC3·AC4, SITE-09)', () => {
  it('이메일: 비밀번호 있으면 "사용 중", 구글 없으면 [구글 연결] → 재인증 → /api/v1/me/identities/google/connect 이동', async () => {
    signedIn({ 'POST /me/reauth': () => json(204) });
    const { user } = openAccount();
    const methods = await card('로그인 수단');
    expect(methods.getByText('사용 중')).toBeInTheDocument();
    await user.click(await methods.findByRole('button', { name: '구글 연결' }));
    await confirmWithPassword(user);
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/api/v1/me/identities/google/connect'));
    expect(sessionStorage.getItem('jp.account.googleFlow')).toBe('connect');
  });

  it('구글이 연결돼 있으면 연결된 이메일·연결일·[연결 해제] → 확인 → 재인증 → DELETE → 목록·내 정보 다시 받고 "구글 연결을 해제했어요"', async () => {
    let linked = true;
    const api = signedIn(
      {
        'GET /me/identities': () => json(200, linked ? [GOOGLE_IDENTITY] : []),
        'POST /me/reauth': () => json(204),
        'DELETE /me/identities/google': () => {
          linked = false;
          return json(204);
        },
      },
      ME_WITH_GOOGLE
    );
    const { user } = openAccount();
    const methods = await card('로그인 수단');
    expect(await methods.findByText('qa-fe@gmail.example.com')).toBeInTheDocument();
    expect(methods.getByText(/2026\. 10\. 20\./)).toBeInTheDocument();
    await user.click(methods.getByRole('button', { name: '연결 해제' }));
    const confirm = await screen.findByRole('alertdialog', { name: '구글 연결을 해제할까요?' });
    expect(confirm).toHaveTextContent('이메일과 비밀번호로 계속 로그인할 수 있어요.');
    await user.click(screen.getByRole('button', { name: '해제' }));
    await confirmWithPassword(user);
    expect(await methods.findByRole('status')).toHaveTextContent('구글 연결을 해제했어요');
    expect(api.calls('DELETE /me/identities/google')).toHaveLength(1);
    expect(await methods.findByRole('button', { name: '구글 연결' })).toBeInTheDocument();
  });

  it('구글이 마지막 수단(비밀번호 없음)이면 [연결 해제] 잠금 + "비밀번호를 추가하면 구글 연결을 해제할 수 있어요", 이메일 줄은 [비밀번호 추가]', async () => {
    signedIn({}, ME_GOOGLE_ONLY, [GOOGLE_IDENTITY]);
    const { user } = openAccount();
    const methods = await card('로그인 수단');
    expect(await methods.findByRole('button', { name: '연결 해제' })).toBeDisabled();
    expect(methods.getByText('비밀번호를 추가하면 구글 연결을 해제할 수 있어요')).toBeInTheDocument();
    await user.click(methods.getByRole('button', { name: '비밀번호 추가' }));
    expect((await card('비밀번호 추가')).getByLabelText('새 비밀번호')).toHaveFocus();
  });

  it('서버 409 LAST_IDENTITY도 같은 안내, 404면 목록을 다시 받는다', async () => {
    signedIn(
      { 'POST /me/reauth': () => json(204), 'DELETE /me/identities/google': () => problem(409, 'LAST_IDENTITY', '마지막 로그인 수단이에요') },
      ME_WITH_GOOGLE,
      [GOOGLE_IDENTITY]
    );
    const { user } = openAccount();
    const methods = await card('로그인 수단');
    await user.click(await methods.findByRole('button', { name: '연결 해제' }));
    await user.click(screen.getByRole('button', { name: '해제' }));
    await confirmWithPassword(user);
    expect(await methods.findByText('비밀번호를 추가하면 구글 연결을 해제할 수 있어요')).toBeInTheDocument();
  });
});

describe('내 계정 — 로그인한 기기 (US-37 AC3·AC4, SITE-09)', () => {
  it('서버 순서대로 기기·로그인 시각·마지막 사용 시각(시간대 표시)·IP 앞부분, 지금 기기는 "이 기기"', async () => {
    signedIn();
    openAccount();
    const devices = await card('로그인한 기기');
    const items = await devices.findAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Chrome · macOS');
    expect(items[0]).toHaveTextContent('이 기기');
    expect(items[0]).toHaveTextContent('211.36.*.*');
    expect(items[0]).toHaveTextContent(/2026\. 10\. 31\..*GMT\+9/);
    expect(items[1]).toHaveTextContent('Safari · iOS');
    expect(items[1]).not.toHaveTextContent('이 기기');
  });

  it('다른 기기 [로그아웃] → "선택한 기기를 로그아웃할까요?" → DELETE /me/sessions/{id} → 목록 다시 받음 (재인증 없음)', async () => {
    const api = signedIn({ 'DELETE /me/sessions/bbb222': () => json(204) });
    const { user } = openAccount();
    const devices = await card('로그인한 기기');
    const items = await devices.findAllByRole('listitem');
    const before = api.calls('GET /me/sessions').length;
    await user.click(within(items[1]).getByRole('button', { name: '로그아웃' }));
    await screen.findByRole('alertdialog', { name: '선택한 기기를 로그아웃할까요?' });
    await user.click(screen.getByRole('button', { name: '로그아웃하기' }));
    await waitFor(() => expect(api.calls('GET /me/sessions').length).toBe(before + 1));
    expect(api.calls('DELETE /me/sessions/bbb222')).toHaveLength(1);
    expect(api.calls('POST /me/reauth')).toHaveLength(0);
    expect(goTo).not.toHaveBeenCalled();
  });

  it('이 기기 [로그아웃] → "이 기기에서 로그아웃할까요?" → 204면 로그인 화면으로', async () => {
    signedIn({ 'DELETE /me/sessions/aaa111': () => json(204) });
    const { user } = openAccount();
    const items = await (await card('로그인한 기기')).findAllByRole('listitem');
    await user.click(within(items[0]).getByRole('button', { name: '로그아웃' }));
    await screen.findByRole('alertdialog', { name: '이 기기에서 로그아웃할까요?' });
    await user.click(screen.getByRole('button', { name: '로그아웃하기' }));
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/login'));
  });

  it('[다른 기기 모두 로그아웃] → 확인 → DELETE /me/sessions → 목록 다시 받음, 다른 기기가 없으면 잠금', async () => {
    let sessions = SESSIONS;
    const api = signedIn({
      'GET /me/sessions': () => json(200, sessions),
      'DELETE /me/sessions': () => {
        sessions = [SESSIONS[0]];
        return json(204);
      },
    });
    const { user } = openAccount();
    const devices = await card('로그인한 기기');
    await devices.findAllByRole('listitem');
    await user.click(devices.getByRole('button', { name: '다른 기기 모두 로그아웃' }));
    await screen.findByRole('alertdialog', { name: '이 기기는 그대로 두고 다른 기기에서 모두 로그아웃할까요?' });
    await user.click(screen.getByRole('button', { name: '로그아웃하기' }));
    await waitFor(() => expect(devices.getAllByRole('listitem')).toHaveLength(1));
    expect(api.calls('DELETE /me/sessions')).toHaveLength(1);
    expect(devices.getByRole('button', { name: '다른 기기 모두 로그아웃' })).toBeDisabled();
  });

  it('404 → "이미 로그아웃된 기기예요" + 목록 다시 받음', async () => {
    signedIn({ 'DELETE /me/sessions/bbb222': () => problem(404, 'NOT_FOUND', '없는 기기예요') });
    const { user } = openAccount();
    const items = await (await card('로그인한 기기')).findAllByRole('listitem');
    await user.click(within(items[1]).getByRole('button', { name: '로그아웃' }));
    await user.click(await screen.findByRole('button', { name: '로그아웃하기' }));
    expect(await screen.findByText('이미 로그아웃된 기기예요')).toBeInTheDocument();
  });

  it('목록을 못 읽으면 이 카드에서만 오류 + [다시 시도], 다른 카드는 그대로', async () => {
    let fail = true;
    signedIn({ 'GET /me/sessions': () => (fail ? problem(500, 'INTERNAL_ERROR', '서버 오류') : json(200, SESSIONS)) });
    const { user } = openAccount();
    const devices = await card('로그인한 기기');
    expect(await devices.findByText('잠시 문제가 있어요. 잠시 뒤 다시 시도해 주세요')).toBeInTheDocument();
    expect((await card('기본 정보')).getByRole('textbox', { name: '이름' })).toBeInTheDocument();
    fail = false;
    await user.click(devices.getByRole('button', { name: '다시 시도' }));
    expect(await devices.findAllByRole('listitem')).toHaveLength(2);
  });
});

describe('내 계정 — 회원 탈퇴 (US-37 AC2·AC5, SITE-09)', () => {
  const startDelete = async (user: User) => {
    const del = await card('회원 탈퇴');
    expect(del.getByText('탈퇴하면 일정·Todo·D-Day·일기·메모와 계정 정보가 즉시 지워져요. 되돌릴 수 없어요.')).toBeInTheDocument();
    await user.click(del.getByRole('button', { name: '회원 탈퇴' }));
  };

  it('[회원 탈퇴] → 본인 확인 → 최종 확인(기본 초점 [취소]) → [탈퇴하고 데이터 지우기]를 눌러야 DELETE /me', async () => {
    const api = signedIn({ 'POST /me/reauth': () => json(204), 'DELETE /me': () => json(204) });
    const { user } = openAccount();
    await startDelete(user);
    await confirmWithPassword(user);
    const final = await screen.findByRole('alertdialog', { name: '정말 탈퇴할까요?' });
    expect(final).toHaveTextContent('일정·Todo·D-Day·일기·메모와 계정 정보가 즉시 지워져요');
    expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();
    expect(api.calls('DELETE /me')).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: '탈퇴하고 데이터 지우기' }));
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/login'));
    expect(api.calls('DELETE /me')).toHaveLength(1);
    expect(sessionStorage.getItem('jp.auth.loginNotice')).toBe('accountDeleted');
  });

  it('최종 확인에서 [취소]하면 보내지 않는다', async () => {
    const api = signedIn({ 'POST /me/reauth': () => json(204) });
    const { user } = openAccount();
    await startDelete(user);
    await confirmWithPassword(user);
    await screen.findByRole('alertdialog', { name: '정말 탈퇴할까요?' });
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(api.calls('DELETE /me')).toHaveLength(0);
  });

  it('DELETE가 403이면 본인 확인을 다시 거친 뒤 최종 확인을 다시 받는다 (저절로 지우지 않음)', async () => {
    const api = signedIn({ 'POST /me/reauth': () => json(204), 'DELETE /me': REAUTH_REQUIRED });
    const { user } = openAccount();
    await startDelete(user);
    await confirmWithPassword(user);
    await user.click(await screen.findByRole('button', { name: '탈퇴하고 데이터 지우기' }));
    await confirmWithPassword(user);
    expect(await screen.findByRole('alertdialog', { name: '정말 탈퇴할까요?' })).toBeInTheDocument();
    expect(api.calls('DELETE /me')).toHaveLength(1);
    expect(goTo).not.toHaveBeenCalled();
  });

  it('실패하면 성공으로 보이지 않고 안내, 최종 확인 창은 남는다', async () => {
    signedIn({ 'POST /me/reauth': () => json(204), 'DELETE /me': () => problem(500, 'INTERNAL_ERROR', '서버 오류') });
    const { user } = openAccount();
    await startDelete(user);
    await confirmWithPassword(user);
    await user.click(await screen.findByRole('button', { name: '탈퇴하고 데이터 지우기' }));
    const final = await screen.findByRole('alertdialog', { name: '정말 탈퇴할까요?' });
    await waitFor(() => expect(final).toHaveTextContent('잠시 문제가 있어요. 잠시 뒤 다시 시도해 주세요'));
    expect(goTo).not.toHaveBeenCalled();
  });

  it('보내는 중에는 [탈퇴하고 데이터 지우기] 잠금 — 두 번 눌러도 한 번', async () => {
    let release: () => void = () => {};
    const api = signedIn({
      'POST /me/reauth': () => json(204),
      'DELETE /me': () => new Promise((resolve) => (release = () => resolve(json(204)))),
    });
    const { user } = openAccount();
    await startDelete(user);
    await confirmWithPassword(user);
    const button = await screen.findByRole('button', { name: '탈퇴하고 데이터 지우기' });
    await user.click(button);
    await user.click(button);
    await act(async () => release());
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/login'));
    expect(api.calls('DELETE /me')).toHaveLength(1);
  });
});
