import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ddayFixture } from '@/test/ddayFixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setViewportWidth } from '@/test/viewport';

import { DdayActionsContext } from './DdayActionsContext';
import DdaySection from './DdaySection';
import DdayTab from './DdayTab';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 10, 26, 10, 0));
});
afterEach(() => vi.useRealTimers());

const LIST = [
  ddayFixture({ id: 1, title: '기말 시험', today: { value: -12, label: 'D-12' } }),
  ddayFixture({ id: 2, title: '만난 날', countType: 'COUNTUP', today: { value: 30, label: 'D+30' } }),
  ddayFixture({ id: 3, title: '오늘 마감', today: { value: 0, label: 'D-Day' } }),
];

const mountWith = (ui: React.ReactElement, list = LIST) => {
  const api = mockApi({
    'GET /ddays': () => json(200, list),
    'PUT /ddays/:id/position': (req) => json(200, { ...list[0], ...(req.body as object) }),
    'DELETE /ddays/:id': () => json(204),
    'GET /dday-marks': () => json(200, []),
  });
  const actions = { openNewDday: vi.fn(), openDday: vi.fn() };
  const view = renderWithStore(<DdayActionsContext.Provider value={actions}>{ui}</DdayActionsContext.Provider>);
  return { api, actions, ...view };
};

const rows = (name = 'D-Day 목록') => within(screen.getByRole('list', { name })).getAllByRole('listitem');
const rowTexts = (name?: string) => rows(name).map((row) => row.textContent);

describe('PC 사이드바 D-Day 섹션 (US-22, OV-03 · D-029)', () => {
  beforeEach(() => setViewportWidth(1440));

  it('행: 제목 + 오늘 기준 표시, 남은 날·지난 날 구분 없이 사용자 순서 (D-029)', async () => {
    mountWith(<DdaySection />);
    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(rowTexts()[0]).toContain('기말 시험');
    expect(rowTexts()[0]).toContain('D-12');
    expect(rowTexts()[1]).toContain('D+30');
    expect(rowTexts()[2]).toContain('D-Day');
  });

  it('행을 누르면(Enter 포함) 그 D-Day 수정 창을 연다', async () => {
    const { user, actions } = mountWith(<DdaySection />);
    const open = await screen.findByRole('button', { name: '기말 시험 D-12 수정' });
    await user.click(open);
    expect(actions.openDday).toHaveBeenCalledWith(LIST[0]);
    open.focus();
    await user.keyboard('{Enter}');
    expect(actions.openDday).toHaveBeenCalledTimes(2);
  });

  it('머리의 [D-Day 추가] → 새 D-Day 창', async () => {
    const { user, actions } = mountWith(<DdaySection header={(actions) => <div data-testid="head">{actions}</div>} />);
    await user.click(within(screen.getByTestId('head')).getByRole('button', { name: 'D-Day 추가' }));
    expect(actions.openNewDday).toHaveBeenCalled();
  });

  it('빈 상태: "D-Day가 없어요." + [D-Day 추가]', async () => {
    const { user, actions } = mountWith(<DdaySection />, []);
    expect(await screen.findByText('D-Day가 없어요.')).toBeInTheDocument();
    const adds = screen.getAllByRole('button', { name: 'D-Day 추가' });
    await user.click(adds[adds.length - 1]);
    expect(actions.openNewDday).toHaveBeenCalled();
  });

  it('키보드: [아래로]·[위로]로 순서를 바꾸고 PUT position, 맨 위의 위로·맨 아래의 아래로는 막힘 (06 목록)', async () => {
    const { user, api } = mountWith(<DdaySection />);
    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(screen.getByRole('button', { name: '기말 시험 위로' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '오늘 마감 아래로' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '기말 시험 아래로' }));
    expect(rowTexts()[0]).toContain('만난 날');
    expect(rowTexts()[1]).toContain('기말 시험');
    expect(api.calls('PUT /ddays/:id/position')[0]).toMatchObject({ path: '/ddays/1', body: { afterId: 2 } });
    expect(screen.getByRole('button', { name: '기말 시험 아래로' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: '오늘 마감 위로' }));
    expect(api.calls('PUT /ddays/:id/position')[1]).toMatchObject({ path: '/ddays/3', body: { afterId: 2 } });
  });
});

describe('모바일 일간 D-Day 탭 (US-22, MO-13 · D-049 · D-030)', () => {
  beforeEach(() => setViewportWidth(390));

  const swipe = (el: HTMLElement, dx: number) => {
    fireEvent.touchStart(el, { touches: [{ clientX: 300, clientY: 300 }] });
    fireEvent.touchEnd(el, { changedTouches: [{ clientX: 300 + dx, clientY: 300 }] });
  };

  it('같은 목록 + 카드를 누르면 수정 창', async () => {
    const { user, actions } = mountWith(<DdayTab />);
    await waitFor(() => expect(rows()).toHaveLength(3));
    await user.click(screen.getByRole('button', { name: '만난 날 D+30 수정' }));
    expect(actions.openDday).toHaveBeenCalledWith(LIST[1]);
  });

  it('[D-Day 추가] 버튼 → 새 D-Day 창', async () => {
    const { user, actions } = mountWith(<DdayTab />);
    await waitFor(() => expect(rows()).toHaveLength(3));
    await user.click(screen.getByRole('button', { name: 'D-Day 추가' }));
    expect(actions.openNewDday).toHaveBeenCalled();
  });

  it('왼쪽으로 밀면 삭제 → 확인 창: 취소하면 그대로, 삭제하면 DELETE 후 목록에서 빠진다 (D-030)', async () => {
    const { user, api } = mountWith(<DdayTab />);
    await waitFor(() => expect(rows()).toHaveLength(3));
    swipe(rows()[0], -120);
    await user.click(screen.getByRole('button', { name: '기말 시험 삭제' }));
    const confirm = screen.getByRole('alertdialog', { name: '이 D-Day를 지울까요?' });
    expect(within(confirm).getByRole('button', { name: '취소' })).toHaveFocus();
    await user.click(within(confirm).getByRole('button', { name: '취소' }));
    expect(api.calls('DELETE /ddays/:id')).toHaveLength(0);
    expect(rows()).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: '기말 시험 삭제' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(api.calls('DELETE /ddays/:id')).toHaveLength(1));
    expect(api.calls('DELETE /ddays/:id')[0].path).toBe('/ddays/1');
    await waitFor(() => expect(api.calls('GET /ddays')).toHaveLength(2));
  });

  it('빈 상태 문구', async () => {
    mountWith(<DdayTab />, []);
    expect(await screen.findByText('D-Day가 없어요.')).toBeInTheDocument();
  });
});
