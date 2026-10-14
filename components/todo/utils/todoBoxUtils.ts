import type { LocalDate, Todo } from '@/types/api';

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

/**
 * 시간 미지정 Todo (US-18, PC-03 ⑧ · MO-03 ③): 그날 박스에서 시간이 없고 아직 안 끝냈고 그날이 범위 안인 것, 박스 순서 그대로.
 * 오늘 박스에 함께 오는 지난 미완료(D-029)는 뺀다 — 시간을 정해도 원래 날짜에 놓여 이 시간표에는 블록이 생기지 않으므로
 */
export const unscheduledOpenTodos = (todos: Todo[], date: LocalDate) =>
  todos.filter((t) => t.time === null && !t.completed && t.startDate <= date && date <= t.endDate);

/**
 * PC 사이드바 박스에서 먼저 보일 순서 단계 (D-067). 기준은 박스 날짜
 * ① 그날 시간을 정한 Todo(종류 상관없음) → ② 시간 없는 하루 → ③ 시간 없는 진행 중 기간·주간·월간 → ④ 지난 미완료(시간이 있어도)
 */
export const todoShowTier = (todo: Todo, date: LocalDate): 1 | 2 | 3 | 4 => {
  if (todo.endDate < date) return 4;
  if (todo.time !== null) return 1;
  return todo.type === 'DAY' ? 2 : 3;
};

/**
 * 미완료 목록(서버 순서)에서 보일 것 `limit`개 고르기 (D-067)
 * - 단계 순, ④는 마감일이 최근인 것부터, 같으면 서버(끌어서 정한) 순서
 * - 고른 것은 서버 순서 그대로 보인다 (D-015·D-030). 우선순위는 '무엇을 보일지'만
 */
export const pickVisibleTodos = (open: Todo[], date: LocalDate, limit: number) => {
  if (open.length <= limit) return { visible: open, hidden: [] as Todo[] };
  const ranked = open
    .map((todo, index) => ({ todo, index, tier: todoShowTier(todo, date) }))
    .sort((a, b) => a.tier - b.tier || (a.tier === 4 ? b.todo.endDate.localeCompare(a.todo.endDate) : 0) || a.index - b.index);
  const shown = new Set(ranked.slice(0, limit).map((r) => r.todo.id));
  return { visible: open.filter((t) => shown.has(t.id)), hidden: open.filter((t) => !shown.has(t.id)) };
};

/** 끌어서 순서 바꾸기 계산 (US-14) — 목록 공통 규칙은 utils/list/reorder */
export { getDropAfterId, getInsertIndex, moveAfter as moveTodoAfter } from '@utils/list/reorder';
