import { screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { apiClient } from '@utils/api';
import { GOOGLE_DONE_MESSAGE, GOOGLE_POPUP_PATH } from '@utils/auth/googleLogin';
import { goTo } from '@utils/navigation';

import RequireLogin from './RequireLogin';

vi.mock('@utils/navigation', () => ({ goTo: vi.fn(), currentPath: () => window.location.pathname + window.location.search }));

const ME = { email: 'g@example.com', name: '구글', hasPassword: false, loginMethods: ['GOOGLE'] };
const OTHER = { ...ME, email: 'other@example.com' };
const EXPIRED = () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요');

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

/** 세션이 끝난 서버. 팝업에서 구글 로그인을 마치면(googleDone) 다시 로그인된 상태 */
const expiredServer = (after: typeof ME = ME) => {
  let signedIn = false;
  let first = true;
  const api = mockApi({
    'GET /auth/csrf': () => json(204),
    'GET /me': () => {
      if (first) {
        first = false;
        return json(200, ME); // 앱을 열 때
      }
      return signedIn ? json(200, after) : EXPIRED();
    },
    'POST /todos': () => (signedIn ? json(201, { id: 1 }) : EXPIRED()),
  });
  return { api, googleDone: () => (signedIn = true) };
};

const fakePopup = () => ({ closed: false, close: vi.fn() }) as unknown as Window & { closed: boolean };
const popupSays = (popup: Window, error: string | null = null) =>
  window.dispatchEvent(new MessageEvent('message', { data: { type: GOOGLE_DONE_MESSAGE, error }, origin: window.location.origin, source: popup }));

const openAndExpire = async () => {
  window.history.replaceState(null, '', '/?view=day');
  const view = renderWithStore(
    <RequireLogin>
      <Writer />
    </RequireLogin>
  );
  await view.user.click(await screen.findByRole('button', { name: '저장' }));
  const dialog = await screen.findByRole('dialog', { name: '다시 로그인해 주세요' });
  return { ...view, dialog };
};

beforeEach(() => vi.mocked(goTo).mockClear());
afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

describe('다시 로그인 창의 [Google로 계속하기] (US-36 AC4, D-072·D-077)', () => {
  it('창에 [Google로 계속하기]가 있고, 누르면 팝업으로 연다 (?popup=true)', async () => {
    expiredServer();
    const popup = fakePopup();
    const open = vi.spyOn(window, 'open').mockReturnValue(popup);
    const { user, dialog } = await openAndExpire();
    await user.click(within(dialog).getByRole('button', { name: 'Google로 계속하기' }));
    expect(open).toHaveBeenCalledWith(GOOGLE_POPUP_PATH, expect.any(String), expect.any(String));
  });

  it('같은 계정(비밀번호 없는 구글 계정)이면 GET /me → 새 CSRF → 같은 저장을 이어서 한다', async () => {
    const { api, googleDone } = expiredServer();
    const popup = fakePopup();
    vi.spyOn(window, 'open').mockReturnValue(popup);
    const { user, dialog } = await openAndExpire();
    await user.click(within(dialog).getByRole('button', { name: 'Google로 계속하기' }));
    googleDone();
    popupSays(popup);

    expect(await screen.findByText('저장됨')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: '다시 로그인해 주세요' })).not.toBeInTheDocument();
    const keys = api.all().map((r) => r.key);
    expect(keys.slice(keys.indexOf('POST /todos') + 1)).toEqual(['GET /me', 'GET /auth/csrf', 'POST /todos']);
    expect(goTo).not.toHaveBeenCalled();
  });

  it('다른 계정이면 이어서 저장하지 않고 화면을 새로 연다', async () => {
    const { api, googleDone } = expiredServer(OTHER);
    const popup = fakePopup();
    vi.spyOn(window, 'open').mockReturnValue(popup);
    const { user, dialog } = await openAndExpire();
    await user.click(within(dialog).getByRole('button', { name: 'Google로 계속하기' }));
    googleDone();
    popupSays(popup);

    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/?view=day'));
    expect(api.calls('POST /todos')).toHaveLength(1);
  });

  it('팝업이 오류를 알리면 창 안 오류 줄에 문구, 창은 그대로', async () => {
    expiredServer();
    const popup = fakePopup();
    vi.spyOn(window, 'open').mockReturnValue(popup);
    const { user, dialog } = await openAndExpire();
    await user.click(within(dialog).getByRole('button', { name: 'Google로 계속하기' }));
    popupSays(popup, 'GOOGLE_FAILED');

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('구글 로그인을 마치지 못했어요. 다시 시도해 주세요.');
    expect(screen.getByRole('dialog', { name: '다시 로그인해 주세요' })).toBeInTheDocument();
  });

  it('팝업이 막히면 안내 줄', async () => {
    expiredServer();
    vi.spyOn(window, 'open').mockReturnValue(null);
    const { user, dialog } = await openAndExpire();
    await user.click(within(dialog).getByRole('button', { name: 'Google로 계속하기' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('팝업이 막혀 있어요');
  });

  it('팝업이 끝났다는데 세션이 없으면(GET /me 401) 구글 실패 문구, 저장은 다시 보내지 않음', async () => {
    const { api } = expiredServer();
    const popup = fakePopup();
    vi.spyOn(window, 'open').mockReturnValue(popup);
    const { user, dialog } = await openAndExpire();
    await user.click(within(dialog).getByRole('button', { name: 'Google로 계속하기' }));
    popupSays(popup); // googleDone() 없이

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('구글 로그인을 마치지 못했어요');
    expect(api.calls('POST /todos')).toHaveLength(1);
  });
});
