import { describe, expect, it } from 'vitest';

import { todo } from '@/test/fixtures';

import { todoRowTag, todoRowTrailing } from './todoBoxUtils';

describe('박스 한 줄 글자 (US-13, MO-10)', () => {
  it('꼬리표: 하루는 없음, 기간·주간·월간', () => {
    expect(todoRowTag(todo({ id: 1 }))).toBeNull();
    expect(todoRowTag(todo({ id: 1, type: 'PERIOD' }))).toBe('기간');
    expect(todoRowTag(todo({ id: 1, type: 'WEEK' }))).toBe('주간');
    expect(todoRowTag(todo({ id: 1, type: 'MONTH' }))).toBe('월간');
  });
  it('오른쪽: 기간이면 ~마감일, 시간이 있으면 시작 시각', () => {
    expect(todoRowTrailing(todo({ id: 1 }))).toBeNull();
    expect(todoRowTrailing(todo({ id: 1, time: { start: '11:00', durationMinutes: 60 } }))).toBe('11:00');
    expect(todoRowTrailing(todo({ id: 1, type: 'PERIOD', endDate: '2026-09-30' }))).toBe('~9/30');
    expect(todoRowTrailing(todo({ id: 1, type: 'PERIOD', endDate: '2026-10-02', time: { start: '07:00', durationMinutes: 30 } }))).toBe('~10/2 07:00');
  });
});
