import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NoticeCenter from '@components/notice/NoticeCenter';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { checkSession } from '@store/slices/authSlice';
import { makeStore } from '@store/store';
import { goTo } from '@utils/navigation';

import AccountMenuButton from './AccountMenuButton';
import MobileMenu from './MobileMenu';

vi.mock('@utils/navigation', () => ({ goTo: vi.fn(), currentPath: () => '/' }));

const ME = { email: 'qa@example.com', name: '검수', hasPassword: true, loginMethods: ['EMAIL' as const] };

const signedInStore = () => {
  const store = makeStore();
  store.dispatch(checkSession.fulfilled(ME, 'test'));
  return store;
};

const openPcMenu = async () => {
  const view = renderWithStore(
    <>
      <AccountMenuButton />
      <NoticeCenter />
    </>,
    { store: signedInStore() }
  );
  await view.user.click(screen.getByRole('button', { name: '계정 메뉴' }));
  return { ...view, menu: screen.getByRole('dialog', { name: '계정' }) };
};

beforeEach(() => vi.mocked(goTo).mockClear());

describe('PC·태블릿 계정 메뉴 (US-34, D-072)', () => {
  it('동그란 버튼에 이름 첫 글자, 누르면 이름·이메일·내 계정·로그아웃·모든 기기에서 로그아웃', async () => {
    const { user } = renderWithStore(<AccountMenuButton />, { store: signedInStore() });
    const button = screen.getByRole('button', { name: '계정 메뉴' });
    expect(button).toHaveTextContent('검');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    const menu = screen.getByRole('dialog', { name: '계정' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(within(menu).getByText('검수')).toBeInTheDocument();
    expect(within(menu).getByText('qa@example.com')).toBeInTheDocument();
    for (const name of ['내 계정', '로그아웃', '모든 기기에서 로그아웃']) {
      expect(within(menu).getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it("'내 계정'은 점선 자리 — '준비 중이에요' (US-37)", async () => {
    const api = mockApi({});
    const { user, menu } = await openPcMenu();
    await user.click(within(menu).getByRole('button', { name: '내 계정' }));
    expect(await screen.findByRole('status')).toHaveTextContent('준비 중이에요');
    expect(api.all()).toHaveLength(0);
  });

  it('Esc로 닫힌다', async () => {
    const { user } = await openPcMenu();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: '계정' })).not.toBeInTheDocument();
  });

  it('로그아웃 → POST /auth/logout(CSRF 헤더) → 로그인 화면', async () => {
    const api = mockApi({ 'POST /auth/logout': () => json(204) });
    const { user, menu } = await openPcMenu();
    await user.click(within(menu).getByRole('button', { name: '로그아웃' }));
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/login'));
    expect(api.calls('POST /auth/logout')[0].headers['x-xsrf-token']).toBe('test-csrf');
  });

  it('모든 기기에서 로그아웃: 확인 창 "다른 기기에서도 모두 로그아웃할까요?" → DELETE /me/sessions → POST /auth/logout → 로그인 화면', async () => {
    const api = mockApi({ 'DELETE /me/sessions': () => json(204), 'POST /auth/logout': () => json(204) });
    const { user, menu } = await openPcMenu();
    await user.click(within(menu).getByRole('button', { name: '모든 기기에서 로그아웃' }));
    const confirm = screen.getByRole('alertdialog', { name: '다른 기기에서도 모두 로그아웃할까요?' });
    expect(api.all()).toHaveLength(0);
    await user.click(within(confirm).getByRole('button', { name: '모두 로그아웃' }));
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/login'));
    expect(api.all().map((r) => r.key)).toEqual(['DELETE /me/sessions', 'POST /auth/logout']);
  });

  it('확인 창에서 취소하면 아무것도 하지 않는다', async () => {
    const api = mockApi({});
    const { user, menu } = await openPcMenu();
    await user.click(within(menu).getByRole('button', { name: '모든 기기에서 로그아웃' }));
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(api.all()).toHaveLength(0);
    expect(goTo).not.toHaveBeenCalled();
  });

  it('로그아웃을 서버에 못 보내면 안내하고 화면은 그대로 (제가 정한 부분)', async () => {
    mockApi({
      'POST /auth/logout': () => {
        throw new TypeError('Failed to fetch');
      },
    });
    const { user, menu } = await openPcMenu();
    await user.click(within(menu).getByRole('button', { name: '로그아웃' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('서버에 연결할 수 없어요');
    expect(goTo).not.toHaveBeenCalled();
  });
});

describe('모바일 ≡ 메뉴 맨 아래 (US-34, D-072 · US-28 틀)', () => {
  it("머리는 '<' + '메뉴', 맨 아래에 이름·이메일·내 계정·로그아웃·모든 기기에서 로그아웃", async () => {
    const onClose = vi.fn();
    const { user } = renderWithStore(<MobileMenu onClose={onClose} />, { store: signedInStore() });
    const menu = screen.getByRole('dialog', { name: '메뉴' });
    expect(within(menu).getByText('qa@example.com')).toBeInTheDocument();
    for (const name of ['내 계정', '로그아웃', '모든 기기에서 로그아웃']) {
      expect(within(menu).getByRole('button', { name })).toBeInTheDocument();
    }
    await user.click(within(menu).getByRole('button', { name: '메뉴 닫기' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('로그아웃하면 로그인 화면', async () => {
    mockApi({ 'POST /auth/logout': () => json(204) });
    const { user } = renderWithStore(<MobileMenu onClose={() => {}} />, { store: signedInStore() });
    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/login'));
  });
});
