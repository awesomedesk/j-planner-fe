import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GOOGLE_DONE_MESSAGE } from '@utils/auth/googleLogin';
import { goTo } from '@utils/navigation';

import GoogleDonePage from './GoogleDonePage';

vi.mock('@utils/navigation', () => ({ goTo: vi.fn(), currentPath: () => window.location.pathname + window.location.search }));

const open = (search = '') => {
  window.history.replaceState(null, '', `/login/google-done${search}`);
  return render(<GoogleDonePage />);
};

beforeEach(() => vi.mocked(goTo).mockClear());
afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

describe('구글 팝업 끝 화면 /login/google-done (US-36 AC4, D-072·D-077)', () => {
  it('성공: 원래 창에 알리고 팝업을 닫는다', () => {
    const postMessage = vi.fn();
    vi.spyOn(window, 'opener', 'get').mockReturnValue({ closed: false, postMessage } as unknown as Window);
    const close = vi.spyOn(window, 'close').mockImplementation(() => {});
    open();
    expect(postMessage).toHaveBeenCalledWith({ type: GOOGLE_DONE_MESSAGE, error: null }, window.location.origin);
    expect(close).toHaveBeenCalled();
    expect(goTo).not.toHaveBeenCalled();
  });

  it('실패(?error=코드): 그 코드를 알리고 닫는다', () => {
    const postMessage = vi.fn();
    vi.spyOn(window, 'opener', 'get').mockReturnValue({ closed: false, postMessage } as unknown as Window);
    vi.spyOn(window, 'close').mockImplementation(() => {});
    open('?error=GOOGLE_FAILED');
    expect(postMessage).toHaveBeenCalledWith({ type: GOOGLE_DONE_MESSAGE, error: 'GOOGLE_FAILED' }, window.location.origin);
  });

  it('닫히지 않을 때를 위해 안내 한 줄', () => {
    vi.spyOn(window, 'opener', 'get').mockReturnValue({ closed: false, postMessage: vi.fn() } as unknown as Window);
    vi.spyOn(window, 'close').mockImplementation(() => {});
    open();
    expect(screen.getByText('이 창은 닫아도 돼요')).toBeInTheDocument();
  });

  it('원래 창이 없으면(주소를 직접 염) 성공은 달력, 실패는 /login?error= (제가 정한 부분)', () => {
    vi.spyOn(window, 'opener', 'get').mockReturnValue(null);
    open();
    expect(goTo).toHaveBeenCalledWith('/');
    vi.mocked(goTo).mockClear();
    open('?error=ACCOUNT_SUSPENDED');
    expect(goTo).toHaveBeenCalledWith('/login?error=ACCOUNT_SUSPENDED');
  });
});
