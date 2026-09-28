"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

import type { Category, Id, Schedule } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { getCategoryStripeColor } from '@components/category/utils/categoryUtils';
import { selectViewDate } from '@store/slices/calendarSlice';
import { selectCategories } from '@store/slices/categorySlice';
import { showNotice } from '@store/slices/noticeSlice';
import { fetchSchedules, selectScheduleRange, selectScheduleStatus, selectSchedules } from '@store/slices/scheduleSlice';

import { useScrollbarWidth } from '@utils/hooks/useScrollbarWidth';

import TimetableBlock from '../common/TimetableBlock';
import { useTimetableScroll } from '../hooks/useTimetableScroll';
import { fromLocalDate, formatDayTitle, readableTextColor, toLocalDate, type CalendarDay } from '../utils/calendarUtils';
import { DEFAULT_TIMETABLE_HOURS, allDaySchedulesOn, getHourLabels, layoutDayBlocks, nowLineMinutes } from '../utils/timetableUtils';

interface CalendarDailyProps {
  /** PC·태블릿(PC-03) / 모바일(MO-03) */
  variant: 'pc' | 'mobile';
  onOpenSchedule: (schedule: Schedule) => void;
}

/** 크기 (화면기획서 PC-03 · MO-03) */
const SIZE = {
  pc: { hourHeight: 48, timeColumn: 60, fontSize: 13 },
  mobile: { hourHeight: 46, timeColumn: 50, fontSize: 12 },
} as const;
/** PC 블록 최대 폭 — 오른쪽은 빠른 추가 팝업(US-10)이 누른 시간을 가리지 않고 뜰 자리 (PC-03) */
const PC_BLOCK_MAX_WIDTH = 560;

/** 모바일 일간 탭 (MO-03, D-021). Todo(MO-10)는 M2, 일기(MO-11)는 M3에서 연다 */
const MOBILE_TABS = [
  { key: 'TIMETABLE', label: '시간표', enabled: true },
  { key: 'TODO', label: 'Todo', enabled: false },
  { key: 'DIARY', label: '일기', enabled: false },
] as const;

const hhmm = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/**
 * CalendarDaily - 일간 시간표 (US-08, PC-03 · MO-03)
 * - 맨 위 종일 줄 + 시간표(항상 00:00~24:00 스크롤, D-046) + 현재 시각 선(오늘일 때, CAL-06)
 * - PC 블록은 제목 + `일정 · 10:00-11:00 · 장소`, 모바일은 제목만
 * - 세로 위치는 주간과 같은 규칙: 시간표끼리 바꾸면 보던 시간 유지, 월간에서 오면 처음 위치 (useTimetableScroll)
 * - Todo 블록·시간 미지정 Todo 안내(US-15), D-Day(US-23), 빠른 추가(US-10), 모바일 '오늘'(US-09)은 각 스토리에서
 */
export default function CalendarDaily({ variant, onOpenSchedule }: CalendarDailyProps) {
  const dispatch = useAppDispatch();
  const viewDate = useAppSelector(selectViewDate);
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

  const day: CalendarDay = useMemo(() => {
    const date = fromLocalDate(viewDate);
    return { date: viewDate, dayOfMonth: date.getDate(), weekday: date.getDay(), inMonth: true, isToday: viewDate === today };
  }, [viewDate, today]);
  const days = useMemo(() => [day], [day]);
  const range = useMemo(() => ({ from: viewDate, to: viewDate }), [viewDate]);

  useEffect(() => {
    dispatch(fetchSchedules(range))
      .unwrap()
      .catch((message: string) => dispatch(showNotice(message, 'error')));
  }, [dispatch, range]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isRangeLoaded =
    scheduleRange?.from === range.from && scheduleRange?.to === range.to && (scheduleStatus === 'succeeded' || scheduleStatus === 'failed');
  const { handleScroll } = useTimetableScroll({
    scrollRef,
    days,
    schedules: scheduleStatus === 'succeeded' ? schedules : [],
    isLoaded: isRangeLoaded,
    hourHeight: size.hourHeight,
    hourCount: hourLabels.length,
    now,
  });
  const scrollbarWidth = useScrollbarWidth(scrollRef);

  const nowMinutes = day.isToday ? nowLineMinutes(now, hours) : null;
  const gridColumns = { gridTemplateColumns: `${size.timeColumn}px minmax(0, 1fr)` };
  const allDaySchedules = allDaySchedulesOn(schedules, viewDate);

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${isMobile ? 'px-3' : 'px-4 pt-4'}`} aria-label="일간 시간표">
      {isMobile ? (
        <div role="tablist" aria-label="일간 보기" className="mb-2 flex gap-0.5 rounded-[10px] border border-tp-line bg-tp-panel p-[3px]">
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={tab.key === 'TIMETABLE'}
              disabled={!tab.enabled}
              className={`flex-1 rounded-[7px] py-[7px] text-[13px] disabled:opacity-40 ${
                tab.key === 'TIMETABLE' ? 'bg-tp-primary font-semibold text-tp-on-primary' : 'font-medium text-tp-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : (
        <h2 className="mb-2 text-[15px] font-bold">시간표</h2>
      )}

      {/* 맨 위 종일 줄 (US-08 AC) */}
      <section
        aria-label="종일"
        className="grid border-b border-tp-line"
        style={{ ...gridColumns, paddingRight: scrollbarWidth, minHeight: isMobile ? 26 : 32 }}
      >
        <div className="flex items-center justify-end pr-2 text-[11px] text-tp-muted">종일</div>
        <div className="flex min-w-0 flex-col gap-0.5 py-1" style={isMobile ? undefined : { maxWidth: PC_BLOCK_MAX_WIDTH }}>
          {allDaySchedules.map((schedule) => {
            const category = categoriesById.get(schedule.categoryId);
            const stripe = category ? getCategoryStripeColor(category) : 'var(--tp-theme2)';
            return (
              <button
                key={schedule.id}
                type="button"
                title={schedule.title}
                onClick={() => onOpenSchedule(schedule)}
                className="truncate rounded py-0.5 pl-[11px] pr-1.5 text-left text-xs font-medium"
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
      </section>

      {/* 시간표 */}
      <div ref={scrollRef} data-testid="timetable-scroll" onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto pt-2">
        <div className="relative grid" style={{ ...gridColumns, height: hourLabels.length * size.hourHeight }}>
          <div className="pointer-events-none absolute inset-0">
            {hourLabels.map((label, i) => (
              <div key={label} className="absolute inset-x-0 border-t border-dashed border-tp-line" style={{ top: i * size.hourHeight }}>
                <span
                  className={`absolute -top-2 bg-tp-bg pr-2 text-right text-tp-muted ${isMobile ? 'text-[10px]' : 'text-[11px]'}`}
                  style={{ width: size.timeColumn - 4 }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div />
          <div role="group" aria-label={`${formatDayTitle(viewDate)} 시간표`} className="relative">
            <div className="relative h-full" style={isMobile ? undefined : { maxWidth: PC_BLOCK_MAX_WIDTH }}>
              {layoutDayBlocks(schedules, viewDate, hours).map((layout) => (
                <TimetableBlock
                  key={layout.schedule.id}
                  layout={layout}
                  category={categoriesById.get(layout.schedule.categoryId) ?? null}
                  hourHeight={size.hourHeight}
                  fontSize={size.fontSize}
                  onOpen={onOpenSchedule}
                  showDetail={!isMobile}
                />
              ))}
            </div>
            {nowMinutes !== null && (
              <div
                role="separator"
                aria-label={`현재 시각 ${hhmm(now)}`}
                className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-danger"
                style={{ top: `${(nowMinutes / 60) * size.hourHeight}px` }}
              >
                <span className="absolute -left-[5px] -top-[6px] h-2.5 w-2.5 rounded-full bg-danger" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
