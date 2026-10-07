import type { Todo } from '@/types/api';

/** 박스 꼬리표: 기간 / 주간 / 월간 (하루는 없음, D-013) */
export const todoRowTag = (todo: Todo) => ({ DAY: null, PERIOD: '기간', WEEK: '주간', MONTH: '월간' })[todo.type];

const monthDay = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

/**
 * 지난 미완료 경고 (US-16, TODO-13, D-029): 서버가 계산한 overdue(미완료 + 마감일이 오늘 전)를 그대로 쓴다.
 * 완료하면 바로 경고를 끈다 (응답을 기다리지 않음). 날짜를 바꾸면 다시 받은 값으로 풀린다
 */
export const isOverdueWarning = (todo: Todo) => todo.overdue && !todo.completed;

/**
 * 박스 오른쪽 글자 (MO-10)
 * - 지난 미완료: 마감일 'n/n 지남' 만 (캔버스 '9/22 지남', US-16)
 * - 그 밖: 기간이면 '~마감일', 시간이 있으면 시작 시각
 */
export const todoRowTrailing = (todo: Todo) => {
  if (isOverdueWarning(todo)) return `${monthDay(todo.endDate)} 지남`;
  const parts = [todo.type === 'PERIOD' ? `~${monthDay(todo.endDate)}` : null, todo.time?.start ?? null].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
};


/** 끌어서 순서 바꾸기 계산 (US-14) — 목록 공통 규칙은 utils/list/reorder */
export { getDropAfterId, getInsertIndex, moveAfter as moveTodoAfter } from '@utils/list/reorder';
