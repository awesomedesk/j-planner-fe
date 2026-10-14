import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { apiClient } from '@utils/api';
import { goTo } from '@utils/navigation';

import RequireLogin from './RequireLogin';

vi.mock('@utils/navigation', () => ({ goTo: vi.fn(), currentPath: () => window.location.pathname + window.location.search }));

const ME = { email: 'qa@example.com', name: '검수', hasPassword: true, loginMethods: ['EMAIL'] };

const openApp = (path = '/') => {
  window.history.replaceState(null, '', path);
  return renderWithStore(
    <RequireLogin>
      <p>달력 화면</p>
    </RequireLogin>
  );
};

beforeEach(() => vi.mocked(goTo).mockClear());
afterEach(() => window.history.replaceState(null, '', '/'));

describe('로그인해야 앱 화면 (US-34, D-072)', () => {
  it('로그인했으면 앱 화면을 보여준다', async () => {
    mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': () => json(200, ME) });
    openApp();
    expect(await screen.findByText('달력 화면')).toBeInTheDocument();
    expect(goTo).not.toHaveBeenCalled();
  });

  it('확인하는 동안에는 앱 화면을 그리지 않는다 (데이터 요청 401 방지)', async () => {
    let answer: (value: ReturnType<typeof json>) => void = () => {};
    mockApi({ 'GET /auth/csrf': () => new Promise((resolve) => (answer = resolve)), 'GET /me': () => json(200, ME) });
    openApp();
    expect(screen.queryByText('달력 화면')).not.toBeInTheDocument();
    answer(json(204));
    expect(await screen.findByText('달력 화면')).toBeInTheDocument();
  });

  it('로그인 안 한 채 앱 화면을 열면 /login?next=<그 화면>', async () => {
    mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요') });
    openApp('/?view=week');
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/login?next=%2F%3Fview%3Dweek'));
    expect(screen.queryByText('달력 화면')).not.toBeInTheDocument();
  });

  it('서버에 닿지 않으면 로그인 화면으로 보내지 않고 안내 + [다시 시도] (제가 정한 부분)', async () => {
    let up = false;
    mockApi({
      'GET /auth/csrf': () => {
        if (!up) throw new TypeError('Failed to fetch');
        return json(204);
      },
      'GET /me': () => json(200, ME),
    });
    const { user } = openApp();
    expect(await screen.findByText('서버에 연결할 수 없어요. 잠시 후 다시 시도하세요.')).toBeInTheDocument();
    expect(goTo).not.toHaveBeenCalled();
    up = true;
    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByText('달력 화면')).toBeInTheDocument();
  });

  it('보던 중 데이터 요청이 401이면(세션 끝) /login?next=<지금 화면>', async () => {
    mockApi({
      'GET /auth/csrf': () => json(204),
      'GET /me': () => json(200, ME),
      'GET /todos': () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요'),
    });
    openApp('/?view=day');
    await screen.findByText('달력 화면');
    await expect(apiClient.get('/todos')).rejects.toMatchObject({ status: 401 });
    expect(goTo).toHaveBeenCalledWith('/login?next=%2F%3Fview%3Dday');
  });
});
