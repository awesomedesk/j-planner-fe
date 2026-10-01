import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { TimetableSlot } from '@components/calendar/hooks/useQuickAddSlot';

import { useQuickAddState } from './useQuickAddState';

// 칸 위쪽이 화면 100px, 1시간 = 48px 인 일간 칸
const slotAt = (startTime: string): TimetableSlot => {
  const anchorFor = ({ start, end }: { start: number; end: number }) => ({ left: 60, right: 1000, top: 100 + (start / 60) * 48, bottom: 100 + (end / 60) * 48 });
  const start = Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3));
  return { date: '2026-09-25', startTime, anchor: anchorFor({ start, end: start + 60 }), anchorFor };
};

describe('빠른 추가 상태 (US-10, D-053)', () => {
  it('임시 블록을 끌면 시간 칸 값과 팝업 기준 자리가 함께 바뀐다', () => {
    const { result } = renderHook(() => useQuickAddState());
    act(() => result.current.addAt(slotAt('10:00')));
    act(() => result.current.changeDraftRange({ start: 11 * 60, end: 13 * 60 + 30 }));
    expect(result.current.times).toEqual({ startDate: '2026-09-25', startTime: '11:00', endDate: '2026-09-25', endTime: '13:30' });
    expect(result.current.slot?.anchor).toEqual({ left: 60, right: 1000, top: 100 + 11 * 48, bottom: 100 + 13.5 * 48 });
  });

  it('입력이 없으면 다른 빈 시간으로 바로 옮기고, 있으면 확인을 기다린다 (Q7)', () => {
    const { result } = renderHook(() => useQuickAddState());
    act(() => result.current.addAt(slotAt('10:00')));
    const firstKey = result.current.key;
    act(() => result.current.addAt(slotAt('15:00')));
    expect(result.current.slot?.startTime).toBe('15:00');
    expect(result.current.key).not.toBe(firstKey);

    act(() => result.current.setDirty(true));
    act(() => result.current.addAt(slotAt('17:00')));
    expect(result.current.slot?.startTime).toBe('15:00');
    expect(result.current.pendingSlot?.startTime).toBe('17:00');
    act(() => result.current.discardAndMove());
    expect(result.current.slot?.startTime).toBe('17:00');
    expect(result.current.pendingSlot).toBeNull();
  });
});
