"use client";

import { useMemo } from 'react';

import type { Id, Schedule } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { openDayView, selectViewDate } from '@store/slices/calendarSlice';
import { DEFAULT_WEEK_START, formatDayTitle, toLocalDate } from '@utils/date/dateUtils';
import { useNow } from '@utils/hooks/useNow';

import AgendaRows from '../common/AgendaRows';
import DdayMarkChip from '../common/DdayMarkChip';
import { useDdayMarks } from '../hooks/useDdayMarks';
import { useScheduleRange } from '../hooks/useScheduleRange';
import { useTimetableTodos } from '../hooks/useTimetableTodos';
import { weekdayTextClass } from '../utils/calendarUtils';
import { dayAgendaItems } from '../utils/dayAgendaUtils';
import { buildWeekDays, getWeekRange } from '../utils/timetableUtils';

interface CalendarListProps {
  onOpenSchedule: (schedule: Schedule) => void;
  /** D-Day 칩 → 그 D-Day 수정 창 (US-23) */
  onOpenDday?: (ddayId: Id) => void;
}

/**
 * CalendarList - 모바일 목록 보기: 한 주를 요일별로 (US-29, D-022 · MO-19)
 * - 보는 날이 들어 있는 주(주 시작 요일 기준) 7일을 위에서 아래로. 스와이프는 한 주씩 (AppShell · calendarSlice)
 * - 날마다: 날짜 머리(오늘 강조, 누르면 그날 일간) + D-Day 칩 + 일정과 시간 지정 Todo를 시간순으로 (일간 Todo 탭의 그날 일정과 같은 줄, AgendaRows)
 * - 그날 아무것도 없으면 '일정이 없어요'
 */
export default function CalendarList({ onOpenSchedule, onOpenDday }: CalendarListProps) {
  const dispatch = useAppDispatch();
  const viewDate = useAppSelector(selectViewDate);
  const today = toLocalDate(useNow());

  const days = useMemo(() => buildWeekDays(viewDate, DEFAULT_WEEK_START, today), [viewDate, today]);
  const range = useMemo(() => getWeekRange(viewDate, DEFAULT_WEEK_START), [viewDate]);
  const { schedules } = useScheduleRange(range);
  const todos = useTimetableTodos(range);
  const ddayChips = useDdayMarks(range);

  return (
    <section aria-label="목록 보기" className="min-h-0 flex-1 overflow-y-auto px-3 pb-24 pt-2">
      {days.map((day) => {
        const title = formatDayTitle(day.date);
        const items = dayAgendaItems(schedules, todos, day.date);
        const chips = ddayChips.get(day.date) ?? [];
        return (
          <section
            key={day.date}
            aria-label={title}
            aria-current={day.isToday ? 'date' : undefined}
            className="flex flex-col gap-1.5 border-b border-tp-line py-3 last:border-b-0"
          >
            <h3 className="text-sm font-bold">
              <button
                type="button"
                aria-label={`${title} 하루 계획 보기`}
                onClick={() => dispatch(openDayView(day.date))}
                className="flex items-center gap-1.5"
              >
                <span className={weekdayTextClass(day.weekday) ?? undefined}>{title}</span>
                {day.isToday && (
                  <span className="rounded-full bg-tp-primary px-1.5 py-px text-[11px] text-tp-on-primary">오늘</span>
                )}
              </button>
            </h3>
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {chips.map((chip) => (
                  <DdayMarkChip key={`${chip.ddayId}-${chip.label}`} chip={chip} onOpen={onOpenDday} />
                ))}
              </div>
            )}
            {items.length === 0 ? (
              <p className="text-[13px] text-tp-muted">일정이 없어요</p>
            ) : (
              <AgendaRows label={`${title} 일정`} items={items} onOpenSchedule={onOpenSchedule} />
            )}
          </section>
        );
      })}
    </section>
  );
}
