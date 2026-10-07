"use client";

import { useMemo, useRef, type ReactNode } from 'react';

import type { Schedule, Todo } from '@/types/api';
import type { MobileDayTabKey, SidebarItemType } from '@/types/calendar';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { buildMobileDayTabs } from '@components/sidebar/sidebarItems';
import { selectMobileDayTab, selectViewDate, setMobileDayTab } from '@store/slices/calendarSlice';
import { selectCategoriesById } from '@store/slices/categorySlice';

import { formatDayTitle, fromLocalDate, toLocalDate } from '@utils/date/dateUtils';
import { useNow } from '@utils/hooks/useNow';
import { useScrollbarWidth } from '@utils/hooks/useScrollbarWidth';

import AllDayRow from '../common/AllDayRow';
import DraftBlock from '../common/DraftBlock';
import HourLabels from '../common/HourLabels';
import NowLine from '../common/NowLine';
import TimetableBlock from '../common/TimetableBlock';
import TimetableTodoBlock from '../common/TimetableTodoBlock';
import { useRevealDraft, useTimetableQuickAdd, type TimetableSlot } from '../hooks/useQuickAddSlot';
import { useScheduleRange } from '../hooks/useScheduleRange';
import { useTimetableTodos } from '../hooks/useTimetableTodos';
import { useTimetableScroll } from '../hooks/useTimetableScroll';
import type { CalendarDay } from '../utils/calendarUtils';
import {
  DEFAULT_TIMETABLE_HOURS,
  getHourLabels,
  layoutDayBlocks,
  nowLineMinutes,
  type MinuteRange,
  type TimetableDraft,
} from '../utils/timetableUtils';

interface CalendarDailyProps {
  /** PC·태블릿(PC-03) / 모바일(MO-03) */
  variant: 'pc' | 'mobile';
  onOpenSchedule: (schedule: Schedule) => void;
  /** 시간표의 Todo 블록 제목을 누름 → Todo 수정 창 (US-15, US-12) */
  onOpenTodo?: (todo: Todo) => void;
  /** 빈 시간을 누름 → 빠른 추가 (US-10) */
  onAddAt?: (slot: TimetableSlot) => void;
  /** 빠른 추가 중 임시 블록 (D-017) */
  draft?: TimetableDraft | null;
  /** 임시 블록 손잡이·몸통을 끌어 시간을 바꿀 때 (D-053) */
  onDraftChange?: (range: MinuteRange) => void;
  /**
   * 모바일 일간 탭 내용 (US-25 연결 지점, D-049). 꽂은 탭만 눌리고, 고르면 시간표 대신 그 내용을 그린다.
   * 내용은 AppShell의 dayTabSlots 한 곳에서 꽂는다
   */
  tabContent?: Partial<Record<SidebarItemType, ReactNode>>;
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
 * - 시간 지정 Todo 블록(US-15)은 일정과 같이 칸을 나눈다. 시간 없는 Todo 놓기(US-18)·D-Day(US-23)는 각 스토리에서
 */
export default function CalendarDaily({ variant, onOpenSchedule, onOpenTodo = NO_OP, onAddAt, draft, onDraftChange, coverBottom = 0, tabContent }: CalendarDailyProps) {
  const dispatch = useAppDispatch();
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
  const todos = useTimetableTodos(range);

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
  const quickAdd = useTimetableQuickAdd({ hourHeight: size.hourHeight, enableDragCreate: !isMobile, onAddAt, draft, onDraftChange });
  const draftRef = useRef<HTMLDivElement>(null);
  const dayDraft = quickAdd.draftFor(viewDate);
  const visibleDraft = draft?.date === viewDate ? draft : null;
  useRevealDraft(scrollRef, draftRef, visibleDraft, coverBottom);

  const selectedTab = useAppSelector(selectMobileDayTab);
  const enabledTabs = useMemo(() => new Set(Object.keys(tabContent ?? {}) as SidebarItemType[]), [tabContent]);
  const tabs = buildMobileDayTabs(undefined, enabledTabs);
  // 고른 탭에 내용이 없으면(PC·내용을 뺀 경우) 시간표
  const activeTab: MobileDayTabKey = isMobile && selectedTab !== 'TIMETABLE' && tabContent?.[selectedTab] ? selectedTab : 'TIMETABLE';
  const activeTabLabel = tabs.find((tab) => tab.key === activeTab)?.label ?? '';

  const nowMinutes = day.isToday ? nowLineMinutes(now, hours) : null;
  const gridColumns = { gridTemplateColumns: `${size.timeColumn}px minmax(0, 1fr)` };

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${isMobile ? 'px-3' : 'px-4 pt-4'}`} aria-label="일간 시간표">
      {isMobile ? (
        <div
          role="tablist"
          aria-label="일간 보기"
          data-swipe-ignore
          className="mb-2 flex shrink-0 gap-0.5 overflow-x-auto rounded-[10px] border border-tp-line bg-tp-panel p-[3px]"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={tab.key === activeTab}
              disabled={!tab.enabled}
              onClick={() => dispatch(setMobileDayTab(tab.key))}
              className={`min-w-[64px] flex-1 shrink-0 whitespace-nowrap rounded-[7px] px-2.5 py-[7px] text-[13px] disabled:opacity-40 ${
                tab.key === activeTab ? 'bg-tp-primary font-semibold text-tp-on-primary' : 'font-medium text-tp-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : (
        <h2 className="mb-2 text-[15px] font-bold">시간표</h2>
      )}

      {activeTab !== 'TIMETABLE' && (
        <div role="tabpanel" aria-label={activeTabLabel} className="flex min-h-0 flex-1 flex-col">
          {tabContent?.[activeTab]}
        </div>
      )}

      {/* 시간표 탭: 다른 탭을 보는 동안에도 숨겨 두기만 한다 (돌아왔을 때 보던 시간 그대로) */}
      <div hidden={activeTab !== 'TIMETABLE'} className={`min-h-0 flex-1 flex-col ${activeTab === 'TIMETABLE' ? 'flex' : 'hidden'}`}>
        {/* 맨 위 종일 줄 (US-08 AC, D-052: 3줄 + n) */}
        <AllDayRow
          dates={[viewDate]}
          schedules={schedules}
          categoriesById={categoriesById}
          labelWidth={size.timeColumn}
          labelClassName="justify-end pr-2 text-[11px] text-tp-muted"
          paddingRight={scrollbarWidth}
          minHeight={isMobile ? 26 : 32}
          onOpen={onOpenSchedule}
        />

        {/* 시간표 */}
        <div
          ref={scrollRef}
          data-testid="timetable-scroll"
          onScroll={handleScroll}
          className="min-h-0 flex-1 overflow-y-auto pt-2"
          style={visibleDraft && coverBottom ? { paddingBottom: coverBottom } : undefined}
        >
          <div className="relative grid" style={{ ...gridColumns, height: hourLabels.length * size.hourHeight }}>
            <HourLabels
              labels={hourLabels}
              hourHeight={size.hourHeight}
              width={size.timeColumn - 4}
              className={`pr-2 ${isMobile ? 'text-[10px]' : 'text-[11px]'}`}
            />
            <div />
            <div role="group" aria-label={`${formatDayTitle(viewDate)} 시간표`} className="relative" {...quickAdd.columnProps(viewDate)}>
              <div className="relative h-full">
                {layoutDayBlocks(schedules, viewDate, hours, todos).map((layout) =>
                  layout.schedule ? (
                    <TimetableBlock
                      key={`s${layout.schedule.id}`}
                      layout={layout}
                      category={categoriesById.get(layout.schedule.categoryId) ?? null}
                      hourHeight={size.hourHeight}
                      fontSize={size.fontSize}
                      onOpen={onOpenSchedule}
                      showDetail={!isMobile}
                    />
                  ) : (
                    <TimetableTodoBlock
                      key={`t${layout.todo.id}-${layout.top}`}
                      layout={layout}
                      category={categoriesById.get(layout.todo.categoryId) ?? null}
                      hourHeight={size.hourHeight}
                      fontSize={size.fontSize}
                      onOpen={onOpenTodo}
                    />
                  )
                )}
              </div>
              {dayDraft && (
                <DraftBlock
                  ref={draftRef}
                  draft={dayDraft.draft}
                  hourHeight={size.hourHeight}
                  fontSize={size.fontSize}
                  onGripDown={dayDraft.isAdjustable ? quickAdd.startDrag : undefined}
                />
              )}
              {nowMinutes !== null && <NowLine minutes={nowMinutes} hourHeight={size.hourHeight} now={now} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const NO_OP = () => undefined;
