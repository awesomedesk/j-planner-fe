"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

import type { Category, Id, LocalDate, Schedule } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { getCategoryStripeColor } from '@components/category/utils/categoryUtils';
import { openDayView, selectDate, selectSelectedDate, selectViewDate } from '@store/slices/calendarSlice';
import { selectCategories } from '@store/slices/categorySlice';
import { showNotice } from '@store/slices/noticeSlice';
import { fetchSchedules, selectSchedules } from '@store/slices/scheduleSlice';

import ScheduleBar from '../common/ScheduleBar';
import {
  DEFAULT_WEEK_START,
  buildMonthGrid,
  formatDayTitle,
  getGridRange,
  getWeekdayLabels,
  schedulesOn,
  toLocalDate,
  type CalendarDay,
} from '../utils/calendarUtils';
import MoreSchedulesPopover from './MoreSchedulesPopover';

interface CalendarMonthlyProps {
  /** 막대(768px 이상) / 색 점(768px 미만, MO-01) */
  variant: 'bars' | 'dots';
  onOpenSchedule: (schedule: Schedule) => void;
  /** 모바일에서 날짜를 눌렀을 때 (아래 시트 열기, MO-01 ③) */
  onTapDate?: (date: LocalDate) => void;
}

/** 칸 안 높이 계산 (px): 위아래 여백 12, 날짜 줄 18, 막대 18 + 간격 3 */
const CELL_PADDING = 12;
const DATE_ROW = 18;
const BAR_SLOT = 21;
/** 모바일 칸 안 색 점 최대 개수 (화면기획서 MO-01) */
const MAX_DOTS = 3;

const WEEKDAY_COLOR: Record<number, string> = { 0: 'text-[#A6323F]', 6: 'text-[#2F62A8]' };

/**
 * CalendarMonthly - 월간 달력 (US-06, PC-01 · MO-01)
 * - 주차 열(CAL-05), 오늘 강조(CAL-06)
 * - PC·태블릿: 일정 막대, 칸을 넘으면 '+n 더보기'. 모바일: 카테고리 색 점
 * - 날짜를 한 번 누르면 그날 선택(사이드바·시트 기준), 두 번 누르면 일간으로 (D-015)
 * - Todo 요약·지난 미완료는 표시하지 않는다 (D-021). D-Day(US-23)·일기 펜(US-24)은 M3
 */
export default function CalendarMonthly({ variant, onOpenSchedule, onTapDate }: CalendarMonthlyProps) {
  const dispatch = useAppDispatch();
  const viewDate = useAppSelector(selectViewDate);
  const selectedDate = useAppSelector(selectSelectedDate);
  const schedules = useAppSelector(selectSchedules);
  const categories = useAppSelector(selectCategories);

  const [today] = useState(() => toLocalDate(new Date()));
  const weeks = useMemo(() => buildMonthGrid(viewDate, DEFAULT_WEEK_START, today), [viewDate, today]);
  const range = useMemo(() => getGridRange(weeks), [weeks]);
  const categoriesById = useMemo(() => new Map<Id, Category>(categories.map((c) => [c.id, c])), [categories]);

  // 보이는 기간의 일정 받기
  useEffect(() => {
    dispatch(fetchSchedules(range))
      .unwrap()
      .catch((message: string) => dispatch(showNotice(message, 'error')));
  }, [dispatch, range]);

  // 칸 높이에 맞춰 막대 몇 개까지 보일지
  const bodyRef = useRef<HTMLDivElement>(null);
  const [capacity, setCapacity] = useState(3);
  useEffect(() => {
    const element = bodyRef.current;
    if (!element || variant !== 'bars') return;
    const observer = new ResizeObserver(([entry]) => {
      const rowHeight = entry.contentRect.height / weeks.length;
      setCapacity(Math.max(1, Math.floor((rowHeight - CELL_PADDING - DATE_ROW) / BAR_SLOT)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [variant, weeks.length]);

  const [moreDate, setMoreDate] = useState<LocalDate | null>(null);

  const handleSelect = (date: LocalDate) => {
    dispatch(selectDate(date));
    onTapDate?.(date);
  };

  const isDots = variant === 'dots';
  const gridColumns = isDots ? 'grid-cols-[22px_repeat(7,minmax(0,1fr))]' : 'grid-cols-[40px_repeat(7,minmax(0,1fr))]';

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${isDots ? 'px-1.5' : ''}`} aria-label="월간 달력">
      <div className={`grid ${gridColumns} ${isDots ? '' : 'border-b border-tp-line'}`}>
        <div className={`text-center text-tp-muted ${isDots ? 'py-1 text-[10px]' : 'py-2 text-[11px]'}`}>{isDots ? '' : '주차'}</div>
        {getWeekdayLabels(DEFAULT_WEEK_START).map(({ label, weekday }) => (
          <div
            key={weekday}
            className={`text-center ${isDots ? 'py-1 text-[11px]' : 'py-2 text-xs font-semibold'} ${WEEKDAY_COLOR[weekday] ?? 'text-tp-muted'}`}
          >
            {label}
          </div>
        ))}
      </div>

      <div ref={bodyRef} className={`flex min-h-0 flex-1 flex-col ${isDots ? 'overflow-y-auto' : ''}`}>
        {weeks.map((week) => (
          <div key={week.weekNumber + week.days[0].date} className={`grid ${gridColumns} ${isDots ? '' : 'min-h-0 flex-1 border-b border-dashed border-tp-line'}`}>
            <div
              className={`flex justify-center bg-tp-theme2 font-bold text-[#26301F] ${isDots ? 'pt-[5px] text-[10px]' : 'pt-2 text-[11px]'}`}
              aria-label={`${week.weekNumber}주차`}
            >
              {week.weekNumber}
            </div>
            {week.days.map((day) => {
              const daySchedules = schedulesOn(schedules, day.date);
              return isDots ? (
                <DotCell
                  key={day.date}
                  day={day}
                  schedules={daySchedules}
                  categoriesById={categoriesById}
                  isSelected={day.date === selectedDate}
                  onSelect={handleSelect}
                />
              ) : (
                <BarCell
                  key={day.date}
                  day={day}
                  schedules={daySchedules}
                  categoriesById={categoriesById}
                  capacity={capacity}
                  isMoreOpen={moreDate === day.date}
                  onSelect={handleSelect}
                  onOpenDay={(date) => dispatch(openDayView(date))}
                  onOpenSchedule={onOpenSchedule}
                  onOpenMore={setMoreDate}
                  onCloseMore={() => setMoreDate(null)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 칸

function DateLabel({ day, compact }: { day: CalendarDay; compact: boolean }) {
  if (day.isToday) {
    return (
      <span className={`rounded-full bg-tp-primary font-bold text-tp-on-primary ${compact ? 'px-1.5 text-xs' : 'px-[7px] text-xs'}`}>
        {day.dayOfMonth}
      </span>
    );
  }
  return <span className={`text-xs font-semibold ${day.inMonth ? 'text-tp-text' : 'text-tp-muted opacity-70'}`}>{day.dayOfMonth}</span>;
}

/** 오늘 칸: 밝은 바탕 + 진한 테마색 테두리 (화면기획서 PC-01) */
const TODAY_CELL_STYLE = {
  backgroundColor: 'color-mix(in srgb, var(--tp-light) 60%, #FFFFFF)',
  boxShadow: 'inset 0 0 0 2px var(--tp-theme1)',
};

interface BarCellProps {
  day: CalendarDay;
  schedules: Schedule[];
  categoriesById: Map<Id, Category>;
  capacity: number;
  isMoreOpen: boolean;
  onSelect: (date: LocalDate) => void;
  onOpenDay: (date: LocalDate) => void;
  onOpenSchedule: (schedule: Schedule) => void;
  onOpenMore: (date: LocalDate) => void;
  onCloseMore: () => void;
}

function BarCell({ day, schedules, categoriesById, capacity, isMoreOpen, onSelect, onOpenDay, onOpenSchedule, onOpenMore, onCloseMore }: BarCellProps) {
  const overflow = schedules.length > capacity;
  const visible = overflow ? schedules.slice(0, Math.max(capacity - 1, 0)) : schedules;
  const hiddenCount = schedules.length - visible.length;

  return (
    <div
      className="relative flex min-h-0 min-w-0 cursor-pointer flex-col gap-[3px] border-l border-dashed border-tp-line p-1.5"
      style={day.isToday ? TODAY_CELL_STYLE : undefined}
      onClick={() => onSelect(day.date)}
      onDoubleClick={() => onOpenDay(day.date)}
    >
      <div className="flex h-[18px] shrink-0 items-center justify-between">
        <button
          type="button"
          aria-label={formatDayTitle(day.date)}
          aria-current={day.isToday ? 'date' : undefined}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(day.date);
          }}
        >
          <DateLabel day={day} compact={false} />
        </button>
      </div>
      {visible.map((schedule) => (
        <ScheduleBar
          key={schedule.id}
          schedule={schedule}
          date={day.date}
          category={categoriesById.get(schedule.categoryId) ?? null}
          onOpen={onOpenSchedule}
        />
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenMore(day.date);
          }}
          onDoubleClick={(event) => event.stopPropagation()}
          className="h-[18px] shrink-0 pl-0.5 text-left text-[11px] text-tp-muted hover:text-tp-text"
        >
          +{hiddenCount} 더보기
        </button>
      )}
      {isMoreOpen && (
        <MoreSchedulesPopover
          date={day.date}
          schedules={schedules}
          categoriesById={categoriesById}
          alignRight={day.weekday === 6 || day.weekday === 5}
          onOpen={(schedule) => {
            onCloseMore();
            onOpenSchedule(schedule);
          }}
          onClose={onCloseMore}
        />
      )}
    </div>
  );
}

interface DotCellProps {
  day: CalendarDay;
  schedules: Schedule[];
  categoriesById: Map<Id, Category>;
  isSelected: boolean;
  onSelect: (date: LocalDate) => void;
}

/** 모바일 칸: 날짜 + 그날 일정의 카테고리 색 점 (최대 3개, MO-01) */
function DotCell({ day, schedules, categoriesById, isSelected, onSelect }: DotCellProps) {
  const colors = Array.from(
    new Set(
      schedules.map((schedule) => {
        const category = categoriesById.get(schedule.categoryId);
        return category ? getCategoryStripeColor(category) : 'var(--tp-theme2)';
      })
    )
  ).slice(0, MAX_DOTS);

  return (
    <button
      type="button"
      aria-label={`${formatDayTitle(day.date)}${schedules.length ? `, 일정 ${schedules.length}개` : ''}`}
      aria-pressed={isSelected}
      onClick={() => onSelect(day.date)}
      className="flex min-h-[50px] flex-col items-center gap-[3px] border-t border-dashed border-tp-line px-0.5 pt-[3px]"
      style={day.isToday ? { backgroundColor: TODAY_CELL_STYLE.backgroundColor } : undefined}
    >
      <DateLabel day={day} compact />
      <span className="flex gap-0.5" aria-hidden="true">
        {colors.map((color) => (
          <span key={color} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        ))}
      </span>
    </button>
  );
}
