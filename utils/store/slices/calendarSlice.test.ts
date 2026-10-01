import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeStore } from '@store/store';

import {
  goToday,
  moveView,
  openDayView,
  selectCategoryFilter,
  selectDate,
  setCategoryFilter,
  setTimetableTopMinutes,
  setViewMode,
} from './calendarSlice';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
});
afterEach(() => vi.useRealTimers());

describe('달력 상태', () => {
  it('처음: 월간(D-009), 오늘 기준', () => {
    expect(makeStore().getState().calendar).toEqual({
      viewMode: 'MONTH',
      viewDate: '2026-09-25',
      selectedDate: '2026-09-25',
      timetableTopMinutes: null,
      timetableScrollReset: 0,
      categoryFilter: null, // 처음엔 전체 (US-11)
    });
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
    expect(store.getState().calendar).toMatchObject({ viewMode: 'DAY', viewDate: '2026-09-30', selectedDate: '2026-09-30' });
  });
});

describe('시간표 보던 시간 (D-046 ②)', () => {
  const inWeek = (minutes: number) => {
    const store = makeStore();
    store.dispatch(setViewMode('WEEK'));
    store.dispatch(setTimetableTopMinutes(minutes));
    return store;
  };

  it('주 → 일로 바꿔도 보던 시간은 그대로', () => {
    const store = inWeek(480);
    store.dispatch(setViewMode('DAY'));
    expect(store.getState().calendar.timetableTopMinutes).toBe(480);
  });

  it('주간 머리글 두 번 눌러 일간으로 가도 그대로', () => {
    const store = inWeek(480);
    store.dispatch(openDayView('2026-09-23'));
    expect(store.getState().calendar.timetableTopMinutes).toBe(480);
  });

  it('월간으로 가면 잊는다 → 다음에 들어오면 처음 위치 규칙', () => {
    const store = inWeek(480);
    store.dispatch(setViewMode('MONTH'));
    expect(store.getState().calendar.timetableTopMinutes).toBeNull();
  });

  it('월간에서 두 번 눌러 일간으로 오면 처음 위치 규칙', () => {
    const store = makeStore();
    store.dispatch(setTimetableTopMinutes(480)); // 월간에서는 의미 없음
    store.dispatch(openDayView('2026-09-23'));
    expect(store.getState().calendar.timetableTopMinutes).toBeNull();
  });
});

describe('날짜 이동 (US-09)', () => {
  it('월간 ‹ ›: 한 달씩, 고른 날짜도 같이 (다음 보기 전환이 엉뚱한 달로 가지 않게)', () => {
    const store = makeStore();
    store.dispatch(moveView(1));
    expect(store.getState().calendar).toMatchObject({ viewDate: '2026-10-25', selectedDate: '2026-10-25' });
    store.dispatch(moveView(-1));
    store.dispatch(moveView(-1));
    expect(store.getState().calendar).toMatchObject({ viewDate: '2026-08-25', selectedDate: '2026-08-25' });
  });

  it('주간은 한 주, 일간은 하루', () => {
    const store = makeStore();
    store.dispatch(setViewMode('WEEK'));
    store.dispatch(moveView(1));
    expect(store.getState().calendar.viewDate).toBe('2026-10-02');
    store.dispatch(setViewMode('DAY'));
    store.dispatch(moveView(-1));
    expect(store.getState().calendar).toMatchObject({ viewDate: '2026-10-01', selectedDate: '2026-10-01' });
  });

  it('‹ ›로 옮겨도 시간표에서 보던 시간은 그대로 (D-046 ②)', () => {
    const store = makeStore();
    store.dispatch(setViewMode('WEEK'));
    store.dispatch(setTimetableTopMinutes(480));
    store.dispatch(moveView(1));
    expect(store.getState().calendar.timetableTopMinutes).toBe(480);
  });

  it("'오늘': 오늘로 돌아오고, 시간표는 처음 위치 규칙으로 다시 (현재 시각 가운데)", () => {
    const store = makeStore();
    store.dispatch(setViewMode('WEEK'));
    store.dispatch(moveView(3));
    store.dispatch(setTimetableTopMinutes(480));
    store.dispatch(goToday('2026-09-25'));
    expect(store.getState().calendar).toMatchObject({
      viewDate: '2026-09-25',
      selectedDate: '2026-09-25',
      timetableTopMinutes: null,
      timetableScrollReset: 1,
    });
  });
});

describe('카테고리 필터 (US-11)', () => {
  it('보기를 바꾸거나 날짜를 옮겨도 그대로 (월·주·일 같은 자리, D-015)', () => {
    const store = makeStore();
    store.dispatch(setCategoryFilter([2, 3]));
    store.dispatch(setViewMode('WEEK'));
    store.dispatch(moveView(1));
    expect(selectCategoryFilter(store.getState())).toEqual([2, 3]);
    store.dispatch(setCategoryFilter(null));
    expect(selectCategoryFilter(store.getState())).toBeNull();
  });
});
