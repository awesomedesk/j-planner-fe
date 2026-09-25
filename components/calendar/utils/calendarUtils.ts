import { endOfMonth, endOfWeek, format, getWeek, parseISO, startOfMonth, startOfWeek, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';

import type { LocalDate, Schedule } from '@/types/api';

/**
 * 달력 공통 계산 (US-06~08). 날짜는 `YYYY-MM-DD` 문자열로 다루고,
 * 일정의 날짜·시간은 서버가 준 문자열 그대로 비교한다 (시간대 변환 없음, D-040).
 */

/** 주 시작 요일 (설정 weekStartDay, 기본 일요일 D-024). 설정 연결은 US-26 */
export type WeekStartDay = 'SUN' | 'MON';
export const DEFAULT_WEEK_START: WeekStartDay = 'SUN';

const weekStartsOn = (weekStart: WeekStartDay) => (weekStart === 'MON' ? 1 : 0);

export const toLocalDate = (date: Date): LocalDate => format(date, 'yyyy-MM-dd');
export const fromLocalDate = (value: LocalDate): Date => parseISO(value);

export interface CalendarDay {
  date: LocalDate;
  dayOfMonth: number;
  /** 0 = 일요일 … 6 = 토요일 */
  weekday: number;
  /** 보고 있는 달의 날짜인가 (앞뒤 달은 흐리게) */
  inMonth: boolean;
  isToday: boolean;
}

export interface CalendarWeek {
  /** 주차 (CAL-05). 1월 1일이 들어 있는 주가 1주차 */
  weekNumber: number;
  days: CalendarDay[];
}

/**
 * 월간 달력 칸 (첫 칸 ~ 마지막 칸, 4~6주)
 * @param anchor 보고 있는 달의 아무 날짜
 */
export const buildMonthGrid = (anchor: LocalDate, weekStart: WeekStartDay, today: LocalDate): CalendarWeek[] => {
  const options = { weekStartsOn: weekStartsOn(weekStart) } as const;
  const anchorDate = fromLocalDate(anchor);
  const month = anchorDate.getMonth();
  const first = startOfWeek(startOfMonth(anchorDate), options);
  const last = endOfWeek(endOfMonth(anchorDate), options);

  const weeks: CalendarWeek[] = [];
  for (let cursor = first; cursor <= last; cursor = addDays(cursor, 7)) {
    const days = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(cursor, i);
      const date = toLocalDate(day);
      return { date, dayOfMonth: day.getDate(), weekday: day.getDay(), inMonth: day.getMonth() === month, isToday: date === today };
    });
    weeks.push({ weekNumber: getWeek(cursor, { ...options, firstWeekContainsDate: 1 }), days });
  }
  return weeks;
};

/** 달력에 보이는 기간 → 일정 조회 from·to */
export const getGridRange = (weeks: CalendarWeek[]) => ({
  from: weeks[0].days[0].date,
  to: weeks[weeks.length - 1].days[6].date,
});

/** 요일 머리글 (주 시작 요일 순서) */
export const getWeekdayLabels = (weekStart: WeekStartDay) => {
  const labels = ['일', '월', '화', '수', '목', '금', '토'].map((label, weekday) => ({ label, weekday }));
  return weekStart === 'MON' ? [...labels.slice(1), labels[0]] : labels;
};

/** 헤더·시트 날짜 표시 */
export const formatMonthTitle = (date: LocalDate) => format(fromLocalDate(date), 'yyyy년 M월');
export const formatDayTitle = (date: LocalDate) => format(fromLocalDate(date), 'M월 d일 (EEE)', { locale: ko });

// ---------------------------------------------------------------- 일정 배치

const startDateOf = (schedule: Schedule) => schedule.start.slice(0, 10);

/**
 * 일정이 표시되는 마지막 날
 * 종료가 다음 날 00:00 정각이면 그날에는 보이지 않는다 (예: 22:00~24:00은 하루짜리)
 */
const lastDateOf = (schedule: Schedule) => {
  const endDate = schedule.end.slice(0, 10);
  const endsAtMidnight = !schedule.allDay && schedule.end.slice(11, 19) === '00:00:00' && endDate > startDateOf(schedule);
  return endsAtMidnight ? toLocalDate(addDays(fromLocalDate(endDate), -1)) : endDate;
};

export const isMultiDay = (schedule: Schedule) => lastDateOf(schedule) > startDateOf(schedule);

export const occursOn = (schedule: Schedule, date: LocalDate) => startDateOf(schedule) <= date && date <= lastDateOf(schedule);

/**
 * 그날 칸에 보일 일정과 순서
 * 종일·여러 날 일정 먼저, 그다음 시작 시각 순, 같으면 제목 순
 */
export const schedulesOn = (schedules: Schedule[], date: LocalDate) =>
  schedules
    .filter((s) => occursOn(s, date))
    .sort((a, b) => {
      const aLong = a.allDay || isMultiDay(a);
      const bLong = b.allDay || isMultiDay(b);
      if (aLong !== bLong) return aLong ? -1 : 1;
      return a.start.localeCompare(b.start) || a.title.localeCompare(b.title, 'ko');
    });

/** 막대 앞 시각 (`19:00`). 종일 일정이거나 시작한 날이 아니면 없음 */
export const barTimeLabel = (schedule: Schedule, date: LocalDate) =>
  schedule.allDay || startDateOf(schedule) !== date ? null : schedule.start.slice(11, 16);

/** 목록용 시간 글자: `10:00`, `종일`, 여러 날이면 시작 날이 아닌 날은 `계속` */
export const listTimeLabel = (schedule: Schedule, date: LocalDate) => {
  if (schedule.allDay) return '종일';
  return startDateOf(schedule) === date ? schedule.start.slice(11, 16) : '계속';
};

/**
 * 막대 몸통 색에 맞는 글자색 (D-019: 흰색/검은색 자동)
 * 색이 없으면(null) 테마 Theme2라 밝은 색 → 어두운 글자
 */
export const DARK_TEXT = '#26301F';
export const LIGHT_TEXT = '#FFFFFF';
export const readableTextColor = (hex: string | null) => {
  if (!hex) return DARK_TEXT;
  const value = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  const brightness = (r * 299 + g * 587 + b * 114) / 1000 / 255;
  return brightness > 0.6 ? DARK_TEXT : LIGHT_TEXT;
};
