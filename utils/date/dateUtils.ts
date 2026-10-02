import { addDays, addMonths, addWeeks, differenceInCalendarDays, endOfMonth, format, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';

import type { LocalDate } from '@/types/api';

/**
 * 날짜 기본 도구 — 화면·저장소 어디서나 쓴다
 * 날짜는 `YYYY-MM-DD` 문자열(LocalDate)로 다루고, 서버가 준 날짜·시간 문자열은 시간대 변환 없이 쓴다 (D-040).
 */

/** 주 시작 요일 (설정 weekStartDay, 기본 일요일 D-024). 설정 연결은 US-26 */
export type WeekStartDay = 'SUN' | 'MON';
export const DEFAULT_WEEK_START: WeekStartDay = 'SUN';

/** date-fns의 weekStartsOn 값 (0 = 일요일, 1 = 월요일) */
export const weekStartsOn = (weekStart: WeekStartDay): 0 | 1 => (weekStart === 'MON' ? 1 : 0);

export const toLocalDate = (date: Date): LocalDate => format(date, 'yyyy-MM-dd');
export const fromLocalDate = (value: LocalDate): Date => parseISO(value);

/** 날짜 이동 단위 (월간 한 달, 주간 한 주, 일간 하루 — US-09) */
export type DateStepUnit = 'month' | 'week' | 'day';

const ADD: Record<DateStepUnit, (date: Date, amount: number) => Date> = { month: addMonths, week: addWeeks, day: addDays };

/** 날짜를 단위만큼 옮긴다. 한 달씩 옮길 때 없는 날은 그달 마지막 날 (1/31 → 2/28) */
export const shiftDate = (date: LocalDate, unit: DateStepUnit, step: number): LocalDate =>
  toLocalDate(ADD[unit](fromLocalDate(date), step));

/** 두 날짜 사이 날 수 (to - from) */
export const daysBetween = (from: LocalDate, to: LocalDate) => differenceInCalendarDays(fromLocalDate(to), fromLocalDate(from));

/** 그 날이 들어 있는 주 (주 시작 요일 기준 7일, D-041) */
export const weekRangeOf = (date: LocalDate, weekStart: WeekStartDay) => {
  const first = startOfWeek(fromLocalDate(date), { weekStartsOn: weekStartsOn(weekStart) });
  return { from: toLocalDate(first), to: toLocalDate(addDays(first, 6)) };
};

/** 그 날이 들어 있는 달 (1일 ~ 말일) */
export const monthRangeOf = (date: LocalDate) => {
  const day = fromLocalDate(date);
  return { from: toLocalDate(startOfMonth(day)), to: toLocalDate(endOfMonth(day)) };
};

/** `2026년 9월` (월간 헤더) */
export const formatMonthTitle = (date: LocalDate) => format(fromLocalDate(date), 'yyyy년 M월');
/** `9월 25일 (금)` (일간 헤더, 사이드바·시트 머리) */
export const formatDayTitle = (date: LocalDate) => format(fromLocalDate(date), 'M월 d일 (EEE)', { locale: ko });
/** `9/24 (목)` — 좁은 자리용 날짜 (빠른 추가 PC-03) */
export const formatShortDay = (date: LocalDate) => format(fromLocalDate(date), 'M/d (EEE)', { locale: ko });

/** `14:30` (현재 시각 선) */
export const formatClock = (date: Date) => format(date, 'HH:mm');

/**
 * '지금 이후 가장 가까운 정각' (D-037). 정각이면 그 시각. 14:17 → 15:00
 * @returns 시(0~24). 24면 다음 날 00:00
 */
export const nextTopOfHour = (now: Date) => {
  const isExactHour = now.getMinutes() === 0 && now.getSeconds() === 0 && now.getMilliseconds() === 0;
  return isExactHour ? now.getHours() : now.getHours() + 1;
};
