import { describe, expect, it } from 'vitest';

import { formatClock, formatDayTitle, formatHourLabel, formatShortDay, formatTimeOfDay, monthRangeOf, weekRangeOf, formatMonthTitle, fromLocalDate, shiftDate, toLocalDate, weekStartsOn } from './dateUtils';

describe('날짜 기본 도구', () => {
  it('LocalDate ↔ Date (시간대 변환 없이, D-040)', () => {
    expect(toLocalDate(new Date(2026, 8, 25, 23, 59))).toBe('2026-09-25');
    expect(fromLocalDate('2026-09-25').getDate()).toBe(25);
  });

  it('주 시작 요일 → date-fns 값', () => {
    expect(weekStartsOn('SUN')).toBe(0);
    expect(weekStartsOn('MON')).toBe(1);
  });

  it('화면 글자: 2026년 9월 / 9월 25일 (금) / 09:05', () => {
    expect(formatMonthTitle('2026-09-25')).toBe('2026년 9월');
    expect(formatDayTitle('2026-09-25')).toBe('9월 25일 (금)');
    expect(formatClock(new Date(2026, 8, 25, 9, 5))).toBe('09:05');
    expect(formatShortDay('2026-09-24')).toBe('9/24 (목)'); // 빠른 추가 (PC-03)
  });
});

describe('날짜 옮기기 (US-09)', () => {
  it('하루·한 주씩, 달·해가 바뀌어도', () => {
    expect(shiftDate('2026-09-30', 'day', 1)).toBe('2026-10-01');
    expect(shiftDate('2026-09-25', 'week', -1)).toBe('2026-09-18');
    expect(shiftDate('2026-12-29', 'week', 1)).toBe('2027-01-05');
  });

  it('한 달씩: 없는 날은 그달 마지막 날로 (1/31 → 2/28)', () => {
    expect(shiftDate('2026-09-25', 'month', 1)).toBe('2026-10-25');
    expect(shiftDate('2027-01-31', 'month', 1)).toBe('2027-02-28');
    expect(shiftDate('2026-01-15', 'month', -1)).toBe('2025-12-15');
  });
});

describe('주·달 범위 (Todo 주간·월간 목표, 08-api-design 5절)', () => {
  it('그 날이 들어 있는 주: 주 시작 요일 기준 7일 (D-041)', () => {
    expect(weekRangeOf('2026-09-24', 'SUN')).toEqual({ from: '2026-09-20', to: '2026-09-26' });
    expect(weekRangeOf('2026-09-20', 'MON')).toEqual({ from: '2026-09-14', to: '2026-09-20' });
  });
  it('그 날이 들어 있는 달: 1일 ~ 말일 (윤년 2월 포함)', () => {
    expect(monthRangeOf('2026-09-24')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(monthRangeOf('2028-02-10')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });
});

describe('시간 표시 24시간 / 12시간 (US-26 SET-03, #396 v1.3.1)', () => {
  it('24시간은 그대로, 12시간은 오전/오후 h:mm', () => {
    expect(formatTimeOfDay('13:00', '24H')).toBe('13:00');
    expect(formatTimeOfDay('13:00', '12H')).toBe('오후 1:00');
    expect(formatTimeOfDay('00:30', '12H')).toBe('오전 12:30');
    expect(formatTimeOfDay('12:00', '12H')).toBe('오후 12:00');
    expect(formatTimeOfDay('09:05', '12H')).toBe('오전 9:05');
    expect(formatTimeOfDay('23:59', '12H')).toBe('오후 11:59');
  });

  it("시각이 아닌 글자('종일'·'계속')는 그대로", () => {
    expect(formatTimeOfDay('종일', '12H')).toBe('종일');
    expect(formatTimeOfDay('계속', '12H')).toBe('계속');
  });

  it('시간 눈금: PC는 오후 1:00, 좁은 모바일 눈금은 숫자만이고 0시·12시에만 오전·오후', () => {
    expect(formatHourLabel(13, '12H', false)).toBe('오후 1:00');
    expect(formatHourLabel(0, '12H', false)).toBe('오전 12:00');
    expect(formatHourLabel(0, '12H', true)).toBe('오전 12');
    expect(formatHourLabel(1, '12H', true)).toBe('1');
    expect(formatHourLabel(12, '12H', true)).toBe('오후 12');
    expect(formatHourLabel(13, '12H', true)).toBe('1');
    expect(formatHourLabel(13, '24H', true)).toBe('13');
    expect(formatHourLabel(13, '24H', false)).toBe('13:00');
  });
});
