import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NoticeCenter from '@components/notice/NoticeCenter';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { checkSession } from '@store/slices/authSlice';
import { makeStore } from '@store/store';
import { goTo } from '@utils/navigation';

import { CalendarSettingsContext } from '@components/settings/CalendarSettingsContext';

import AccountMenuButton from './AccountMenuButton';
import MobileMenu from './MobileMenu';
import SettingsAccountScreen from './SettingsAccountScreen';
import { takeAccountReturn } from './accountReturnFocus';

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

  it('내용 순서: 계정(이름·이메일·내 계정) → 달력 설정 → 로그아웃·모든 기기 → 약관·처리방침·문의', async () => {
    const { menu } = await openPcMenu();
    expect(within(menu).getByText('검수')).toBeInTheDocument();
    expect(within(menu).getByText('qa@example.com')).toBeInTheDocument();
    expect(within(menu).getByRole('link', { name: '내 계정' })).toHaveAttribute('href', '/me');
    const order = ['내 계정', '달력 설정', '로그아웃', '모든 기기에서 로그아웃', '이용약관', '개인정보처리방침', '문의'];
    const names = Array.from(menu.querySelectorAll('button, a')).map((el) => el.textContent?.replace('›', '').trim()); // › 는 꾸밈(aria-hidden)
    expect(names.filter((n) => order.includes(n ?? ''))).toEqual(order);
    expect(within(menu).getByRole('heading', { name: '계정' })).toBeInTheDocument();
    expect(within(menu).getByRole('heading', { name: '달력 설정' })).toBeInTheDocument();
  });

  it('[달력 설정 ›] → 메뉴를 닫고 달력 설정을 연다 (진입 ⚙ 기억, US-26 · #396 v1.3)', async () => {
    const open = vi.fn();
    const { user } = renderWithStore(
      <CalendarSettingsContext.Provider value={{ open, menuReopenKey: 0 }}>
        <AccountMenuButton />
      </CalendarSettingsContext.Provider>,
      { store: signedInStore() }
    );
    await user.click(screen.getByRole('button', { name: '설정 및 계정' }));
    const menu = screen.getByRole('dialog', { name: '설정 및 계정' });
    expect(within(menu).queryByText(/준비 중이에요/)).not.toBeInTheDocument();
    await user.click(within(menu).getByRole('button', { name: '달력 설정' }));
    expect(open).toHaveBeenCalledWith('gear');
    expect(screen.queryByRole('dialog', { name: '설정 및 계정' })).not.toBeInTheDocument();
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
    await user.click(screen.getByTestId('settings-account-backdrop'));
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

describe('PC·태블릿 설정 및 계정 모달 (D-117 · #382 승인 803ad5e)', () => {
  it('열면 머리 [닫기]에 초점, [닫기]를 누르면 닫히고 ⚙로 초점', async () => {
    const { user, menu } = await openPcMenu();
    const close = within(menu).getByRole('button', { name: '닫기' });
    expect(close).toHaveFocus();
    await user.click(close);
    expect(screen.queryByRole('dialog', { name: TRIGGER })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: TRIGGER })).toHaveFocus();
  });

  it('Tab·Shift+Tab은 메뉴 안에서 마지막 ↔ 첫 항목을 바로 돈다', async () => {
    const { user, menu } = await openPcMenu();
    const close = within(menu).getByRole('button', { name: '닫기' });
    const contact = within(menu).getByRole('link', { name: '문의' });
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(contact).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
  });

  it('바깥을 누르면 닫히고 ⚙로 초점, 그 누름은 뒤 달력으로 가지 않는다 (모달)', async () => {
    const behind = vi.fn();
    const view = renderWithStore(
      <>
        <button type="button" onClick={behind}>
          뒤 달력 칸
        </button>
        <AccountMenuButton />
      </>,
      { store: signedInStore() }
    );
    await view.user.click(screen.getByRole('button', { name: TRIGGER }));
    await view.user.click(screen.getByTestId('settings-account-backdrop'));
    expect(screen.queryByRole('dialog', { name: TRIGGER })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: TRIGGER })).toHaveFocus();
    expect(behind).not.toHaveBeenCalled();
  });

  it('모든 기기 확인 창: Tab은 확인 창 안에서만, 취소·Esc로 닫으면 [모든 기기에서 로그아웃]으로 초점', async () => {
    const { user, menu } = await openPcMenu();
    const everywhere = within(menu).getByRole('button', { name: '모든 기기에서 로그아웃' });
    await user.click(everywhere);
    const confirm = screen.getByRole('alertdialog');
    expect(within(confirm).getByRole('button', { name: '취소' })).toHaveFocus();
    await user.tab();
    expect(within(confirm).getByRole('button', { name: '모두 로그아웃' })).toHaveFocus();
    await user.tab();
    expect(within(confirm).getByRole('button', { name: '취소' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(everywhere).toHaveFocus();

    await user.click(everywhere);
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '취소' }));
    expect(everywhere).toHaveFocus();
  });

  it('[내 계정]은 /me 링크(오른쪽 ›), 누르면 돌아올 때 초점을 둘 진입 버튼(⚙)을 기억한다 (D-117)', async () => {
    const { user, menu } = await openPcMenu();
    const link = within(menu).getByRole('link', { name: '내 계정' });
    expect(link).toHaveAttribute('href', '/me');
    expect(link).toHaveTextContent('›');
    link.addEventListener('click', (event) => event.preventDefault());
    await user.click(link);
    expect(takeAccountReturn()).toBe('gear');
    expect(takeAccountReturn()).toBeNull();
  });
});

describe('모바일 설정 및 계정 전체 화면 (D-109, #366 · MO-16 자리)', () => {
  it('제목 "설정 및 계정" + [닫기], 같은 내용, 열리면 [닫기]로 초점, 닫기·Esc로 닫힌다', async () => {
    const onClose = vi.fn();
    const { user } = renderWithStore(<SettingsAccountScreen entry="gear" onClose={onClose} />, { store: signedInStore() });
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

  it('머리 오른쪽 × [닫기], Tab은 화면 안에서 돈다, [내 계정]은 연 버튼(≡)을 기억한다 (D-117)', async () => {
    const { user } = renderWithStore(<SettingsAccountScreen entry="menu" onClose={() => {}} />, { store: signedInStore() });
    const screenEl = screen.getByRole('dialog', { name: TRIGGER });
    const close = within(screenEl).getByRole('button', { name: '닫기' });
    expect(close).toHaveFocus();
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(within(screenEl).getByRole('link', { name: '문의' })).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    const link = within(screenEl).getByRole('link', { name: '내 계정' });
    link.addEventListener('click', (event) => event.preventDefault());
    await user.click(link);
    expect(takeAccountReturn()).toBe('menu');
  });

  it('로그아웃하면 로그인 화면', async () => {
    mockApi({ 'POST /auth/logout': () => json(204) });
    const { user } = renderWithStore(<SettingsAccountScreen entry="gear" onClose={() => {}} />, { store: signedInStore() });
    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/login'));
  });
});

describe('모바일 ≡ 메뉴 (MO-02 · D-109: 계정 기능은 "설정 및 계정" 하나로)', () => {
  it("머리는 '<' + '메뉴', 계정 내용을 겹쳐 두지 않고 [설정 및 계정] 하나", async () => {
    const onClose = vi.fn();
    const onOpenSettings = vi.fn();
    const { user } = renderWithStore(
      <MobileMenu items={[]} onOpenTab={vi.fn()} onOpenCategories={vi.fn()} onClose={onClose} onOpenSettings={onOpenSettings} />,
      { store: signedInStore() }
    );
    const menu = screen.getByRole('dialog', { name: '메뉴' });
    expect(within(menu).queryByText('qa@example.com')).not.toBeInTheDocument();
    expect(within(menu).queryByRole('button', { name: '로그아웃' })).not.toBeInTheDocument();
    await user.click(within(menu).getByRole('button', { name: TRIGGER }));
    expect(onOpenSettings).toHaveBeenCalled();
    await user.click(within(menu).getByRole('button', { name: '메뉴 닫기' }));
    expect(onClose).toHaveBeenCalled();
  });
});
