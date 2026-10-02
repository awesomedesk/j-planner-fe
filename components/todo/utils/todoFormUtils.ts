import type { HexColor, Id, LocalDate, Todo, TodoCreateRequest, TodoType, TodoUpdateRequest } from '@/types/api';
import { ITEM_COLOR_OPTIONS } from '@components/theme/itemColorOptions';

import { daysBetween, monthRangeOf, nextTopOfHour, shiftDate, weekRangeOf, type WeekStartDay } from '@utils/date/dateUtils';

/**
 * Todo 입력 창(OV-02, MO-09)의 폼 값 ⇄ API 변환·검사 (US-12, 08-api-design 5절)
 * 종류별 날짜는 FE가 계산해서 보낸다 (서버는 검사만): 하루 = 그날, 기간 = 시작~마감, 주간 = 그 주 7일, 월간 = 1일~말일
 */

export const TODO_TITLE_MAX_LENGTH = 255;
/** Todo 색 선택지 (일정과 같음, D-030). null = 테마 Theme2 */
export const TODO_COLOR_OPTIONS = ITEM_COLOR_OPTIONS;
/** 시간을 켰을 때 기본 길이 (분) */
const DEFAULT_DURATION_MINUTES = 60;
const MINUTES_PER_DAY = 24 * 60;

export const TODO_TYPE_LABEL: Record<TodoType, string> = { DAY: '하루', PERIOD: '기간', WEEK: '주간 목표', MONTH: '월간 목표' };
/** 좁은 화면(모바일) 글자 (MO-09) */
export const TODO_TYPE_SHORT_LABEL: Record<TodoType, string> = { DAY: '하루', PERIOD: '기간', WEEK: '주간', MONTH: '월간' };
export const TODO_TYPES: TodoType[] = ['DAY', 'PERIOD', 'WEEK', 'MONTH'];

export interface TodoFormValues {
  title: string;
  type: TodoType;
  startDate: LocalDate;
  endDate: LocalDate;
  /** 시간 지정 → 시간표 블록 (TODO-10). 꺼도 아래 시각은 남겨 둔다 (다시 켜면 그대로) */
  hasTime: boolean;
  /** `HH:mm` */
  startTime: string;
  /** `HH:mm`. `00:00`은 그날 끝(자정) */
  endTime: string;
  /** null = 미지정 (서버가 미지정으로 넣음, D-014) */
  categoryId: Id | null;
  color: HexColor | null;
}

export type TodoFormField = keyof TodoFormValues;
export type TodoFormErrors = Partial<Record<TodoFormField, string>>;

const pad = (n: number) => String(n).padStart(2, '0');
const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const toClock = (minutes: number) => {
  const inDay = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${pad(Math.floor(inDay / 60))}:${pad(inDay % 60)}`;
};
/** 종료 시각까지 분. `00:00`은 자정(하루 끝) */
const endMinutes = (endTime: string) => (endTime === '00:00' ? MINUTES_PER_DAY : toMinutes(endTime));

// ---------------------------------------------------------------- 처음 값

/**
 * 새 Todo: 하루, 고른 날짜(D-015), 시간 없음
 * 시간을 켜면 '지금 이후 가장 가까운 정각'부터 1시간 (일정과 같게, D-037). 밤 11시대면 23:00~00:00
 */
export const createEmptyTodoValues = (baseDate: LocalDate, now: Date = new Date()): TodoFormValues => {
  const startHour = Math.min(nextTopOfHour(now), 23);
  return {
    title: '',
    type: 'DAY',
    startDate: baseDate,
    endDate: baseDate,
    hasTime: false,
    startTime: `${pad(startHour)}:00`,
    endTime: toClock(startHour * 60 + DEFAULT_DURATION_MINUTES),
    categoryId: null,
    color: null,
  };
};

/** 수정할 Todo → 폼 값. 시간이 없으면 시간 칸은 새 Todo와 같은 기본값 */
export const todoToFormValues = (todo: Todo, now: Date = new Date()): TodoFormValues => {
  const empty = createEmptyTodoValues(todo.startDate, now);
  return {
    title: todo.title,
    type: todo.type,
    startDate: todo.startDate,
    endDate: todo.endDate,
    hasTime: todo.time !== null,
    startTime: todo.time ? todo.time.start : empty.startTime,
    endTime: todo.time ? toClock(toMinutes(todo.time.start) + todo.time.durationMinutes) : empty.endTime,
    categoryId: todo.categoryId,
    color: todo.color,
  };
};

export const isTodoFormChanged = (initial: TodoFormValues, current: TodoFormValues) =>
  (Object.keys(initial) as TodoFormField[]).some((key) => initial[key] !== current[key]);

// ---------------------------------------------------------------- 종류·날짜

/** 기준 날짜를 종류 규칙에 맞춘 시작·끝 */
const rangeFor = (type: TodoType, date: LocalDate, weekStart: WeekStartDay) => {
  if (type === 'WEEK') return weekRangeOf(date, weekStart);
  if (type === 'MONTH') return monthRangeOf(date);
  return { from: date, to: date };
};

/** 종류를 바꾸면 시작일을 기준으로 날짜를 그 종류 규칙에 맞춘다 */
export const changeTodoType = (values: TodoFormValues, type: TodoType, weekStart: WeekStartDay): TodoFormValues => {
  const { from, to } = rangeFor(type, values.startDate, weekStart);
  return { ...values, type, startDate: from, endDate: to };
};

/**
 * 날짜 고르기 (하루·주간·월간은 고른 날이 들어 있는 날·주·달, 기간은 시작일)
 * 기간의 시작일을 바꾸면 길이를 유지해 마감일도 옮긴다
 */
export const setTodoDate = (values: TodoFormValues, date: LocalDate, weekStart: WeekStartDay): TodoFormValues => {
  if (values.type === 'PERIOD') {
    const length = Math.max(daysBetween(values.startDate, values.endDate), 0);
    return { ...values, startDate: date, endDate: shiftDate(date, 'day', length) };
  }
  const { from, to } = rangeFor(values.type, date, weekStart);
  return { ...values, startDate: from, endDate: to };
};

// ---------------------------------------------------------------- 검사

export const validateTodoForm = (values: TodoFormValues): TodoFormErrors => {
  const errors: TodoFormErrors = {};
  const title = values.title.trim();
  if (!title) errors.title = '제목을 입력하세요';
  else if (title.length > TODO_TITLE_MAX_LENGTH) errors.title = `제목은 ${TODO_TITLE_MAX_LENGTH}자까지 쓸 수 있어요`;

  if (!values.startDate) errors.startDate = '날짜를 고르세요';
  else if (values.type === 'PERIOD' && values.endDate < values.startDate) errors.endDate = '마감일이 시작일보다 빨라요';

  if (values.hasTime) {
    if (!values.startTime) errors.startTime = '시작 시간을 고르세요';
    else if (!values.endTime) errors.endTime = '종료 시간을 고르세요';
    else if (endMinutes(values.endTime) <= toMinutes(values.startTime)) errors.endTime = '종료가 시작보다 늦어야 해요';
  }
  return errors;
};

/** 서버 오류의 field 이름(API 필드) → 폼 칸 */
export const TODO_API_FIELD_TO_FORM_FIELD: Record<string, TodoFormField> = {
  title: 'title',
  type: 'type',
  startDate: 'startDate',
  endDate: 'endDate',
  time: 'startTime',
  'time.start': 'startTime',
  'time.durationMinutes': 'endTime',
  categoryId: 'categoryId',
  color: 'color',
};

// ---------------------------------------------------------------- 폼 값 → API 요청

const toTime = (values: TodoFormValues) =>
  values.hasTime ? { start: values.startTime, durationMinutes: endMinutes(values.endTime) - toMinutes(values.startTime) } : null;

export const toTodoCreateRequest = (values: TodoFormValues): TodoCreateRequest => ({
  title: values.title.trim(),
  type: values.type,
  startDate: values.startDate,
  endDate: values.endDate,
  time: toTime(values),
  ...(values.categoryId !== null ? { categoryId: values.categoryId } : {}),
  color: values.color,
});

const sameTime = (a: Todo['time'], b: Todo['time']) => a?.start === b?.start && a?.durationMinutes === b?.durationMinutes;

/**
 * 수정 요청: 바뀐 필드만 (JSON Merge Patch)
 * 종류·시작일·마감일은 하나라도 바뀌면 셋 다 보낸다. 안 바뀌면 보내지 않는다 → 예전 주간 Todo도 제목·색·시간은 고칠 수 있다 (D-042)
 */
export const toTodoUpdateRequest = (original: Todo, values: TodoFormValues): TodoUpdateRequest => {
  const next = toTodoCreateRequest(values);
  const patch: TodoUpdateRequest = {};
  if (next.title !== original.title) patch.title = next.title;
  if (next.type !== original.type || next.startDate !== original.startDate || next.endDate !== original.endDate) {
    Object.assign(patch, { type: next.type, startDate: next.startDate, endDate: next.endDate });
  }
  if (!sameTime(next.time ?? null, original.time)) patch.time = next.time ?? null;
  if (values.categoryId !== null && values.categoryId !== original.categoryId) patch.categoryId = values.categoryId;
  if ((next.color ?? null) !== original.color) patch.color = next.color ?? null;
  return patch;
};
