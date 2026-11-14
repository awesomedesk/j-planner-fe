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
import SettingsAccountScreen from './SettingsAccountScreen';

vi.mock('@utils/navigation', () => ({ goTo: vi.fn(), currentPath: () => '/' }));

const ME = { email: 'qa@example.com', name: '검수', hasPassword: true, loginMethods: ['EMAIL' as const] };
const TRIGGER = '설정 및 계정';

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
  await view.user.click(screen.getByRole('button', { name: TRIGGER }));
  return { ...view, menu: screen.getByRole('dialog', { name: TRIGGER }) };
};

beforeEach(() => vi.mocked(goTo).mockClear());

describe('PC·태블릿 ⚙ 설정 및 계정 (D-109, #366 · US-34 D-072)', () => {
  it('⚙ 하나: 이름 첫 글자 없음, 이름 "설정 및 계정", 누르면 연결된 메뉴가 열린다', async () => {
    const { user } = renderWithStore(<AccountMenuButton />, { store: signedInStore() });
    const button = screen.getByRole('button', { name: TRIGGER });
    expect(button).not.toHaveTextContent(/\S/);
    expect(screen.queryByRole('button', { name: '계정 메뉴' })).not.toBeInTheDocument();
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    const menu = screen.getByRole('dialog', { name: TRIGGER });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', menu.id);
    expect(within(menu).getByRole('heading', { name: TRIGGER })).toBeInTheDocument();
  });

  it('내용 순서: 계정(이름·이메일·내 계정) → 달력 설정(점선) → 로그아웃·모든 기기 → 약관·처리방침·문의', async () => {
    const { menu } = await openPcMenu();
    expect(within(menu).getByText('검수')).toBeInTheDocument();
    expect(within(menu).getByText('qa@example.com')).toBeInTheDocument();
    expect(within(menu).getByRole('link', { name: '내 계정' })).toHaveAttribute('href', '/me');
    const order = ['내 계정', '달력 설정', '로그아웃', '모든 기기에서 로그아웃', '이용약관', '개인정보처리방침', '문의'];
    const names = within(menu)
      .getAllByRole(/^(button|link)$/)
      .map((el) => el.textContent?.trim());
    expect(names.filter((n) => order.includes(n ?? ''))).toEqual(order);
    expect(within(menu).getByRole('heading', { name: '계정' })).toBeInTheDocument();
    expect(within(menu).getByRole('heading', { name: '달력 설정' })).toBeInTheDocument();
  });

  it("[달력 설정]은 아직 점선 — 누르면 '준비 중이에요' (US-26 전, D-008)", async () => {
    const { user, menu } = await openPcMenu();
    await user.click(within(menu).getByRole('button', { name: '달력 설정' }));
    expect(await screen.findByText('준비 중이에요')).toBeInTheDocument();
  });

  it('키보드: Enter로 열고 Esc로 닫으면 ⚙로 초점이 돌아온다', async () => {
    const { user } = renderWithStore(<AccountMenuButton />, { store: signedInStore() });
    await user.tab();
    const button = screen.getByRole('button', { name: TRIGGER });
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: TRIGGER })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: TRIGGER })).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('Space로도 연다', async () => {
    const { user } = renderWithStore(<AccountMenuButton />, { store: signedInStore() });
    await user.tab();
    await user.keyboard(' ');
    expect(screen.getByRole('dialog', { name: TRIGGER })).toBeInTheDocument();
  });

  it('바깥을 누르면 닫힌다', async () => {
    const { user } = await openPcMenu();
    await user.click(document.body);
    expect(screen.queryByRole('dialog', { name: TRIGGER })).not.toBeInTheDocument();
  });

  it('모든 기기 확인 창이 열려 있으면 첫 Esc는 확인 창만 닫고 메뉴는 그대로', async () => {
    const { user, menu } = await openPcMenu();
    await user.click(within(menu).getByRole('button', { name: '모든 기기에서 로그아웃' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: TRIGGER })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: TRIGGER })).not.toBeInTheDocument();
  });

  it('로그아웃 → POST /auth/logout(CSRF 헤더) → 로그인 화면', async () => {
    const api = mockApi({ 'POST /auth/logout': () => json(204) });
    const { user, menu } = await openPcMenu();
    await user.click(within(menu).getByRole('button', { name: '로그아웃' }));
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/login'));
    expect(api.calls('POST /auth/logout')[0].headers['x-xsrf-token']).toBe('test-csrf');
  });

  it('모든 기기에서 로그아웃: 확인 → DELETE /me/sessions → POST /auth/logout → 로그인 화면', async () => {
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

  it('로그인 정보가 없으면(둘러보기) 계정·이메일·내 계정·로그아웃 없이 달력 설정·약관만 (D-093)', async () => {
    const { user } = renderWithStore(<AccountMenuButton />);
    await user.click(screen.getByRole('button', { name: TRIGGER }));
    const menu = screen.getByRole('dialog', { name: TRIGGER });
    expect(within(menu).queryByRole('link', { name: '내 계정' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('button', { name: '로그아웃' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('heading', { name: '계정' })).not.toBeInTheDocument();
    expect(within(menu).getByRole('button', { name: '달력 설정' })).toBeInTheDocument();
  });
});

describe('모바일 설정 및 계정 전체 화면 (D-109, #366 · MO-16 자리)', () => {
  it('제목 "설정 및 계정" + [닫기], 같은 내용, 열리면 [닫기]로 초점, 닫기·Esc로 닫힌다', async () => {
    const onClose = vi.fn();
    const { user } = renderWithStore(<SettingsAccountScreen onClose={onClose} />, { store: signedInStore() });
    const screenEl = screen.getByRole('dialog', { name: TRIGGER });
    expect(screenEl).toHaveAttribute('aria-modal', 'true');
    const close = within(screenEl).getByRole('button', { name: '닫기' });
    expect(close).toHaveFocus();
    expect(within(screenEl).getByText('qa@example.com')).toBeInTheDocument();
    expect(within(screenEl).getByRole('link', { name: '내 계정' })).toHaveAttribute('href', '/me');
    for (const name of ['달력 설정', '로그아웃', '모든 기기에서 로그아웃']) {
      expect(within(screenEl).getByRole('button', { name })).toBeInTheDocument();
    }
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.click(close);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('로그아웃하면 로그인 화면', async () => {
    mockApi({ 'POST /auth/logout': () => json(204) });
    const { user } = renderWithStore(<SettingsAccountScreen onClose={() => {}} />, { store: signedInStore() });
    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/login'));
  });
});

describe('모바일 ≡ 메뉴 (MO-02 · D-109: 계정 기능은 "설정 및 계정" 하나로)', () => {
  it("머리는 '<' + '메뉴', 계정 내용을 겹쳐 두지 않고 [설정 및 계정] 하나", async () => {
    const onClose = vi.fn();
    const onOpenSettings = vi.fn();
    const { user } = renderWithStore(<MobileMenu onClose={onClose} onOpenSettings={onOpenSettings} />, { store: signedInStore() });
    const menu = screen.getByRole('dialog', { name: '메뉴' });
    expect(within(menu).queryByText('qa@example.com')).not.toBeInTheDocument();
    expect(within(menu).queryByRole('button', { name: '로그아웃' })).not.toBeInTheDocument();
    await user.click(within(menu).getByRole('button', { name: TRIGGER }));
    expect(onOpenSettings).toHaveBeenCalled();
    await user.click(within(menu).getByRole('button', { name: '메뉴 닫기' }));
    expect(onClose).toHaveBeenCalled();
  });
});
