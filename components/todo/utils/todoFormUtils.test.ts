import { describe, expect, it } from 'vitest';

import type { Todo } from '@/types/api';

import {
  changeTodoType,
  createEmptyTodoValues,
  setTodoDate,
  todoToFormValues,
  toTodoCreateRequest,
  toTodoUpdateRequest,
  validateTodoForm,
} from './todoFormUtils';

const NOW = new Date(2026, 8, 24, 14, 17); // 9/24(목) 14:17

const todo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 15,
  title: '기획서 초안',
  type: 'DAY',
  startDate: '2026-09-24',
  endDate: '2026-09-24',
  time: null,
  categoryId: 2,
  color: null,
  completed: false,
  completedAt: null,
  sortOrder: 7,
  overdue: false,
  ...overrides,
});

describe('새 Todo 처음 값 (US-12)', () => {
  it('하루, 고른 날짜, 시간 없음, 카테고리 미지정·색 없음 (D-014·D-030)', () => {
    expect(createEmptyTodoValues('2026-09-25', NOW)).toMatchObject({
      title: '',
      type: 'DAY',
      startDate: '2026-09-25',
      endDate: '2026-09-25',
      hasTime: false,
      categoryId: null,
      color: null,
    });
  });
  it('시간을 켜면 쓸 시각: 지금 이후 가장 가까운 정각부터 1시간 (D-037과 같게)', () => {
    expect(createEmptyTodoValues('2026-09-25', NOW)).toMatchObject({ startTime: '15:00', endTime: '16:00' });
    expect(createEmptyTodoValues('2026-09-25', new Date(2026, 8, 24, 23, 10))).toMatchObject({ startTime: '23:00', endTime: '00:00' });
  });
});

describe('종류 바꾸기 — 날짜를 종류 규칙에 맞춘다 (08-api-design 5절)', () => {
  const base = createEmptyTodoValues('2026-09-24', NOW);
  it('기간: 시작일 그대로, 마감일 = 시작일', () => {
    expect(changeTodoType(base, 'PERIOD', 'SUN')).toMatchObject({ type: 'PERIOD', startDate: '2026-09-24', endDate: '2026-09-24' });
  });
  it('주간 목표: 그 주 첫날 ~ +6일 (주 시작 요일 기준, D-041)', () => {
    expect(changeTodoType(base, 'WEEK', 'SUN')).toMatchObject({ startDate: '2026-09-20', endDate: '2026-09-26' });
    expect(changeTodoType(base, 'WEEK', 'MON')).toMatchObject({ startDate: '2026-09-21', endDate: '2026-09-27' });
  });
  it('월간 목표: 그달 1일 ~ 말일', () => {
    expect(changeTodoType(base, 'MONTH', 'SUN')).toMatchObject({ startDate: '2026-09-01', endDate: '2026-09-30' });
  });
  it('주간 → 하루: 그 주 첫날 하루', () => {
    const week = changeTodoType(base, 'WEEK', 'SUN');
    expect(changeTodoType(week, 'DAY', 'SUN')).toMatchObject({ startDate: '2026-09-20', endDate: '2026-09-20' });
  });
});

describe('날짜 고르기', () => {
  const base = createEmptyTodoValues('2026-09-24', NOW);
  it('하루: 그날', () => {
    expect(setTodoDate(base, '2026-10-02', 'SUN')).toMatchObject({ startDate: '2026-10-02', endDate: '2026-10-02' });
  });
  it('주간: 아무 날이나 고르면 그 주로', () => {
    expect(setTodoDate(changeTodoType(base, 'WEEK', 'SUN'), '2026-10-01', 'SUN')).toMatchObject({ startDate: '2026-09-27', endDate: '2026-10-03' });
  });
  it('월간: 그 달로', () => {
    expect(setTodoDate(changeTodoType(base, 'MONTH', 'SUN'), '2026-10-15', 'SUN')).toMatchObject({ startDate: '2026-10-01', endDate: '2026-10-31' });
  });
  it('기간: 시작일을 바꾸면 길이를 유지해 마감일도 옮긴다', () => {
    const period = { ...changeTodoType(base, 'PERIOD', 'SUN'), endDate: '2026-09-26' };
    expect(setTodoDate(period, '2026-10-01', 'SUN')).toMatchObject({ startDate: '2026-10-01', endDate: '2026-10-03' });
  });
});

describe('검사', () => {
  const base = { ...createEmptyTodoValues('2026-09-24', NOW), title: '보고서' };
  it('제목 필수, 255자까지', () => {
    expect(validateTodoForm({ ...base, title: '  ' }).title).toBe('제목을 입력하세요');
    expect(validateTodoForm({ ...base, title: 'a'.repeat(256) }).title).toBe('제목은 255자까지 쓸 수 있어요');
  });
  it('기간: 마감일이 시작일보다 빠르면 안 됨', () => {
    expect(validateTodoForm({ ...base, type: 'PERIOD', endDate: '2026-09-23' }).endDate).toBe('마감일이 시작일보다 빨라요');
  });
  it('시간: 종료가 시작보다 늦어야 함. 종료 00:00은 자정(그날 끝)', () => {
    expect(validateTodoForm({ ...base, hasTime: true, startTime: '11:00', endTime: '10:30' }).endTime).toBe('종료가 시작보다 늦어야 해요');
    expect(validateTodoForm({ ...base, hasTime: true, startTime: '23:00', endTime: '00:00' })).toEqual({});
  });
});

describe('API 요청 (08-api-design 5절)', () => {
  it('추가: 시간 없음 → time null, 카테고리 안 고르면 보내지 않음', () => {
    expect(toTodoCreateRequest({ ...createEmptyTodoValues('2026-09-24', NOW), title: ' 보고서 ' })).toEqual({
      title: '보고서',
      type: 'DAY',
      startDate: '2026-09-24',
      endDate: '2026-09-24',
      time: null,
      color: null,
    });
  });
  it('시간 있음 → { start, durationMinutes }, 00:00 종료는 자정까지', () => {
    const v = { ...createEmptyTodoValues('2026-09-24', NOW), title: 'a', hasTime: true, startTime: '11:00', endTime: '12:30', categoryId: 3 };
    expect(toTodoCreateRequest(v)).toMatchObject({ time: { start: '11:00', durationMinutes: 90 }, categoryId: 3 });
    expect(toTodoCreateRequest({ ...v, startTime: '23:00', endTime: '00:00' }).time).toEqual({ start: '23:00', durationMinutes: 60 });
  });
  it('Todo → 폼 값: 시간은 시작 + 길이로 종료 계산', () => {
    expect(todoToFormValues(todo({ time: { start: '11:00', durationMinutes: 90 } }), NOW)).toMatchObject({
      hasTime: true,
      startTime: '11:00',
      endTime: '12:30',
      categoryId: 2,
    });
  });
  it('수정: 바뀐 것만. 제목만 바꾸면 날짜는 보내지 않는다 (D-042 예전 주간 Todo)', () => {
    const old = todo({ type: 'WEEK', startDate: '2026-09-20', endDate: '2026-09-26' });
    const values = { ...todoToFormValues(old, NOW), title: '주간 회고' };
    expect(toTodoUpdateRequest(old, values)).toEqual({ title: '주간 회고' });
  });
  it('수정: 종류·날짜 중 하나라도 바뀌면 셋 다 보낸다', () => {
    const old = todo();
    const values = { ...todoToFormValues(old, NOW), startDate: '2026-09-25', endDate: '2026-09-25' };
    expect(toTodoUpdateRequest(old, values)).toEqual({ type: 'DAY', startDate: '2026-09-25', endDate: '2026-09-25' });
  });
  it('수정: 시간을 끄면 time: null, 바꾸면 새 시간', () => {
    const old = todo({ time: { start: '11:00', durationMinutes: 90 } });
    expect(toTodoUpdateRequest(old, { ...todoToFormValues(old, NOW), hasTime: false })).toEqual({ time: null });
    expect(toTodoUpdateRequest(old, { ...todoToFormValues(old, NOW), endTime: '13:00' })).toEqual({ time: { start: '11:00', durationMinutes: 120 } });
  });
});
