import { addDays, format, startOfWeek } from 'date-fns';

import type { LocalDate, Schedule } from '@/types/api';

import { occursOn, type CalendarDay } from './calendarUtils';
import { fromLocalDate, shiftDate, toLocalDate, weekStartsOn, type WeekStartDay } from '@utils/date/dateUtils';

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

/** `9/30 14:00` — 날짜가 다른 시작·끝을 보여 줄 때 */
const monthDayTime = (dateTime: string) => `${Number(dateTime.slice(5, 7))}/${Number(dateTime.slice(8, 10))} ${dateTime.slice(11, 16)}`;

/**
 * 블록 아래 설명 줄 (PC 일간, PC-03)
 * - 하루 안 일정: `일정 · 10:00-11:00 · 회의실 A`
 * - 날짜가 다르면 날짜를 붙인다: `일정 · 9/30 14:00 – 10/2 11:00` (시각만 쓰면 거꾸로 읽혀서, US-08 검수)
 */
export const blockDetailText = (schedule: Schedule) => {
  const sameDay = schedule.start.slice(0, 10) === schedule.end.slice(0, 10);
  const time = sameDay
    ? `${schedule.start.slice(11, 16)}-${schedule.end.slice(11, 16)}`
    : `${monthDayTime(schedule.start)} – ${monthDayTime(schedule.end)}`;
  return ['일정', time, schedule.location?.name].filter(Boolean).join(' · ');
};

const MINUTES_PER_DAY = 24 * 60;
const pad2 = (value: number) => String(value).padStart(2, '0');

/** 빠른 추가의 시각 단위 (분). 설정의 칸 간격과 관계없이 30분 (D-053) */
export const QUICK_ADD_SNAP_MINUTES = 30;

/**
 * 빈 시간 누른 자리(px, 시간표 맨 위 기준) → 시작 시각 `HH:mm` (US-10, D-053)
 * 30분 단위로 내림: 칸 위쪽 절반 → 정각, 아래쪽 절반 → 30분. 하루 끝을 넘지 않게 23:30까지
 */
export const slotStartTime = (offsetPx: number, hourHeight: number) => {
  const raw = Math.floor(((offsetPx / hourHeight) * 60) / QUICK_ADD_SNAP_MINUTES) * QUICK_ADD_SNAP_MINUTES;
  return minutesToClock(Math.min(Math.max(raw, 0), MINUTES_PER_DAY - QUICK_ADD_SNAP_MINUTES));
};

/** 0시부터 분 → `HH:mm` (하루를 넘으면 다음 날 시각) */
export const minutesToClock = (minutes: number) => {
  const inDay = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${pad2(Math.floor(inDay / 60))}:${pad2(inDay % 60)}`;
};

/** 빠른 추가 임시 블록 글자: `(제목 없음) · 14:00-15:00` (D-017, PC-03) */
export const draftBlockLabel = (title: string, startTime: string, endTime: string) =>
  `${title.trim() || '(제목 없음)'} · ${startTime}-${endTime}`;

/** 빠른 추가 중인 임시 블록 (US-10). 날짜는 누른 날, 시간·제목은 입력 중인 값 */
export interface TimetableDraft {
  date: LocalDate;
  startTime: string;
  endTime: string;
  title: string;
}

/** `HH:mm` → 0시부터 분 */
export const clockToMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

/** 임시 블록을 그릴 자리(분). 자정을 넘기면 하루 끝까지만 */
export const draftBlockMinutes = (draft: Pick<TimetableDraft, 'startTime' | 'endTime'>) => {
  const { start, end } = draftRange(draft);
  return { top: start, height: Math.max(Math.min(end, MINUTES_PER_DAY) - start, MIN_BLOCK_MINUTES) };
};

/** 임시 블록의 시작·끝 (0시부터 분). 끝이 1440 이상이면 다음 날 */
export interface MinuteRange {
  start: number;
  end: number;
}

const snap = (minutes: number, round: (n: number) => number = Math.round) =>
  round(minutes / QUICK_ADD_SNAP_MINUTES) * QUICK_ADD_SNAP_MINUTES;
const clampMinutes = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** 임시 블록 시각 → 분. 종료가 시작과 같거나 이르면 다음 날 */
export const draftRange = ({ startTime, endTime }: Pick<TimetableDraft, 'startTime' | 'endTime'>): MinuteRange => {
  const start = clockToMinutes(startTime);
  const end = clockToMinutes(endTime);
  return { start, end: end > start ? end : end + MINUTES_PER_DAY };
};

/** 분 → 입력 칸 값 (끝이 하루를 넘으면 종료 날짜는 다음 날) */
export const rangeToTimes = (date: LocalDate, { start, end }: MinuteRange) => ({
  startDate: date,
  startTime: minutesToClock(start),
  endDate: end >= MINUTES_PER_DAY ? shiftDate(date, 'day', 1) : date,
  endTime: minutesToClock(end),
});

/** 손잡이 끌기: 누른 곳에 가까운 30분으로. 길이는 30분 이상, 하루 안 (D-053) */
export const resizeDraftRange = (range: MinuteRange, edge: 'start' | 'end', pointerMinutes: number): MinuteRange =>
  edge === 'start'
    ? { ...range, start: clampMinutes(snap(pointerMinutes), 0, range.end - QUICK_ADD_SNAP_MINUTES) }
    : { ...range, end: clampMinutes(snap(pointerMinutes), range.start + QUICK_ADD_SNAP_MINUTES, MINUTES_PER_DAY) };

/** 몸통 끌기: 길이 그대로 30분 단위로 옮긴다. 하루 밖으로는 안 나감 (D-053) */
export const moveDraftRange = (range: MinuteRange, deltaMinutes: number): MinuteRange => {
  const length = range.end - range.start;
  const start = clampMinutes(range.start + snap(deltaMinutes), 0, MINUTES_PER_DAY - length);
  return { start, end: start + length };
};

/** PC 빈 시간을 누른 채 끌기: 위쪽 30분 내림 ~ 아래쪽 30분 올림, 30분 이상 (D-053) */
export const dragCreateRange = (fromMinutes: number, toMinutes: number): MinuteRange => {
  const start = clampMinutes(snap(Math.min(fromMinutes, toMinutes), Math.floor), 0, MINUTES_PER_DAY - QUICK_ADD_SNAP_MINUTES);
  const end = clampMinutes(snap(Math.max(fromMinutes, toMinutes), Math.ceil), start + QUICK_ADD_SNAP_MINUTES, MINUTES_PER_DAY);
  return { start, end };
};
