import { describe, expect, it } from 'vitest';

import { todo } from '@/test/fixtures';

import { getDropAfterId, getInsertIndex, moveTodoAfter, todoRowTag, todoRowTrailing } from './todoBoxUtils';

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

describe('끌어서 순서 바꾸기 계산 (US-14, TODO-09, D-030)', () => {
  const ids = [1, 2, 3, 4];

  it('afterId: 놓은 자리 바로 앞 항목. 맨 위면 null', () => {
    expect(getDropAfterId(ids, 4, 0)).toBeNull(); // 4를 맨 위로
    expect(getDropAfterId(ids, 1, 2)).toBe(3); // 1을 3 뒤로 → [2,3,1,4]
    expect(getDropAfterId(ids, 1, 3)).toBe(4); // 맨 아래
    expect(getDropAfterId(ids, 3, 1)).toBe(1); // 3을 1 뒤로 → [1,3,2,4]
  });

  it('제자리에 놓으면 undefined (요청하지 않는다)', () => {
    expect(getDropAfterId(ids, 2, 1)).toBeUndefined();
    expect(getDropAfterId(ids, 1, 0)).toBeUndefined();
    expect(getDropAfterId(ids, 9, 0)).toBeUndefined();
  });

  it('놓을 자리: 나머지 줄들의 가운데보다 아래에 있는 개수', () => {
    const others = [{ top: 0, height: 36 }, { top: 40, height: 36 }, { top: 80, height: 36 }];
    expect(getInsertIndex(others, -10)).toBe(0);
    expect(getInsertIndex(others, 17)).toBe(0);
    expect(getInsertIndex(others, 19)).toBe(1);
    expect(getInsertIndex(others, 70)).toBe(2);
    expect(getInsertIndex(others, 500)).toBe(3);
  });

  it('박스 목록을 바로 바꾼다: afterId 뒤로, null이면 맨 앞. 완료한 것도 그대로 둔다', () => {
    const items = [todo({ id: 1 }), todo({ id: 2, completed: true }), todo({ id: 3 }), todo({ id: 4 })];
    expect(moveTodoAfter(items, 4, 1).map((t) => t.id)).toEqual([1, 4, 2, 3]);
    expect(moveTodoAfter(items, 3, null).map((t) => t.id)).toEqual([3, 1, 2, 4]);
    expect(moveTodoAfter(items, 1, 4).map((t) => t.id)).toEqual([2, 3, 4, 1]);
  });
});
