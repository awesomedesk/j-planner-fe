"use client";

import { useMemo, useRef } from 'react';

import type { Schedule } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { openDayView, selectDate, selectSelectedDate, selectViewDate } from '@store/slices/calendarSlice';
import { selectCategoriesById } from '@store/slices/categorySlice';

import { DEFAULT_WEEK_START, formatDayTitle, toLocalDate } from '@utils/date/dateUtils';
import { useNow } from '@utils/hooks/useNow';
import { useScrollbarWidth } from '@utils/hooks/useScrollbarWidth';

import AllDayChip from '../common/AllDayChip';
import DraftBlock from '../common/DraftBlock';
import HourLabels from '../common/HourLabels';
import NowLine from '../common/NowLine';
import TimetableBlock from '../common/TimetableBlock';
import { useRevealDraft, useSlotClick, type TimetableSlot } from '../hooks/useQuickAddSlot';
import { useScheduleRange } from '../hooks/useScheduleRange';
import { useTimetableScroll } from '../hooks/useTimetableScroll';
import { weekdayTextClass, type CalendarDay } from '../utils/calendarUtils';
import {
  DEFAULT_TIMETABLE_HOURS,
  allDaySchedulesOn,
  buildWeekDays,
  getHourLabels,
  getWeekRange,
  layoutDayBlocks,
  nowLineMinutes,
  type TimetableDraft,
} from '../utils/timetableUtils';

interface CalendarWeeklyProps {
  /** PC·태블릿(PC-02) / 모바일 7칸(MO-05) */
  variant: 'pc' | 'mobile';
  onOpenSchedule: (schedule: Schedule) => void;
  /** 빈 시간을 누름 → 빠른 추가 (US-10) */
  onAddAt?: (slot: TimetableSlot) => void;
  /** 빠른 추가 중 임시 블록 (D-017) */
  draft?: TimetableDraft | null;
  /** 화면 아래를 가리는 높이 (모바일 빠른 추가 시트). 임시 블록이 그 위로 보이게 스크롤한다 (MO-12) */
  coverBottom?: number;
}

/** 크기 (화면기획서 PC-02 · MO-05) */
const SIZE = {
  pc: { hourHeight: 46, timeColumn: 56, fontSize: 11 },
  mobile: { hourHeight: 38, timeColumn: 30, fontSize: 10 },
} as const;

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * CalendarWeekly - 주간 시간표 (US-07, PC-02 · MO-05)
 * - 7일 머리글(오늘 강조) + 종일 줄 + 시간표(항상 00:00~24:00을 그리고 스크롤, 1시간 간격, D-046)
 * - 현재 시각 선은 오늘 칸에만, 1분마다 갱신 (CAL-06)
 * - 세로 위치는 D-046 규칙 (시간표끼리 바꾸면 보던 시간 유지, 월간에서 오면 처음 위치) — useTimetableScroll
 * - 겹치는 일정은 나란히, 시각 있는 여러 날 일정은 날마다 나눠서 (D-045)
 * - 날짜 머리글: 한 번 누르면 그날 선택, 두 번 누르면 일간 (월간과 같게, D-015·D-041)
 * - 빈 시간을 누르면 빠른 추가 + 그날 칸에 점선 임시 블록 (US-10, D-017 · D-021)
 * - Todo 블록(US-15)·D-Day(US-23)는 각 스토리에서 붙인다
 */
export default function CalendarWeekly({ variant, onOpenSchedule, onAddAt, draft, coverBottom = 0 }: CalendarWeeklyProps) {
  const dispatch = useAppDispatch();
  const viewDate = useAppSelector(selectViewDate);
  const selectedDate = useAppSelector(selectSelectedDate);
  const categoriesById = useAppSelector(selectCategoriesById);
  const size = SIZE[variant];
  const isMobile = variant === 'mobile';
  const hours = DEFAULT_TIMETABLE_HOURS;
  const hourLabels = getHourLabels(hours);

  const now = useNow();
  const today = toLocalDate(now);

  const days = useMemo(() => buildWeekDays(viewDate, DEFAULT_WEEK_START, today), [viewDate, today]);
  const range = useMemo(() => getWeekRange(viewDate, DEFAULT_WEEK_START), [viewDate]);

  const { schedules, isLoaded, loadedSchedules } = useScheduleRange(range);

  const nowMinutes = nowLineMinutes(now, hours);

  // 세로 위치: 보던 시간 유지 또는 처음 위치 (D-046)
  const scrollRef = useRef<HTMLDivElement>(null);
  const { handleScroll } = useTimetableScroll({
    scrollRef,
    days,
    schedules: loadedSchedules,
    isLoaded,
    hourHeight: size.hourHeight,
    hourCount: hourLabels.length,
    now,
  });

  const gridColumns = { gridTemplateColumns: `${size.timeColumn}px repeat(7, minmax(0, 1fr))` };
  // 시간표 스크롤바 폭만큼 머리글·종일 줄도 비워 세로선을 맞춘다
  const scrollbarWidth = useScrollbarWidth(scrollRef);
  const headerStyle = { ...gridColumns, paddingRight: scrollbarWidth };

  const handleSelect = (day: CalendarDay) => dispatch(selectDate(day.date));
  const handleSlotClick = useSlotClick(size.hourHeight, onAddAt);
  const draftRef = useRef<HTMLDivElement>(null);
  const weekDraft = draft && days.some((day) => day.date === draft.date) ? draft : null;
  useRevealDraft(scrollRef, draftRef, weekDraft, coverBottom);

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
              <span className={isMobile ? `text-[10px] ${weekdayTextClass(day.weekday) ?? 'text-tp-muted'}` : 'text-xs text-tp-muted'}>
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
          <div
            key={day.date}
            role="group"
            aria-label={`${formatDayTitle(day.date)} 종일`}
            className={`flex min-w-0 flex-col gap-0.5 border-l border-tp-line ${isMobile ? 'p-0.5' : 'p-1'}`}
          >
            {allDaySchedulesOn(schedules, day.date).map((schedule) => (
              <AllDayChip
                key={schedule.id}
                schedule={schedule}
                category={categoriesById.get(schedule.categoryId)}
                compact={isMobile}
                onOpen={onOpenSchedule}
              />
            ))}
          </div>
        ))}
      </section>

      {/* 시간표 */}
      <div
        ref={scrollRef}
        data-testid="timetable-scroll"
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto pt-2"
        style={weekDraft && coverBottom ? { paddingBottom: coverBottom } : undefined}
      >
        <div className="relative grid" style={{ ...gridColumns, height: hourLabels.length * size.hourHeight }}>
          <HourLabels
            labels={hourLabels}
            hourHeight={size.hourHeight}
            width={size.timeColumn - (isMobile ? 3 : 0)}
            hourOnly={isMobile}
            className={isMobile ? 'text-[9px]' : 'pr-2 text-[11px]'}
          />
          <div />
          {days.map((day) => (
            <div
              key={day.date}
              role="group"
              aria-label={`${formatDayTitle(day.date)} 시간표`}
              className="relative border-l border-tp-line"
              onClick={handleSlotClick(day.date)}
            >
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
              {weekDraft?.date === day.date && (
                <DraftBlock ref={draftRef} draft={weekDraft} hourHeight={size.hourHeight} fontSize={size.fontSize} />
              )}
              {day.isToday && nowMinutes !== null && (
                <NowLine minutes={nowMinutes} hourHeight={size.hourHeight} now={now} showDot={!isMobile} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
