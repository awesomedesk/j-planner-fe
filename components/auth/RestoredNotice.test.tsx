import { screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NoticeCenter from '@components/notice/NoticeCenter';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { apiClient } from '@utils/api';
import { GOOGLE_DONE_MESSAGE } from '@utils/auth/googleLogin';
import { goTo } from '@utils/navigation';

import RequireLogin from './RequireLogin';

vi.mock('@utils/navigation', () => ({ goTo: vi.fn(), currentPath: () => window.location.pathname + window.location.search }));

const RESTORED = '휴면에서 돌아왔어요';
const ME = { email: 'qa-fe@example.com', name: '검수', hasPassword: true, loginMethods: ['EMAIL', 'GOOGLE'] };
const OTHER = { ...ME, email: 'other@example.com' };
const EXPIRED = () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요');

const openApp = (path: string) => {
  window.history.replaceState(null, '', path);
  return renderWithStore(
    <>
      <RequireLogin>
        <Writer />
      </RequireLogin>
      <NoticeCenter />
    </>
  );
};

function Writer() {
  const [result, setResult] = useState('');
  const save = async () => {
    try {
      await apiClient.post('/todos', { title: '쓰던 내용' });
      setResult('저장됨');
    } catch {
      setResult('저장 실패');
    }
  };
  return (
    <div>
      <button type="button" onClick={save}>
        저장
      </button>
      <p>{result}</p>
    </div>
  );
}

beforeEach(() => vi.mocked(goTo).mockClear());
afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

describe('휴면 복원 안내 — 로그인 뒤 화면 (US-38, 06 휴면 복원 안내 · 08 restored)', () => {
  it('?restored=1로 오면 "휴면에서 돌아왔어요"를 한 번 안내하고 restored만 지운다 (다른 쿼리는 그대로)', async () => {
    mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': () => json(200, ME) });
    openApp('/?view=day&restored=1');
    expect(await screen.findByText(RESTORED)).toBeInTheDocument();
    await waitFor(() => expect(window.location.search).toBe('?view=day'));
  });

  it('restored가 1이 아니면 안내하지 않고 주소에서만 지운다', async () => {
    mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': () => json(200, ME) });
    openApp('/?restored=yes');
    await screen.findByRole('button', { name: '저장' });
    await waitFor(() => expect(window.location.search).toBe(''));
    expect(screen.queryByText(RESTORED)).not.toBeInTheDocument();
  });

  it('restored가 없으면 아무 일 없음', async () => {
    mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': () => json(200, ME) });
    openApp('/?view=day');
    await screen.findByRole('button', { name: '저장' });
    expect(window.location.search).toBe('?view=day');
    expect(screen.queryByText(RESTORED)).not.toBeInTheDocument();
  });
});

describe('휴면 복원 안내 — 다시 로그인 창 (US-38, D-072 같은 계정 확인 뒤)', () => {
  /** 세션이 끝난 서버. 다시 로그인하면(login) 그 계정으로 */
  const expiredServer = (after: typeof ME, loginResult: object) => {
    let signedIn = false;
    let first = true;
    const api = mockApi({
      'GET /auth/csrf': () => json(204),
      'GET /me': () => {
        if (first) {
          first = false;
          return json(200, ME);
        }
        return signedIn ? json(200, after) : EXPIRED();
      },
      'POST /auth/login': () => {
        signedIn = true;
        return json(200, loginResult);
      },
      'POST /todos': () => (signedIn ? json(201, { id: 1 }) : EXPIRED()),
    });
    return { api, googleDone: () => (signedIn = true) };
  };

  const openAndExpire = async () => {
    const view = openApp('/?view=day');
    await view.user.click(await screen.findByRole('button', { name: '저장' }));
    const dialog = await screen.findByRole('dialog', { name: '다시 로그인해 주세요' });
    return { ...view, dialog: within(dialog) };
  };

  it('이메일로 다시 로그인했는데 restored: true → 같은 계정이면 저장을 이어 하고 안내', async () => {
    expiredServer(ME, { ...ME, restored: true });
    const { user, dialog } = await openAndExpire();
    await user.type(dialog.getByLabelText('비밀번호'), 'pw-123456789012');
    await user.click(dialog.getByRole('button', { name: '로그인' }));
    expect(await screen.findByText('저장됨')).toBeInTheDocument();
    expect(screen.getByText(RESTORED)).toBeInTheDocument();
  });

  it('restored: false면 안내 없음', async () => {
    expiredServer(ME, { ...ME, restored: false });
    const { user, dialog } = await openAndExpire();
    await user.type(dialog.getByLabelText('비밀번호'), 'pw-123456789012');
    await user.click(dialog.getByRole('button', { name: '로그인' }));
    expect(await screen.findByText('저장됨')).toBeInTheDocument();
    expect(screen.queryByText(RESTORED)).not.toBeInTheDocument();
  });

  it('다른 계정이면 안내 없이 화면을 새로 연다 (남의 계정에 저장 안 함)', async () => {
    expiredServer(OTHER, { ...OTHER, restored: true });
    const { user, dialog } = await openAndExpire();
    await user.clear(dialog.getByLabelText('이메일'));
    await user.type(dialog.getByLabelText('이메일'), 'other@example.com');
    await user.type(dialog.getByLabelText('비밀번호'), 'pw-123456789012');
    await user.click(dialog.getByRole('button', { name: '로그인' }));
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/?view=day'));
    expect(screen.queryByText(RESTORED)).not.toBeInTheDocument();
  });

  it('구글 팝업이 restored를 알리면 같은 계정 확인 뒤 저장을 이어 하고 안내', async () => {
    const { googleDone } = expiredServer(ME, { ...ME, restored: false });
    const popup = { closed: false, close: vi.fn() } as unknown as Window;
    vi.spyOn(window, 'open').mockReturnValue(popup);
    const { user, dialog } = await openAndExpire();
    await user.click(dialog.getByRole('button', { name: 'Google로 계속하기' }));
    googleDone();
    window.dispatchEvent(
      new MessageEvent('message', { data: { type: GOOGLE_DONE_MESSAGE, error: null, restored: true }, origin: window.location.origin, source: popup })
    );
    expect(await screen.findByText('저장됨')).toBeInTheDocument();
    expect(screen.getByText(RESTORED)).toBeInTheDocument();
  });
});
