import { describe, expect, it } from 'vitest';

import { todo } from '@/test/fixtures';

import { getDropAfterId, getInsertIndex, isOverdueWarning, moveTodoAfter, todoRowTag, todoRowTrailing, todoShowTier, pickVisibleTodos, unscheduledOpenTodos } from './todoBoxUtils';

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

describe('지난 미완료 경고 (US-16, TODO-13, D-029)', () => {
  it('서버가 overdue로 준 미완료 Todo만 경고. 완료하면 경고 없음 (완료하거나 날짜를 바꿀 때까지)', () => {
    expect(isOverdueWarning(todo({ id: 1, overdue: true }))).toBe(true);
    expect(isOverdueWarning(todo({ id: 1, overdue: false }))).toBe(false);
    expect(isOverdueWarning(todo({ id: 1, overdue: true, completed: true }))).toBe(false);
  });
  it("오른쪽 글자는 마감일 'n/n 지남' (MO-10 캔버스 '9/22 지남')", () => {
    expect(todoRowTrailing(todo({ id: 1, endDate: '2026-09-22', overdue: true }))).toBe('9/22 지남');
    expect(todoRowTrailing(todo({ id: 1, type: 'PERIOD', startDate: '2026-09-01', endDate: '2026-09-10', overdue: true }))).toBe('9/10 지남');
    expect(
      todoRowTrailing(todo({ id: 1, endDate: '2026-10-02', time: { start: '07:00', durationMinutes: 30 }, overdue: true }))
    ).toBe('10/2 지남');
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

describe('시간 미지정 Todo (US-18, D-021 · PC-03 ⑧ · MO-03 ③)', () => {
  it('박스에서 시간 없음 + 미완료 + 그날이 범위 안인 것만, 박스 순서 그대로 (US-18 Q1)', () => {
    const todos = [
      todo({ id: 1, title: '기획서 초안', time: { start: '11:00', durationMinutes: 90 } }),
      todo({ id: 2, title: '장보기' }),
      todo({ id: 3, title: '물 2L', completed: true }),
      todo({ id: 4, title: '보고서 작성', type: 'PERIOD', startDate: '2026-09-21', endDate: '2026-09-30' }),
      todo({ id: 5, title: '지난 할 일', endDate: '2026-09-20', overdue: true }),
    ];
    expect(unscheduledOpenTodos(todos, '2026-09-25').map((t) => t.id)).toEqual([2, 4]);
  });
  it('오늘 박스의 지난 미완료는 빼기: 시간을 정해도 원래 날짜 시간표에 놓여 오늘 시간표엔 안 생김 (US-18 Q1, D-029)', () => {
    const overdue = todo({ id: 5, startDate: '2026-09-20', endDate: '2026-09-20', overdue: true });
    expect(unscheduledOpenTodos([overdue], '2026-09-25')).toEqual([]);
    expect(unscheduledOpenTodos([overdue], '2026-09-20')).toEqual([overdue]);
  });
  it('없으면 빈 목록', () => {
    expect(unscheduledOpenTodos([todo({ id: 1, time: { start: '09:00', durationMinutes: 30 } })], '2026-09-25')).toEqual([]);
  });
});

describe('PC 사이드바 박스 5개 + 더 보기 — 보일 것 고르기 (D-067)', () => {
  const D = '2026-09-25';
  it('우선순위 단계: ① 그날 시간 정한 것 ② 시간 없는 하루 ③ 진행 중 기간·주간·월간 ④ 지난 미완료(시간이 있어도) (D-067 Q5)', () => {
    expect(todoShowTier(todo({ id: 1, time: { start: '09:00', durationMinutes: 30 } }), D)).toBe(1);
    expect(todoShowTier(todo({ id: 2, type: 'WEEK', startDate: '2026-09-20', endDate: '2026-09-26', time: { start: '07:00', durationMinutes: 30 } }), D)).toBe(1);
    expect(todoShowTier(todo({ id: 3 }), D)).toBe(2);
    expect(todoShowTier(todo({ id: 4, type: 'PERIOD', startDate: '2026-09-21', endDate: '2026-09-30' }), D)).toBe(3);
    expect(todoShowTier(todo({ id: 5, type: 'MONTH', startDate: '2026-09-01', endDate: '2026-09-30' }), D)).toBe(3);
    expect(todoShowTier(todo({ id: 6, startDate: '2026-09-20', endDate: '2026-09-20', overdue: true }), D)).toBe(4);
    expect(todoShowTier(todo({ id: 7, startDate: '2026-09-20', endDate: '2026-09-20', time: { start: '09:00', durationMinutes: 30 }, overdue: true }), D)).toBe(4);
  });

  it('5개 이하면 모두 보이고 숨은 것 없음', () => {
    const todos = [1, 2, 3].map((id) => todo({ id }));
    expect(pickVisibleTodos(todos, D, 5)).toEqual({ visible: todos, hidden: [] });
  });

  it('우선순위로 5개를 고르되, 보이는 순서는 서버(끌어서 정한) 순서 그대로 (D-067, D-015)', () => {
    const todos = [
      todo({ id: 1, title: '지난 9/20', startDate: '2026-09-20', endDate: '2026-09-20', overdue: true }),
      todo({ id: 2, title: '월간', type: 'MONTH', startDate: '2026-09-01', endDate: '2026-09-30' }),
      todo({ id: 3, title: '하루 A' }),
      todo({ id: 4, title: '지난 9/23', startDate: '2026-09-23', endDate: '2026-09-23', overdue: true }),
      todo({ id: 5, title: '시간', time: { start: '11:00', durationMinutes: 60 } }),
      todo({ id: 6, title: '기간', type: 'PERIOD', startDate: '2026-09-21', endDate: '2026-09-30' }),
      todo({ id: 7, title: '하루 B' }),
      todo({ id: 8, title: '지난 9/23 둘째', startDate: '2026-09-22', endDate: '2026-09-23', type: 'PERIOD', overdue: true }),
    ];
    const { visible, hidden } = pickVisibleTodos(todos, D, 5);
    // ① 5 ② 3·7 ③ 2·6 → 5개 다 참. ④는 모두 숨김
    expect(visible.map((t) => t.id)).toEqual([2, 3, 5, 6, 7]);
    expect(hidden.map((t) => t.id)).toEqual([1, 4, 8]);
  });

  it('④ 지난 미완료끼리는 마감일이 최근인 것부터, 같으면 끈 순서 (D-067)', () => {
    const todos = [
      todo({ id: 1, title: '시간', time: { start: '11:00', durationMinutes: 60 } }),
      todo({ id: 2, startDate: '2026-09-20', endDate: '2026-09-20', overdue: true }),
      todo({ id: 3, startDate: '2026-09-23', endDate: '2026-09-23', overdue: true }),
      todo({ id: 4, startDate: '2026-09-22', endDate: '2026-09-22', overdue: true }),
      todo({ id: 5, startDate: '2026-09-23', endDate: '2026-09-23', overdue: true }),
      todo({ id: 6, startDate: '2026-09-24', endDate: '2026-09-24', overdue: true }),
      todo({ id: 7, startDate: '2026-09-10', endDate: '2026-09-10', overdue: true }),
    ];
    const { visible, hidden } = pickVisibleTodos(todos, D, 5);
    // ① 1 → ④ 6(9/24) · 3(9/23) · 5(9/23) · 4(9/22) 까지 5개. 보이는 순서는 서버 순서
    expect(visible.map((t) => t.id)).toEqual([1, 3, 4, 5, 6]);
    expect(hidden.map((t) => t.id)).toEqual([2, 7]);
  });
});
