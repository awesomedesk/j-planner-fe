import type { Todo } from '@/types/api';

/** 박스 꼬리표: 기간 / 주간 / 월간 (하루는 없음, D-013) */
export const todoRowTag = (todo: Todo) => ({ DAY: null, PERIOD: '기간', WEEK: '주간', MONTH: '월간' })[todo.type];

const monthDay = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

/** 박스 오른쪽 글자: 시간이 있으면 시작 시각, 기간이면 '~마감일' (MO-10) */
export const todoRowTrailing = (todo: Todo) => {
  const parts = [todo.type === 'PERIOD' ? `~${monthDay(todo.endDate)}` : null, todo.time?.start ?? null].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
};


/** 끌어서 순서 바꾸기 계산 (US-14) — 목록 공통 규칙은 utils/list/reorder */
export { getDropAfterId, getInsertIndex, moveAfter as moveTodoAfter } from '@utils/list/reorder';
