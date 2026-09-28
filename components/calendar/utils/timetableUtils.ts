import { addDays, format, startOfWeek } from 'date-fns';

import type { LocalDate, Schedule } from '@/types/api';

import { fromLocalDate, occursOn, toLocalDate, type CalendarDay, type WeekStartDay } from './calendarUtils';

/**
 * 시간표(주간·일간) 계산 (US-07, US-08)
 * 위치·높이는 모두 "표시 시작 시각부터의 분"으로 계산하고, 화면에서 1시간 높이(px)를 곱한다.
 */

/** 그리는 시간. 시간표는 항상 00:00 ~ 24:00 전체를 그리고 세로로 스크롤한다 (D-046, 설정의 '표시 시간' 없음) */
export interface TimetableHours {
  startHour: number;
  endHour: number;
}
export const DEFAULT_TIMETABLE_HOURS: TimetableHours = { startHour: 0, endHour: 24 };

/** 아주 짧은 일정도 제목이 보이도록 하는 최소 높이 (분) */
export const MIN_BLOCK_MINUTES = 20;

export interface DateRange {
  from: LocalDate;
  to: LocalDate;
}

const weekStartsOn = (weekStart: WeekStartDay) => (weekStart === 'MON' ? 1 : 0);

/** 기준 날짜가 들어 있는 한 주 (주 시작 요일 기준) */
export const getWeekRange = (anchor: LocalDate, weekStart: WeekStartDay): DateRange => {
  const first = startOfWeek(fromLocalDate(anchor), { weekStartsOn: weekStartsOn(weekStart) });
  return { from: toLocalDate(first), to: toLocalDate(addDays(first, 6)) };
};

/** 주간 7일 칸 */
export const buildWeekDays = (anchor: LocalDate, weekStart: WeekStartDay, today: LocalDate): CalendarDay[] => {
  const first = fromLocalDate(getWeekRange(anchor, weekStart).from);
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(first, i);
    const date = toLocalDate(day);
    return { date, dayOfMonth: day.getDate(), weekday: day.getDay(), inMonth: true, isToday: date === today };
  });
};

/** 헤더 제목: `9월 20일 – 26일`, 달이 바뀌면 `9월 27일 – 10월 3일`, 해가 바뀌면 연도까지 */
export const formatWeekTitle = ({ from, to }: DateRange) => {
  const start = fromLocalDate(from);
  const end = fromLocalDate(to);
  if (start.getFullYear() !== end.getFullYear()) return `${format(start, 'yyyy년 M월 d일')} – ${format(end, 'yyyy년 M월 d일')}`;
  if (start.getMonth() !== end.getMonth()) return `${format(start, 'M월 d일')} – ${format(end, 'M월 d일')}`;
  return `${format(start, 'M월 d일')} – ${format(end, 'd일')}`;
};

/** 시간 눈금 글자 (`06:00` …) */
export const getHourLabels = ({ startHour, endHour }: TimetableHours) =>
  Array.from({ length: endHour - startHour }, (_, i) => `${String(startHour + i).padStart(2, '0')}:00`);

/** 종일 줄에 놓을 일정 (종일 일정만, 걸친 날마다) */
export const allDaySchedulesOn = (schedules: Schedule[], date: LocalDate) =>
  schedules
    .filter((s) => s.allDay && occursOn(s, date))
    .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title, 'ko'));

export interface TimetableBlockLayout {
  schedule: Schedule;
  /** 표시 시작부터의 분 */
  top: number;
  /** 분 (최소 MIN_BLOCK_MINUTES) */
  height: number;
  /** 겹치는 일정끼리 나눈 칸 번호 / 칸 수 */
  column: number;
  columns: number;
  /** 전날부터 이어짐 / 다음 날로 이어짐 */
  continuesBefore: boolean;
  continuesAfter: boolean;
}

/** `YYYY-MM-DDTHH:mm:ss` → 그날 0시부터의 분 (날짜가 다르면 앞뒤 날로 넘침) */
const minutesFromDayStart = (dateTime: string, date: LocalDate) => {
  const dayDiff = Math.round((fromLocalDate(dateTime.slice(0, 10)).getTime() - fromLocalDate(date).getTime()) / 86_400_000);
  return dayDiff * 1440 + Number(dateTime.slice(11, 13)) * 60 + Number(dateTime.slice(14, 16));
};

/**
 * 그날 시간표 블록 배치
 * - 종일 일정은 빼고(종일 줄), 자정을 넘거나 여러 날인 일정은 그날 부분만 (D-045)
 * - 겹치는 일정은 칸을 나눠 나란히 둔다 (먼저 시작한 일정이 왼쪽, 빈 칸은 다시 쓴다)
 */
export const layoutDayBlocks = (schedules: Schedule[], date: LocalDate, hours: TimetableHours): TimetableBlockLayout[] => {
  const rangeStart = hours.startHour * 60;
  const rangeEnd = hours.endHour * 60;
  const total = rangeEnd - rangeStart;

  const segments = schedules
    .filter((s) => !s.allDay && occursOn(s, date))
    .map((schedule) => {
      const start = minutesFromDayStart(schedule.start, date);
      const end = minutesFromDayStart(schedule.end, date);
      const dayStart = Math.max(start, 0, rangeStart);
      const dayEnd = Math.min(end, 1440, rangeEnd);
      const height = Math.max(dayEnd - dayStart, MIN_BLOCK_MINUTES);
      // 끝에 붙은 짧은 일정도 칸 안에 들어오게
      const top = Math.min(dayStart - rangeStart, total - height);
      return { schedule, top, height, continuesBefore: start < 0, continuesAfter: end > 1440 };
    })
    .sort((a, b) => a.top - b.top || b.height - a.height || a.schedule.title.localeCompare(b.schedule.title, 'ko'));

  // 서로 이어서 겹치는 묶음마다 칸을 나눈다
  const result: TimetableBlockLayout[] = [];
  let group: (typeof segments[number] & { column: number })[] = [];
  let groupEnd = -1;
  const flush = () => {
    const columns = Math.max(0, ...group.map((g) => g.column)) + 1;
    group.forEach((g) => result.push({ ...g, columns }));
    group = [];
  };
  for (const segment of segments) {
    if (group.length && segment.top >= groupEnd) flush();
    const columnEnds: number[] = [];
    group.forEach((g) => (columnEnds[g.column] = Math.max(columnEnds[g.column] ?? 0, g.top + g.height)));
    let column = columnEnds.findIndex((end) => end <= segment.top);
    if (column === -1) column = columnEnds.length;
    group.push({ ...segment, column });
    groupEnd = Math.max(groupEnd, segment.top + segment.height);
  }
  if (group.length) flush();
  return result;
};

/** 현재 시각 선 위치 (그리는 시작부터의 분). 그리는 시간 밖이면 null */
export const nowLineMinutes = (now: Date, { startHour, endHour }: TimetableHours) => {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < startHour * 60 || minutes >= endHour * 60) return null;
  return minutes - startHour * 60;
};

/**
 * 처음 보이는 위치 (D-046) — 시간이 없는 화면(월간)에서 들어오거나 처음 열 때
 * 1. 보이는 날짜에 오늘이 있으면 현재 시각을 가운데
 * 2. 오늘이 없고 시각 있는 일정이 있으면 가장 이른 일정을 위쪽에 (1시간 여유). 종일 일정은 제외
 * 3. 일정도 없으면 현재 시각을 가운데
 * 가운데로 못 오면 스크롤 끝까지만 — px로 바꿀 때 화면에서 맞춘다
 */
export interface ScrollTarget {
  /** 00:00부터의 분 */
  minutes: number;
  align: 'center' | 'top';
}
const EARLIEST_MARGIN_MINUTES = 60;
export const initialScrollTarget = (days: CalendarDay[], schedules: Schedule[], now: Date): ScrollTarget => {
  const nowTarget: ScrollTarget = { minutes: now.getHours() * 60 + now.getMinutes(), align: 'center' };
  if (days.some((day) => day.isToday)) return nowTarget;
  const tops = days.flatMap((day) => layoutDayBlocks(schedules, day.date, DEFAULT_TIMETABLE_HOURS).map((block) => block.top));
  if (!tops.length) return nowTarget;
  return { minutes: Math.max(Math.min(...tops) - EARLIEST_MARGIN_MINUTES, 0), align: 'top' };
};

/** 블록 높이(px)에 들어가는 제목 줄 수 (D-023: 줄바꿈 후 칸이 부족하면 '…') */
const LINE_HEIGHT_RATIO = 1.25;
const BLOCK_VERTICAL_PADDING = 4;
export const lineClampFor = (heightPx: number, fontSizePx: number) =>
  Math.max(1, Math.floor((heightPx - BLOCK_VERTICAL_PADDING) / (fontSizePx * LINE_HEIGHT_RATIO)));
