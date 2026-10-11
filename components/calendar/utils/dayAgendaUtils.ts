import type { LocalDate, Schedule, Todo } from '@/types/api';

import { isMultiDay, lastDateOf, occursOn, startDateOf } from './calendarUtils';
import { clockToMinutes, minutesToClock } from './timetableUtils';

/** 그날 일정 목록 한 줄 (US-17, MO-10 ③): 일정 또는 시간 지정 Todo + 시간 칸 두 줄 */
export type DayAgendaItem =
  | { kind: 'schedule'; schedule: Schedule; timeTop: string; timeBottom: string | null }
  | { kind: 'todo'; todo: Todo; timeTop: string; timeBottom: string };

const scheduleTimes = (schedule: Schedule, date: LocalDate) => {
  if (schedule.allDay) return { timeTop: '종일', timeBottom: null };
  const timeTop = startDateOf(schedule) === date ? schedule.start.slice(11, 16) : '계속';
  const timeBottom = lastDateOf(schedule) === date ? schedule.end.slice(11, 16) : null;
  return { timeTop, timeBottom };
};

/** 정렬 기준: 종일·여러 날 일정은 맨 위(-1), 나머지는 시작 시각(분) */
const sortKey = (item: DayAgendaItem) => {
  if (item.kind === 'todo') return clockToMinutes(item.todo.time!.start);
  const { schedule } = item;
  return schedule.allDay || isMultiDay(schedule) ? -1 : clockToMinutes(schedule.start.slice(11, 16));
};

/**
 * 그날 일정과 시간 지정 Todo를 한 목록으로 (US-17, D-022)
 * - 일정: 그날에 걸친 것. 종일은 '종일', 전날부터 이어지면 '계속', 그날 끝나면 끝 시각
 * - Todo: 시간이 있고 그날이 범위 안 (기간·주간·월간은 매일 같은 시각, D-027). 시간 칸은 시작~끝
 * - 순서: 종일·여러 날 일정(먼저 시작한 것부터) → 시작 시각. 같은 시각이면 일정 먼저, 그다음 제목
 */
export const dayAgendaItems = (schedules: Schedule[], todos: Todo[], date: LocalDate): DayAgendaItem[] => {
  const scheduleItems: DayAgendaItem[] = schedules
    .filter((schedule) => occursOn(schedule, date))
    .map((schedule) => ({ kind: 'schedule', schedule, ...scheduleTimes(schedule, date) }));
  const todoItems: DayAgendaItem[] = todos
    .filter((todo) => todo.time && todo.startDate <= date && date <= todo.endDate)
    .map((todo) => {
      const { start, durationMinutes } = todo.time!;
      return { kind: 'todo', todo, timeTop: start, timeBottom: minutesToClock((clockToMinutes(start) + durationMinutes) % 1440) };
    });
  const kindRank = (item: DayAgendaItem) => (item.kind === 'schedule' ? 0 : 1);
  const titleOf = (item: DayAgendaItem) => (item.kind === 'schedule' ? item.schedule.title : item.todo.title);
  /** 종일·여러 날 일정끼리는 먼저 시작한 것부터 */
  const startOf = (item: DayAgendaItem) => (item.kind === 'schedule' ? item.schedule.start : '');
  return [...scheduleItems, ...todoItems].sort(
    (a, b) =>
      sortKey(a) - sortKey(b) ||
      kindRank(a) - kindRank(b) ||
      startOf(a).localeCompare(startOf(b)) ||
      titleOf(a).localeCompare(titleOf(b), 'ko')
  );
};
