import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NoticeCenter from '@components/notice/NoticeCenter';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { resetViewport, setViewportWidth } from '@/test/viewport';
import { apiClient } from '@utils/api';

import DemoPage from './DemoPage';

const ME = { email: 'qa-fe@example.com', name: '검수', hasPassword: true, loginMethods: ['EMAIL'] };

/** 로그인한 브라우저처럼 실제 서버가 답할 준비가 돼 있어도 — 둘러보기는 한 번도 부르지 않아야 한다 */
const realServer = () =>
  mockApi({
    'GET /auth/csrf': () => json(204),
    'GET /me': () => json(200, ME),
    'GET /categories': () => json(200, []),
    'GET /schedules': () => json(200, []),
    'GET /todos': () => json(200, []),
    'GET /memos': () => json(200, []),
  });

const openDemo = () => {
  window.history.replaceState(null, '', '/demo');
  return renderWithStore(
    <>
      <DemoPage />
      <NoticeCenter />
    </>
  );
};

const guide = async () => within(await screen.findByRole('alertdialog', { name: '가입하면 저장돼요' }));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 4, 10, 0)); // 11/4(수)
  setViewportWidth(1440);
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  vi.useRealTimers();
  resetViewport();
  window.history.replaceState(null, '', '/');
});

describe('둘러보기 /demo — 예시 화면 (US-40 AC1·AC2, 06 SITE-08)', () => {
  it('상단 안내 "예시 화면이에요. 입력한 내용은 저장되지 않아요." + [가입하기]→/signup · [로그인]→/login', async () => {
    realServer();
    openDemo();
    const banner = within(await screen.findByRole('region', { name: '둘러보기 안내' }));
    expect(banner.getByText('예시 화면이에요. 입력한 내용은 저장되지 않아요.')).toBeInTheDocument();
    expect(banner.getByRole('link', { name: '가입하기' })).toHaveAttribute('href', '/signup');
    expect(banner.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login');
  });

  it('오늘이 있는 월간 달력에 예시 일정, 사이드바 Todo에 예시 Todo — 로그인한 브라우저여도 실제 서버 요청 0회', async () => {
    const api = realServer();
    openDemo();
    expect(await screen.findByLabelText('월간 달력')).toBeInTheDocument();
    expect(screen.getAllByText('2026년 11월').length).toBeGreaterThan(0);
    expect(await screen.findByRole('checkbox', { name: '주간 계획 세우기 완료' })).toBeInTheDocument();
    expect(api.all()).toHaveLength(0);
  });
});

describe('둘러보기 — 저장하려 하면 (US-40 AC4, 06 SITE-08 저장하려 할 때)', () => {
  it('Todo 완료 체크 → 바꾸기 전에 "가입하면 저장돼요" 안내, 체크는 그대로, 요청 0회', async () => {
    const api = realServer();
    const { user } = openDemo();
    const box = await screen.findByRole('checkbox', { name: '주간 계획 세우기 완료' });
    await user.click(box);
    const dialog = await guide();
    expect(dialog.getByText('둘러보기에서는 저장할 수 없어요. 입력한 내용은 가입해도 옮겨지지 않아요.')).toBeInTheDocument();
    expect(dialog.getByRole('link', { name: '가입하기' })).toHaveAttribute('href', '/signup');
    expect(dialog.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('checkbox', { name: '주간 계획 세우기 완료' })).not.toBeChecked();
    await user.click(dialog.getByRole('button', { name: '계속 둘러보기' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(api.all()).toHaveLength(0);
  });

  it('일정 추가 창에서 [저장] → 안내, [계속 둘러보기]면 쓰던 창과 입력이 그대로 · 오류 문구 없음 · 요청 0회', async () => {
    const api = realServer();
    const { user } = openDemo();
    await user.click(await screen.findByRole('button', { name: '추가' }));
    await user.click(await screen.findByRole('menuitem', { name: '일정' }));
    const title = await screen.findByRole('textbox', { name: '제목' });
    await user.type(title, '둘러보기 일정');
    const saves = screen.getAllByRole('button', { name: '저장' });
    await user.click(saves[saves.length - 1]);
    const dialog = await guide();
    await user.click(dialog.getByRole('button', { name: '계속 둘러보기' }));
    expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue('둘러보기 일정');
    expect(screen.queryByText(/저장하지 못했어요|오류/)).not.toBeInTheDocument();
    expect(api.all()).toHaveLength(0);
  });

  it('브라우저 저장소(localStorage·sessionStorage)에 예시·입력을 남기지 않는다', async () => {
    realServer();
    const { user } = openDemo();
    await user.click(await screen.findByRole('checkbox', { name: '주간 계획 세우기 완료' }));
    await guide();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});

describe('둘러보기 경계 (US-40 AC3)', () => {
  it('둘러보기 화면을 떠나면 다시 실제 서버로 보낸다 (예시가 앱에 섞이지 않음)', async () => {
    const api = realServer();
    const { unmount } = openDemo();
    await screen.findByRole('checkbox', { name: '주간 계획 세우기 완료' });
    unmount();
    await apiClient.get('/categories');
    await waitFor(() => expect(api.calls('GET /categories')).toHaveLength(1));
  });
});
