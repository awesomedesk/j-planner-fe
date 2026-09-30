import { describe, expect, it } from 'vitest';

import { formatClock, formatDayTitle, formatMonthTitle, fromLocalDate, toLocalDate, weekStartsOn } from './dateUtils';

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
  });
});
