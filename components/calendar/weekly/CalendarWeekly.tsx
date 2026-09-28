"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { Category, Id, Schedule } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { getCategoryStripeColor } from '@components/category/utils/categoryUtils';
import { openDayView, selectDate, selectSelectedDate, selectViewDate } from '@store/slices/calendarSlice';
import { selectCategories } from '@store/slices/categorySlice';
import { showNotice } from '@store/slices/noticeSlice';
import { fetchSchedules, selectScheduleRange, selectScheduleStatus, selectSchedules } from '@store/slices/scheduleSlice';

import { useScrollbarWidth } from '@utils/hooks/useScrollbarWidth';

import TimetableBlock from '../common/TimetableBlock';
import { DEFAULT_WEEK_START, formatDayTitle, readableTextColor, toLocalDate, type CalendarDay } from '../utils/calendarUtils';
import {
  DEFAULT_TIMETABLE_HOURS,
  allDaySchedulesOn,
  buildWeekDays,
  getHourLabels,
  getWeekRange,
  initialScrollTarget,
  layoutDayBlocks,
  nowLineMinutes,
} from '../utils/timetableUtils';

interface CalendarWeeklyProps {
  /** PC·태블릿(PC-02) / 모바일 7칸(MO-05) */
  variant: 'pc' | 'mobile';
  onOpenSchedule: (schedule: Schedule) => void;
}

/** 크기 (화면기획서 PC-02 · MO-05) */
const SIZE = {
  pc: { hourHeight: 46, timeColumn: 56, fontSize: 11 },
  mobile: { hourHeight: 38, timeColumn: 30, fontSize: 10 },
} as const;
/** 시간표 위 여백 (pt-2) */
const TOP_PADDING = 8;
/** 위쪽 맞춤일 때 눈금 글자(선보다 8px 위)가 잘리지 않게 남기는 여유 */
const LABEL_ROOM = 8;

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
/** 모바일 요일 글자색: 일요일 빨강, 토요일 파랑 (MO-05) */
const MOBILE_WEEKDAY_COLOR: Record<number, string> = { 0: 'text-[#A6323F]', 6: 'text-[#2F62A8]' };

const hhmm = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/**
 * CalendarWeekly - 주간 시간표 (US-07, PC-02 · MO-05)
 * - 7일 머리글(오늘 강조) + 종일 줄 + 시간표(항상 00:00~24:00을 그리고 스크롤, 1시간 간격, D-046)
 * - 현재 시각 선은 오늘 칸에만, 1분마다 갱신 (CAL-06)
 * - 처음 보이는 위치는 D-046 규칙 (오늘 있으면 현재 시각 가운데, 없으면 가장 이른 일정 위쪽)
 * - 겹치는 일정은 나란히, 시각 있는 여러 날 일정은 날마다 나눠서 (D-045)
 * - 날짜 머리글: 한 번 누르면 그날 선택, 두 번 누르면 일간 (월간과 같게, D-015·D-041)
 * - 빈 시간 눌러 빠른 추가(US-10)·Todo 블록(US-15)·D-Day(US-23)는 각 스토리에서 붙인다
 */
export default function CalendarWeekly({ variant, onOpenSchedule }: CalendarWeeklyProps) {
  const dispatch = useAppDispatch();
  const viewDate = useAppSelector(selectViewDate);
  const selectedDate = useAppSelector(selectSelectedDate);
  const schedules = useAppSelector(selectSchedules);
  const scheduleStatus = useAppSelector(selectScheduleStatus);
  const scheduleRange = useAppSelector(selectScheduleRange);
  const categories = useAppSelector(selectCategories);
  const categoriesById = useMemo(() => new Map<Id, Category>(categories.map((c) => [c.id, c])), [categories]);
  const size = SIZE[variant];
  const isMobile = variant === 'mobile';
  const hours = DEFAULT_TIMETABLE_HOURS;
  const hourLabels = getHourLabels(hours);

  // 현재 시각 (1분마다)
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const today = toLocalDate(now);

  const days = useMemo(() => buildWeekDays(viewDate, DEFAULT_WEEK_START, today), [viewDate, today]);
  const range = useMemo(() => getWeekRange(viewDate, DEFAULT_WEEK_START), [viewDate]);

  useEffect(() => {
    dispatch(fetchSchedules(range))
      .unwrap()
      .catch((message: string) => dispatch(showNotice(message, 'error')));
  }, [dispatch, range]);

  const nowMinutes = nowLineMinutes(now, hours);

  // 처음 보이는 위치 (D-046). 이 화면을 처음 그릴 때 한 번만 — 그 뒤 주를 옮겨도 보던 시간은 그대로
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollPlaced = useRef(false);
  const isRangeLoaded =
    scheduleRange?.from === range.from && scheduleRange?.to === range.to && (scheduleStatus === 'succeeded' || scheduleStatus === 'failed');
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element || isScrollPlaced.current) return;
    const hasToday = days.some((day) => day.isToday);
    // 오늘이 없으면 일정을 받은 뒤에 정한다
    if (!hasToday && !isRangeLoaded) return;
    const target = initialScrollTarget(days, scheduleStatus === 'succeeded' ? schedules : [], now);
    // 그 시각 선의 실제 위치 (위 여백 포함)
    const linePx = TOP_PADDING + (target.minutes / 60) * size.hourHeight;
    const maxScroll = Math.max(hourLabels.length * size.hourHeight + TOP_PADDING - element.clientHeight, 0);
    const wanted = target.align === 'center' ? linePx - element.clientHeight / 2 : linePx - LABEL_ROOM;
    element.scrollTop = Math.min(Math.max(wanted, 0), maxScroll);
    isScrollPlaced.current = true;
  });

  const gridColumns = { gridTemplateColumns: `${size.timeColumn}px repeat(7, minmax(0, 1fr))` };
  // 시간표 스크롤바 폭만큼 머리글·종일 줄도 비워 세로선을 맞춘다
  const scrollbarWidth = useScrollbarWidth(scrollRef);
  const headerStyle = { ...gridColumns, paddingRight: scrollbarWidth };

  const handleSelect = (day: CalendarDay) => dispatch(selectDate(day.date));

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${isMobile ? 'px-2' : ''}`} aria-label="주간 시간표">
      {/* 요일·날짜 머리글 */}
      <div className="grid border-b border-tp-line" style={headerStyle}>
        <div />
        {days.map((day) => {
          const isSelected = day.date === selectedDate && !day.isToday;
          return (
            <button
              key={day.date}
              type="button"
              aria-label={formatDayTitle(day.date)}
              aria-current={day.isToday ? 'date' : undefined}
              aria-pressed={day.date === selectedDate}
              onClick={() => handleSelect(day)}
              onDoubleClick={() => dispatch(openDayView(day.date))}
              className={`flex items-center justify-center rounded-md ${isMobile ? 'flex-col gap-px py-1' : 'gap-1 py-2'}`}
              style={isSelected ? { boxShadow: 'inset 0 0 0 2px var(--tp-theme2)' } : undefined}
            >
              <span className={isMobile ? `text-[10px] ${MOBILE_WEEKDAY_COLOR[day.weekday] ?? 'text-tp-muted'}` : 'text-xs text-tp-muted'}>
                {WEEKDAY_LABELS[day.weekday]}
              </span>
              <span
                className={`font-bold ${isMobile ? 'text-[13px]' : 'text-[15px]'} ${
                  day.isToday ? `rounded-full bg-tp-primary text-tp-on-primary ${isMobile ? 'px-[5px]' : 'px-2'}` : 'text-tp-text'
                }`}
              >
                {day.dayOfMonth}
              </span>
            </button>
          );
        })}
      </div>

      {/* 종일 줄 (PC-02 ⑤) */}
      <section aria-label="종일" className="grid border-b border-tp-line" style={{ ...headerStyle, minHeight: isMobile ? 24 : 32 }}>
        <div className={`flex items-center justify-center text-tp-muted ${isMobile ? 'text-[9px]' : 'text-[11px]'}`}>종일</div>
        {days.map((day) => (
          <div key={day.date} className={`flex min-w-0 flex-col gap-0.5 border-l border-tp-line ${isMobile ? 'p-0.5' : 'p-1'}`}>
            {allDaySchedulesOn(schedules, day.date).map((schedule) => {
              const category = categoriesById.get(schedule.categoryId);
              const stripe = category ? getCategoryStripeColor(category) : 'var(--tp-theme2)';
              return (
                <button
                  key={schedule.id}
                  type="button"
                  title={schedule.title}
                  onClick={() => onOpenSchedule(schedule)}
                  className={`truncate rounded text-left ${isMobile ? 'py-px pl-[11px] text-[9px] font-semibold' : 'py-0.5 pl-[11px] pr-1.5 text-[11px] font-medium'}`}
                  style={{
                    background: `linear-gradient(to right, ${stripe} 0 5px, ${schedule.color ?? 'var(--tp-theme2)'} 5px)`,
                    color: readableTextColor(schedule.color),
                  }}
                >
                  {schedule.title}
                </button>
              );
            })}
          </div>
        ))}
      </section>

      {/* 시간표 */}
      <div ref={scrollRef} data-testid="timetable-scroll" className="min-h-0 flex-1 overflow-y-auto pt-2">
        <div className="relative grid" style={{ ...gridColumns, height: hourLabels.length * size.hourHeight }}>
          {/* 시간 눈금 + 점선 */}
          <div className="pointer-events-none absolute inset-0">
            {hourLabels.map((label, i) => (
              <div key={label} className="absolute inset-x-0 border-t border-dashed border-tp-line" style={{ top: i * size.hourHeight }}>
                <span
                  className={`absolute -top-2 bg-tp-bg text-right text-tp-muted ${isMobile ? 'text-[9px]' : 'pr-2 text-[11px]'}`}
                  style={{ width: size.timeColumn - (isMobile ? 3 : 0) }}
                >
                  {isMobile ? String(Number(label.slice(0, 2))) : label}
                </span>
              </div>
            ))}
          </div>
          <div />
          {days.map((day) => (
            <div key={day.date} role="group" aria-label={`${formatDayTitle(day.date)} 시간표`} className="relative border-l border-tp-line">
              {layoutDayBlocks(schedules, day.date, hours).map((layout) => (
                <TimetableBlock
                  key={layout.schedule.id}
                  layout={layout}
                  category={categoriesById.get(layout.schedule.categoryId) ?? null}
                  hourHeight={size.hourHeight}
                  fontSize={size.fontSize}
                  onOpen={onOpenSchedule}
                  showLink={!isMobile}
                />
              ))}
              {day.isToday && nowMinutes !== null && (
                <div
                  role="separator"
                  aria-label={`현재 시각 ${hhmm(now)}`}
                  className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-danger"
                  style={{ top: `${(nowMinutes / 60) * size.hourHeight}px` }}
                >
                  {!isMobile && <span className="absolute -left-[5px] -top-[6px] h-2.5 w-2.5 rounded-full bg-danger" />}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
