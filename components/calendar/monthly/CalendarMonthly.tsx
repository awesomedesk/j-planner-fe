"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';

import type { Category, Id, LocalDate, Schedule } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectDate, selectSelectedDate, selectViewDate } from '@store/slices/calendarSlice';
import { selectCategoriesById } from '@store/slices/categorySlice';

import { selectWeekStartDay } from '@store/slices/settingsSlice';
import { formatDayTitle, toLocalDate } from '@utils/date/dateUtils';
import { useNow } from '@utils/hooks/useNow';

import Icon from '@components/icons/LineIcon';

import DdayMarkChip from '../common/DdayMarkChip';
import ScheduleBar from '../common/ScheduleBar';
import { useDdayMarks } from '../hooks/useDdayMarks';
import { useDiaryMarks } from '../hooks/useDiaryMarks';
import type { TimetableSlot } from '../hooks/useQuickAddSlot';
import { useScheduleRange } from '../hooks/useScheduleRange';
import { monthDraftLabel, monthQuickAddTimes } from '../utils/monthQuickAdd';
import type { TimetableDraft } from '../utils/timetableUtils';
import { buildMonthGrid, getGridRange, getWeekdayLabels, schedulesOn, stripeColorOf, weekdayTextClass, type CalendarDay } from '../utils/calendarUtils';
import { ddayChipText, type DdayChipItem } from '../utils/ddayMarkUtils';
import MoreSchedulesPopover from './MoreSchedulesPopover';

interface CalendarMonthlyProps {
  /** 막대(768px 이상) / 색 점(768px 미만, MO-01) */
  variant: 'bars' | 'dots';
  onOpenSchedule: (schedule: Schedule) => void;
  /** 모바일에서 날짜를 눌렀을 때 (아래 시트 열기, MO-01 ③) */
  onTapDate?: (date: LocalDate) => void;
  /** D-Day 칩을 누름 → 그 D-Day 수정 창 (US-23) */
  onOpenDday?: (ddayId: Id) => void;
  /** 펜 아이콘을 누름 → 그날 일기 창 (US-24) */
  onOpenDiary?: (date: LocalDate) => void;
  /** PC·태블릿(막대)만: 빈 칸 두 번 누름 → 그날 빠른 추가 (D-110, #367) */
  onAddAt?: (slot: TimetableSlot) => void;
  /** 열려 있는 빠른 추가의 날짜. 열린 채 다른 날을 누르면 그 날로 옮기기 요청 */
  quickAddDate?: LocalDate | null;
  /** 빠른 추가 중 입력한 값 → 그 날짜 칸의 점선 임시 표식 */
  draft?: TimetableDraft | null;
}

/** 칸 안에서 누를 수 있는 것(날짜 번호·막대·링크·칩·펜·+n·더보기 창)은 빈 칸 두 번 누르기가 아니다 */
const INTERACTIVE = 'button, a, input, select, textarea, [role="dialog"], [data-draft]';

/** 칸 자리 = 빠른 추가 팝업이 가리지 않을 기준. 기본 시간은 누른 순간으로 한 번만 정한다 (D-110) */
const monthSlot = (date: LocalDate, cell: HTMLElement): TimetableSlot => {
  const { left, top, right, bottom } = cell.getBoundingClientRect();
  const anchor = { left, top, right, bottom };
  return { date, ...monthQuickAddTimes(new Date()), anchor, anchorFor: () => anchor };
};

/** 칸 안 높이 계산 (px): 위아래 여백 12, 날짜 줄 18, 막대 18 + 간격 3 */
const CELL_PADDING = 12;
const DATE_ROW = 18;
const BAR_SLOT = 21;
/** 모바일 칸 안 색 점 최대 개수 (화면기획서 MO-01) */
const MAX_DOTS = 3;

/**
 * CalendarMonthly - 월간 달력 (US-06, PC-01 · MO-01)
 * - 주차 열(CAL-05, ISO 주차), 오늘 강조(CAL-06), 고른 날짜 옅은 테두리 (D-041)
 * - PC·태블릿: 일정 막대, 칸을 넘으면 '+n 더보기'. 모바일: 카테고리 색 점
 * - 날짜를 한 번 누르면 그날 선택(사이드바·시트 기준). PC·태블릿에서 빈 칸을 두 번 누르면 그날 빠른 추가 (D-110, 일간은 보기 전환으로)
 *   칸 안의 버튼·링크·더보기 창을 두 번 눌러도 빠른 추가가 되지 않는다. 모바일(색 점)은 한 번 누르면 날짜 시트 그대로
 * - Todo 요약·지난 미완료는 표시하지 않는다 (D-021)
 * - 일기 펜(US-24): 일기를 쓴 날 칸 오른쪽 위 펜 버튼('9월 23일 일기') → 그날 일기 창. 내용은 칸에 없다. 모바일은 그림만 + 접근 이름 '일기 있음'
 * - D-Day(US-23): 칸 맨 위 `D-3 제목` 칩(서버 label 그대로, D-043). 막대와 함께 세어 '+n 더보기'. 모바일은 라벨만 + 접근 이름에 제목
 */
export default function CalendarMonthly({ variant, onOpenSchedule, onTapDate, onOpenDday, onOpenDiary, onAddAt, quickAddDate = null, draft = null }: CalendarMonthlyProps) {
  const dispatch = useAppDispatch();
  const viewDate = useAppSelector(selectViewDate);
  const selectedDate = useAppSelector(selectSelectedDate);

  const today = toLocalDate(useNow());
  const weekStart = useAppSelector(selectWeekStartDay);
  const weeks = useMemo(() => buildMonthGrid(viewDate, weekStart, today), [viewDate, weekStart, today]);
  const range = useMemo(() => getGridRange(weeks), [weeks]);
  const categoriesById = useAppSelector(selectCategoriesById);

  // 보이는 기간의 일정 받기
  const { schedules } = useScheduleRange(range);
  const ddayChips = useDdayMarks(range);
  const diaryDates = useDiaryMarks(range);

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
        {getWeekdayLabels(weekStart).map(({ label, weekday }) => (
          <div
            key={weekday}
            role="columnheader"
            className={`text-center ${isDots ? 'py-1 text-[11px]' : 'py-2 text-xs font-semibold'} ${weekdayTextClass(weekday) ?? 'text-tp-muted'}`}
          >
            {label}
          </div>
        ))}
      </div>

      <div ref={bodyRef} className={`flex min-h-0 flex-1 flex-col ${isDots ? 'overflow-y-auto' : ''}`}>
        {weeks.map((week) => (
          <div key={week.weekNumber + week.days[0].date} className={`grid ${gridColumns} ${isDots ? '' : 'min-h-0 flex-1 border-b border-dashed border-tp-line'}`}>
            <div
              className={`flex justify-center bg-tp-theme2 font-bold text-ink ${isDots ? 'pt-[5px] text-[10px]' : 'pt-2 text-[11px]'}`}
              aria-label={`${week.weekNumber}주차`}
            >
              {week.weekNumber}
            </div>
            {week.days.map((day) => {
              const daySchedules = schedulesOn(schedules, day.date);
              const dayChips = ddayChips.get(day.date) ?? NO_CHIPS;
              return isDots ? (
                <DotCell
                  key={day.date}
                  day={day}
                  schedules={daySchedules}
                  ddayChips={dayChips}
                  hasDiary={diaryDates.has(day.date)}
                  categoriesById={categoriesById}
                  isSelected={day.date === selectedDate}
                  onSelect={handleSelect}
                />
              ) : (
                <BarCell
                  key={day.date}
                  day={day}
                  schedules={daySchedules}
                  ddayChips={dayChips}
                  hasDiary={diaryDates.has(day.date)}
                  onOpenDiary={onOpenDiary}
                  categoriesById={categoriesById}
                  capacity={capacity}
                  isSelected={day.date === selectedDate}
                  isMoreOpen={moreDate === day.date}
                  onSelect={handleSelect}
                  onAddAt={onAddAt}
                  quickAddDate={quickAddDate}
                  draft={draft?.date === day.date ? draft : null}
                  onOpenSchedule={onOpenSchedule}
                  onOpenDday={onOpenDday}
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

const NO_CHIPS: DdayChipItem[] = [];

/** '9월 23일' (펜 버튼 이름, 06 월간 펜 아이콘) */
const shortDayLabel = (date: LocalDate) => {
  const [, month, dayOfMonth] = date.split('-').map(Number);
  return `${month}월 ${dayOfMonth}일`;
};

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

/** 고른 날짜(오늘이 아닌 날): 옅은 테두리 (D-041) */
const SELECTED_CELL_STYLE = {
  boxShadow: 'inset 0 0 0 2px var(--tp-theme2)',
};

const cellStyle = (day: CalendarDay, isSelected: boolean) =>
  day.isToday ? TODAY_CELL_STYLE : isSelected ? SELECTED_CELL_STYLE : undefined;

interface BarCellProps {
  day: CalendarDay;
  schedules: Schedule[];
  ddayChips: DdayChipItem[];
  hasDiary: boolean;
  onOpenDiary?: (date: LocalDate) => void;
  categoriesById: Map<Id, Category>;
  capacity: number;
  isSelected: boolean;
  isMoreOpen: boolean;
  onSelect: (date: LocalDate) => void;
  onAddAt?: (slot: TimetableSlot) => void;
  quickAddDate: LocalDate | null;
  draft: TimetableDraft | null;
  onOpenSchedule: (schedule: Schedule) => void;
  onOpenDday?: (ddayId: Id) => void;
  onOpenMore: (date: LocalDate) => void;
  onCloseMore: () => void;
}

function BarCell({ day, schedules, ddayChips, hasDiary, onOpenDiary, categoriesById, capacity, isSelected, isMoreOpen, onSelect, onAddAt, quickAddDate, draft, onOpenSchedule, onOpenDday, onOpenMore, onCloseMore }: BarCellProps) {
  /** 빠른 추가가 열린 채 다른 날을 누르면 그 날로 옮기기 (입력 중이면 AppShell이 '작성을 취소할까요?', D-053 Q7) */
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (onAddAt && quickAddDate && quickAddDate !== day.date) onAddAt(monthSlot(day.date, event.currentTarget));
    else onSelect(day.date);
  };
  const handleDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!onAddAt || (event.target as Element).closest(INTERACTIVE)) return;
    onAddAt(monthSlot(day.date, event.currentTarget));
  };
  // D-Day 칩이 먼저(맨 위), 그다음 일정 막대. 칸을 넘으면 둘을 함께 세어 '+n 더보기' (06 달력 표시)
  const total = ddayChips.length + schedules.length;
  const shownCount = total > capacity ? Math.max(capacity - 1, 0) : total;
  const visibleChips = ddayChips.slice(0, shownCount);
  const visible = schedules.slice(0, Math.max(shownCount - visibleChips.length, 0));
  const hiddenCount = total - visibleChips.length - visible.length;

  return (
    <div
      className="relative flex min-h-0 min-w-0 cursor-pointer flex-col gap-[3px] border-l border-dashed border-tp-line p-1.5"
      style={cellStyle(day, isSelected)}
      data-quick-add-slot
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
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
        {hasDiary && (
          <button
            type="button"
            aria-label={`${shortDayLabel(day.date)} 일기`}
            title="일기"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDiary?.(day.date);
            }}
            onDoubleClick={(event) => event.stopPropagation()}
            className="inline-flex h-[18px] w-[18px] items-center justify-center rounded text-tp-muted hover:bg-tp-secondary hover:text-tp-text"
          >
            <Icon name="diary" size={13} />
          </button>
        )}
      </div>
      {visibleChips.map((chip) => (
        <DdayMarkChip key={chip.key} chip={chip} onOpen={onOpenDday} />
      ))}
      {visible.map((schedule) => (
        <ScheduleBar
          key={schedule.id}
          schedule={schedule}
          date={day.date}
          category={categoriesById.get(schedule.categoryId) ?? null}
          onOpen={onOpenSchedule}
        />
      ))}
      {draft && (
        <div
          data-draft
          data-testid="month-quick-add-draft"
          className="h-[18px] shrink-0 truncate rounded border-2 border-dashed border-tp-primary bg-white px-1 text-[11px] font-semibold leading-[14px] text-ink"
        >
          {monthDraftLabel(draft.title, draft.startTime, draft.endTime)}
        </div>
      )}
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
          ddayChips={ddayChips}
          onOpenDday={(ddayId) => {
            onCloseMore();
            onOpenDday?.(ddayId);
          }}
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
  ddayChips: DdayChipItem[];
  hasDiary: boolean;
  categoriesById: Map<Id, Category>;
  isSelected: boolean;
  onSelect: (date: LocalDate) => void;
}

/**
 * 모바일 칸: 날짜 + 그날 일정의 카테고리 색 점 (최대 3개, MO-01)
 * D-Day는 좁아서 첫 라벨만 보이고, 날짜 버튼 접근 이름에 '라벨 제목'을 모두 넣는다 (06 달력 표시).
 * 칸 전체가 버튼이라 칩을 따로 누르지 않는다 — 누르면 날짜 시트 (제가 정한 부분)
 */
function DotCell({ day, schedules, ddayChips, hasDiary, categoriesById, isSelected, onSelect }: DotCellProps) {
  const colors = Array.from(
    new Set(
      schedules.map((schedule) => {
        const category = categoriesById.get(schedule.categoryId);
        return stripeColorOf(category);
      })
    )
  ).slice(0, MAX_DOTS);

  return (
    <button
      type="button"
      aria-label={[
        formatDayTitle(day.date),
        ...ddayChips.map(ddayChipText),
        ...(schedules.length ? [`일정 ${schedules.length}개`] : []),
        ...(hasDiary ? ['일기 있음'] : []),
      ].join(', ')}
      aria-pressed={isSelected}
      onClick={() => onSelect(day.date)}
      className="flex min-h-[50px] flex-col items-center gap-[3px] border-t border-dashed border-tp-line px-0.5 pt-[3px]"
      style={day.isToday ? { backgroundColor: TODAY_CELL_STYLE.backgroundColor } : isSelected ? SELECTED_CELL_STYLE : undefined}
    >
      <span className="relative inline-flex">
        <DateLabel day={day} compact />
        {hasDiary && (
          <span aria-hidden="true" className="absolute -right-2.5 -top-0.5 text-tp-muted">
            <Icon name="diary" size={9} />
          </span>
        )}
      </span>
      {ddayChips.length > 0 && (
        <span aria-hidden="true" className="max-w-full truncate rounded bg-tp-secondary px-0.5 text-[9px] font-bold leading-[13px] text-tp-on-secondary">
          {ddayChips[0].label}
          {ddayChips.length > 1 && ` +${ddayChips.length - 1}`}
        </span>
      )}
      <span className="flex gap-0.5" aria-hidden="true">
        {colors.map((color) => (
          <span key={color} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        ))}
      </span>
    </button>
  );
}
