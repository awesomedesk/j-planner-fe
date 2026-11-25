import type { Dday } from '@/types/api';

/** D-Day 한 개 (08 6절 리소스 모양). 기본은 남은 날 세기 + 목표 날짜만 */
export const ddayFixture = (overrides: Partial<Dday> & Pick<Dday, 'id'>): Dday => ({
  title: 'D-Day',
  targetDate: '2026-12-31',
  countType: 'COUNTDOWN',
  display: { interval: { enabled: false, days: 100 }, lastDays: { enabled: false, days: 7 }, daily: false, yearly: false },
  sortOrder: overrides.id,
  today: { value: -3, label: 'D-3' },
  ...overrides,
});
