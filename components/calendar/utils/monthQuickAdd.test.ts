import { describe, expect, it } from 'vitest';

import { monthDraftLabel, monthQuickAddTimes } from './monthQuickAdd';

const at = (h: number, m: number, s = 0) => new Date(2026, 8, 25, h, m, s);

describe('월간 빠른 추가 기본 시간 (D-110 · #367 대표님 최종 선택)', () => {
  it.each([
    [at(10, 20), '11:00', 60],
    [at(10, 0), '10:00', 60], // 정각이면 그 시각 (D-037 다음 정각 규칙 그대로)
    [at(0, 30), '01:00', 60],
    [at(22, 0, 1), '23:00', 60],
    [at(22, 59), '23:00', 60], // 22:59 → 23:00~다음 날 00:00
  ])('23시 전: 지금 다음 정각부터 1시간 (%s)', (now, startTime, durationMinutes) => {
    expect(monthQuickAddTimes(now)).toEqual({ startTime, durationMinutes });
  });

  it.each([at(23, 0), at(23, 15), at(23, 59, 59)])('23시대: 고른 날 23:00~23:59 고정, 59분 (%s)', (now) => {
    expect(monthQuickAddTimes(now)).toEqual({ startTime: '23:00', durationMinutes: 59 });
  });
});

describe('월간 점선 임시 표식 문구 (#367 4번)', () => {
  it('제목 · 시작-종료, 제목이 없으면 (제목 없음)', () => {
    expect(monthDraftLabel('회의', '11:00', '12:00')).toBe('회의 · 11:00-12:00');
    expect(monthDraftLabel('  ', '23:00', '23:59')).toBe('(제목 없음) · 23:00-23:59');
  });

  it("종료가 다음 날이면 '다음 날'을 붙인다 (#367 3번)", () => {
    expect(monthDraftLabel('야간', '23:00', '00:00')).toBe('야간 · 23:00-다음 날 00:00');
  });
});
