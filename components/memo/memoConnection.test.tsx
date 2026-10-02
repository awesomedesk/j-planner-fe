import { screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MEMOS } from '@/test/memoFixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setViewportWidth } from '@/test/viewport';
import { getDayTabSlots } from '@components/layouts/app/dayTabSlots';
import { SIDEBAR_SECTION_SLOTS } from '@components/layouts/app/sidebarSectionSlots';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 9, 1, 10, 0));
  mockApi({ 'GET /memos': () => json(200, MEMOS) });
});
afterEach(() => vi.useRealTimers());

describe('메모 연결 지점 (US-25, D-049, D-055)', () => {
  it("모바일 일간 '메모' 탭: + 는 추가 메뉴 대신 바로 '새 메모' (D-055)", () => {
    expect(getDayTabSlots().MEMO?.directAddLabel).toBe('새 메모');
  });

  it('모바일 일간 메모 탭 내용은 메모 카드 목록 (MO-14, D-049)', async () => {
    setViewportWidth(390);
    const slot = getDayTabSlots().MEMO;
    renderWithStore(<>{slot?.render({ date: '2026-10-01', addRequestKey: 0 })}</>);
    await waitFor(() => expect(within(screen.getByRole('list', { name: '메모 목록' })).getAllByRole('listitem')).toHaveLength(4));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('+ 를 누를 때마다 늘어나는 addRequestKey로 새 메모 편집이 열린다 (D-055)', async () => {
    setViewportWidth(390);
    const slot = getDayTabSlots().MEMO;
    renderWithStore(<>{slot?.render({ date: '2026-10-01', addRequestKey: 1 })}</>);
    expect(await screen.findByRole('dialog', { name: '메모' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '메모 제목' })).toHaveValue('');
  });

  it("사이드바 '메모' 섹션은 받은 header 머리에 'n개'·+ 를 둔다 (D-055)", async () => {
    const header = (actions?: ReactNode) => <div data-testid="memo-header">{actions}</div>;
    const slot = SIDEBAR_SECTION_SLOTS.MEMO;
    renderWithStore(<>{slot?.({ header })}</>);
    const memoHeader = screen.getByTestId('memo-header');
    expect(await within(memoHeader).findByRole('button', { name: '메모 4개 모두 보기' })).toBeInTheDocument();
    expect(within(memoHeader).getByRole('button', { name: '새 메모' })).toBeInTheDocument();
  });
});
