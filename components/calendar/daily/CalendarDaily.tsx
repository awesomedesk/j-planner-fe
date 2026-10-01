"use client";

import { useMemo, useRef } from 'react';

import type { Schedule } from '@/types/api';
import { useAppSelector } from '@/app/hooks';
import { buildMobileDayTabs } from '@components/sidebar/sidebarItems';
import { selectViewDate } from '@store/slices/calendarSlice';
import { selectCategoriesById } from '@store/slices/categorySlice';

import { formatDayTitle, fromLocalDate, toLocalDate } from '@utils/date/dateUtils';
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
import type { CalendarDay } from '../utils/calendarUtils';
import {
  DEFAULT_TIMETABLE_HOURS,
  allDaySchedulesOn,
  getHourLabels,
  layoutDayBlocks,
  nowLineMinutes,
  type TimetableDraft,
} from '../utils/timetableUtils';

interface CalendarDailyProps {
  /** PC·태블릿(PC-03) / 모바일(MO-03) */
  variant: 'pc' | 'mobile';
  onOpenSchedule: (schedule: Schedule) => void;
  /** 빈 시간을 누름 → 빠른 추가 (US-10) */
  onAddAt?: (slot: TimetableSlot) => void;
  /** 빠른 추가 중 임시 블록 (D-017) */
  draft?: TimetableDraft | null;
  /** 화면 아래를 가리는 높이 (모바일 빠른 추가 시트). 임시 블록이 그 위로 보이게 스크롤한다 (MO-12) */
  coverBottom?: number;
}

/** 크기 (화면기획서 PC-03 · MO-03) */
const SIZE = {
  pc: { hourHeight: 48, timeColumn: 60, fontSize: 13 },
  mobile: { hourHeight: 46, timeColumn: 50, fontSize: 12 },
} as const;

/**
 * CalendarDaily - 일간 시간표 (US-08, PC-03 · MO-03)
 * - 맨 위 종일 줄 + 시간표(항상 00:00~24:00 스크롤, D-046) + 현재 시각 선(오늘일 때, CAL-06)
 * - PC 블록은 제목 + `일정 · 10:00-11:00 · 장소`, 시간표 폭 전체 (D-048). 모바일은 제목만
 * - 모바일 탭: 시간표 + 사이드바 항목(설정 순서, 끈 것 숨김), 좁으면 좌우 스크롤 (D-049)
 * - 세로 위치는 주간과 같은 규칙: 시간표끼리 바꾸면 보던 시간 유지, 월간에서 오면 처음 위치 (useTimetableScroll)
 * - 빈 시간을 누르면 빠른 추가 + 점선 임시 블록 (US-10, D-017)
 * - Todo 블록·시간 미지정 Todo 안내(US-15), D-Day(US-23)는 각 스토리에서
 */
export default function CalendarDaily({ variant, onOpenSchedule, onAddAt, draft, coverBottom = 0 }: CalendarDailyProps) {
  const viewDate = useAppSelector(selectViewDate);
  const categoriesById = useAppSelector(selectCategoriesById);
  const size = SIZE[variant];
  const isMobile = variant === 'mobile';
  const hours = DEFAULT_TIMETABLE_HOURS;
  const hourLabels = getHourLabels(hours);

  const now = useNow();
  const today = toLocalDate(now);

  const day: CalendarDay = useMemo(() => {
    const date = fromLocalDate(viewDate);
    return { date: viewDate, dayOfMonth: date.getDate(), weekday: date.getDay(), inMonth: true, isToday: viewDate === today };
  }, [viewDate, today]);
  const days = useMemo(() => [day], [day]);
  const range = useMemo(() => ({ from: viewDate, to: viewDate }), [viewDate]);

  const { schedules, isLoaded, loadedSchedules } = useScheduleRange(range);

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
  const scrollbarWidth = useScrollbarWidth(scrollRef);
  const handleSlotClick = useSlotClick(size.hourHeight, onAddAt);
  const draftRef = useRef<HTMLDivElement>(null);
  const dayDraft = draft?.date === viewDate ? draft : null;
  useRevealDraft(scrollRef, draftRef, dayDraft, coverBottom);

  const nowMinutes = day.isToday ? nowLineMinutes(now, hours) : null;
  const gridColumns = { gridTemplateColumns: `${size.timeColumn}px minmax(0, 1fr)` };
  const allDaySchedules = allDaySchedulesOn(schedules, viewDate);

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${isMobile ? 'px-3' : 'px-4 pt-4'}`} aria-label="일간 시간표">
      {isMobile ? (
        <div
          role="tablist"
          aria-label="일간 보기"
          data-swipe-ignore
          className="mb-2 flex shrink-0 gap-0.5 overflow-x-auto rounded-[10px] border border-tp-line bg-tp-panel p-[3px]"
        >
          {buildMobileDayTabs().map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={tab.key === 'TIMETABLE'}
              disabled={!tab.enabled}
              className={`min-w-[64px] flex-1 shrink-0 whitespace-nowrap rounded-[7px] px-2.5 py-[7px] text-[13px] disabled:opacity-40 ${
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
        <div className="flex min-w-0 flex-col gap-0.5 py-1">
          {allDaySchedules.map((schedule) => (
            <AllDayChip key={schedule.id} schedule={schedule} category={categoriesById.get(schedule.categoryId)} onOpen={onOpenSchedule} />
          ))}
        </div>
      </section>

      {/* 시간표 */}
      <div
        ref={scrollRef}
        data-testid="timetable-scroll"
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto pt-2"
        style={dayDraft && coverBottom ? { paddingBottom: coverBottom } : undefined}
      >
        <div className="relative grid" style={{ ...gridColumns, height: hourLabels.length * size.hourHeight }}>
          <HourLabels
            labels={hourLabels}
            hourHeight={size.hourHeight}
            width={size.timeColumn - 4}
            className={`pr-2 ${isMobile ? 'text-[10px]' : 'text-[11px]'}`}
          />
          <div />
          <div role="group" aria-label={`${formatDayTitle(viewDate)} 시간표`} className="relative" onClick={handleSlotClick(viewDate)}>
            <div className="relative h-full">
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
            {dayDraft && <DraftBlock ref={draftRef} draft={dayDraft} hourHeight={size.hourHeight} fontSize={size.fontSize} />}
            {nowMinutes !== null && <NowLine minutes={nowMinutes} hourHeight={size.hourHeight} now={now} />}
          </div>
        </div>
      </div>
    </div>
  );
}
