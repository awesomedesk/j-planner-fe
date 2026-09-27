import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeStore } from '@store/store';

import { openDayView, selectDate, setViewMode } from './calendarSlice';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
});
afterEach(() => vi.useRealTimers());

describe('달력 상태', () => {
  it('처음: 월간(D-009), 오늘 기준', () => {
    expect(makeStore().getState().calendar).toEqual({ viewMode: 'MONTH', viewDate: '2026-09-25', selectedDate: '2026-09-25' });
  });

  it('날짜를 고르면 선택만 바뀌고 보고 있는 달은 그대로', () => {
    const store = makeStore();
    store.dispatch(selectDate('2026-10-02'));
    expect(store.getState().calendar).toMatchObject({ viewDate: '2026-09-25', selectedDate: '2026-10-02' });
  });

  it('보기를 바꾸면 고른 날짜가 들어 있는 주·날을 본다 (US-07)', () => {
    const store = makeStore();
    store.dispatch(selectDate('2026-10-02'));
    store.dispatch(setViewMode('WEEK'));
    expect(store.getState().calendar).toMatchObject({ viewMode: 'WEEK', viewDate: '2026-10-02' });
  });

  it('두 번 누르면 그날 일간 (D-015)', () => {
    const store = makeStore();
    store.dispatch(openDayView('2026-09-30'));
    expect(store.getState().calendar).toEqual({ viewMode: 'DAY', viewDate: '2026-09-30', selectedDate: '2026-09-30' });
  });
});
