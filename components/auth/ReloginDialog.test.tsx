import { screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { json, mockApi, problem, type MockRequest } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { apiClient } from '@utils/api';
import { goTo } from '@utils/navigation';

import RequireLogin from './RequireLogin';

vi.mock('@utils/navigation', () => ({ goTo: vi.fn(), currentPath: () => window.location.pathname + window.location.search }));

const ME = { email: 'qa@example.com', name: '검수', hasPassword: true, loginMethods: ['EMAIL'] };
const OTHER = { ...ME, email: 'other@example.com', name: '남' };
const EXPIRED = () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요');

/** 쓰던 창 흉내: 입력 + [저장](POST /todos) + 결과 한 줄 */
function Writer({ path = '/todos' }: { path?: string }) {
  const [result, setResult] = useState('');
  const save = async () => {
    try {
      await apiClient.post(path, { title: '쓰던 내용' });
      setResult(`${path} 저장됨`);
    } catch {
      setResult(`${path} 저장 실패`);
    }
  };
  return (
    <div>
      <label>
        쓰던 내용
        <input defaultValue="" />
      </label>
      <button type="button" onClick={save}>
        {`${path} 저장`}
      </button>
      <p>{result}</p>
    </div>
  );
}

/** 세션이 끝난 서버: 다시 로그인하기 전까지 데이터 요청은 401 */
const expiredServer = (loginAs: typeof ME = ME, extra: Record<string, (req: MockRequest) => ReturnType<typeof json>> = {}) => {
  let signedIn = false;
  const data = (body: unknown) => () => (signedIn ? json(201, body) : EXPIRED());
  return mockApi({
    'GET /auth/csrf': () => json(204),
    'GET /me': () => json(200, ME),
    'POST /auth/login': () => {
      signedIn = true;
      return json(200, loginAs);
    },
    'POST /todos': data({ id: 1 }),
    'POST /schedules': data({ id: 2 }),
    'GET /todos': () => (signedIn ? json(200, []) : EXPIRED()),
    ...extra,
  });
};

const openWriter = async (children = <Writer />) => {
  window.history.replaceState(null, '', '/?view=day');
  const view = renderWithStore(<RequireLogin>{children}</RequireLogin>);
  const [first] = await screen.findAllByRole('textbox', { name: '쓰던 내용' });
  await view.user.type(first, '오늘 할 일');
  return view;
};

const reloginDialog = () => screen.findByRole('dialog', { name: '다시 로그인해 주세요' });

const typePassword = async (user: Awaited<ReturnType<typeof openWriter>>['user'], dialog: HTMLElement) => {
  await user.type(within(dialog).getByLabelText('비밀번호'), 'password-1234567');
  await user.click(within(dialog).getByRole('button', { name: '로그인' }));
};

beforeEach(() => vi.mocked(goTo).mockClear());
afterEach(() => window.history.replaceState(null, '', '/'));

describe('작성 중 로그인 만료 — 내용 지키기 (US-34, D-072)', () => {
  it('저장이 401이면 쓰던 창은 그대로, 그 위에 로그인 창 (이메일은 지금 계정으로 채움)', async () => {
    expiredServer();
    const { user } = await openWriter();
    await user.click(screen.getByRole('button', { name: '/todos 저장' }));

    const dialog = await reloginDialog();
    expect(dialog).toHaveTextContent('로그인이 끝났어요. 다시 로그인하면 쓰던 내용을 이어서 저장해요.');
    expect(within(dialog).getByLabelText('이메일')).toHaveValue('qa@example.com');
    expect(screen.getByRole('textbox', { name: '쓰던 내용' })).toHaveValue('오늘 할 일');
    expect(goTo).not.toHaveBeenCalled();
  });

  it('같은 계정으로 다시 로그인하면 새 CSRF를 받고 같은 저장을 이어서 한다', async () => {
    const api = expiredServer();
    const { user } = await openWriter();
    await user.click(screen.getByRole('button', { name: '/todos 저장' }));
    await typePassword(user, await reloginDialog());

    expect(await screen.findByText('/todos 저장됨')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: '다시 로그인해 주세요' })).not.toBeInTheDocument();
    const afterFirst = api.all().map((r) => r.key).slice(api.all().findIndex((r) => r.key === 'POST /todos') + 1);
    expect(afterFirst).toEqual(['POST /auth/login', 'GET /auth/csrf', 'POST /todos']);
    expect(api.calls('POST /auth/login')[0].body).toEqual({ email: 'qa@example.com', password: 'password-1234567' });
    expect(api.calls('POST /todos')[1].body).toEqual({ title: '쓰던 내용' });
    expect(screen.getByRole('textbox', { name: '쓰던 내용' })).toHaveValue('오늘 할 일');
    expect(goTo).not.toHaveBeenCalled();
  });

  it('이메일 대소문자만 달라도 같은 계정이다', async () => {
    expiredServer({ ...ME, email: 'QA@Example.com' });
    const { user } = await openWriter();
    await user.click(screen.getByRole('button', { name: '/todos 저장' }));
    await typePassword(user, await reloginDialog());
    expect(await screen.findByText('/todos 저장됨')).toBeInTheDocument();
  });

  it('다른 계정으로 로그인하면 이어서 저장하지 않고 화면을 새로 연다 (남의 계정에 저장 방지)', async () => {
    const api = expiredServer(OTHER);
    const { user } = await openWriter();
    await user.click(screen.getByRole('button', { name: '/todos 저장' }));
    const dialog = await reloginDialog();
    await user.clear(within(dialog).getByLabelText('이메일'));
    await user.type(within(dialog).getByLabelText('이메일'), 'other@example.com');
    await typePassword(user, dialog);

    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/?view=day'));
    expect(api.calls('POST /todos')).toHaveLength(1);
  });

  it('로그인 창에서 틀리면 BE 문구 한 줄, 창은 그대로', async () => {
    expiredServer(ME, { 'POST /auth/login': () => problem(401, 'UNAUTHENTICATED', '이메일 또는 비밀번호가 맞지 않아요') });
    const { user } = await openWriter();
    await user.click(screen.getByRole('button', { name: '/todos 저장' }));
    const dialog = await reloginDialog();
    await typePassword(user, dialog);
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('이메일 또는 비밀번호가 맞지 않아요');
    expect(screen.getByRole('dialog', { name: '다시 로그인해 주세요' })).toBeInTheDocument();
  });

  it('[취소]하면 로그인 창만 닫히고 저장은 실패, 쓰던 내용은 그대로 (제가 정한 부분)', async () => {
    const api = expiredServer();
    const { user } = await openWriter();
    await user.click(screen.getByRole('button', { name: '/todos 저장' }));
    await user.click(within(await reloginDialog()).getByRole('button', { name: '취소' }));

    expect(await screen.findByText('/todos 저장 실패')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: '다시 로그인해 주세요' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '쓰던 내용' })).toHaveValue('오늘 할 일');
    expect(api.calls('POST /todos')).toHaveLength(1);
    expect(goTo).not.toHaveBeenCalled();
  });

  it('Esc는 [취소]와 같고, 아래 쓰던 창에는 전해지지 않는다 (작성 취소 확인이 뜨지 않게)', async () => {
    expiredServer();
    const below = vi.fn();
    document.addEventListener('keydown', below);
    try {
      const { user } = await openWriter();
      await user.click(screen.getByRole('button', { name: '/todos 저장' }));
      await reloginDialog();
      await user.keyboard('{Escape}');
      expect(await screen.findByText('/todos 저장 실패')).toBeInTheDocument();
      expect(below).not.toHaveBeenCalledWith(expect.objectContaining({ key: 'Escape' }));
    } finally {
      document.removeEventListener('keydown', below);
    }
  });

  it('저장 두 개가 함께 401이어도 로그인 창은 하나, 로그인하면 둘 다 이어서', async () => {
    expiredServer();
    const { user } = await openWriter(
      <>
        <Writer />
        <Writer path="/schedules" />
      </>
    );
    await user.click(screen.getByRole('button', { name: '/todos 저장' }));
    await user.click(screen.getByRole('button', { name: '/schedules 저장' }));
    await reloginDialog();
    expect(screen.getAllByRole('dialog', { name: '다시 로그인해 주세요' })).toHaveLength(1);
    await typePassword(user, await reloginDialog());
    expect(await screen.findByText('/todos 저장됨')).toBeInTheDocument();
    expect(await screen.findByText('/schedules 저장됨')).toBeInTheDocument();
  });

  it('로그인 창이 떠 있는 동안 보기 요청이 401이어도 /login으로 보내지 않고, 로그인 뒤 다시 받는다 (제가 정한 부분)', async () => {
    const api = expiredServer();
    const { user } = await openWriter();
    await user.click(screen.getByRole('button', { name: '/todos 저장' }));
    const dialog = await reloginDialog();

    const refresh = apiClient.get('/todos');
    await waitFor(() => expect(api.calls('GET /todos')).toHaveLength(1));
    expect(goTo).not.toHaveBeenCalled();
    await typePassword(user, dialog);
    await expect(refresh).resolves.toEqual([]);
    expect(goTo).not.toHaveBeenCalled();
  });

  it('보기만 하던 중(로그인 창 없음) 401이면 /login?next=<지금 화면>', async () => {
    expiredServer();
    await openWriter();
    await expect(apiClient.get('/todos')).rejects.toMatchObject({ status: 401 });
    expect(goTo).toHaveBeenCalledWith('/login?next=%2F%3Fview%3Dday');
    expect(screen.queryByRole('dialog', { name: '다시 로그인해 주세요' })).not.toBeInTheDocument();
  });
});
