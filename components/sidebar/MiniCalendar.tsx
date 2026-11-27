"use client";

import { useMemo } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { buildMonthGrid, weekdayTextClass } from '@components/calendar/utils/calendarUtils';
import { selectDate, selectSelectedDate } from '@store/slices/calendarSlice';
import { selectWeekStartDay } from '@store/slices/settingsSlice';
import { formatDayTitle, formatMonthTitle, toLocalDate } from '@utils/date/dateUtils';
import { useNow } from '@utils/hooks/useNow';

/**
 * MiniCalendar - 사이드바 맨 위 고정 미니 달력 (US-19, D-013·015 · #394 v1.2)
 * 고른 날짜(사이드바 기준 날짜)가 들어 있는 달. 오늘은 동그라미, 고른 날은 테두리.
 * 날짜를 누르면 그날을 고른다 → 사이드바 섹션(Todo·일기)이 그날로. 큰 달력의 보는 달은 그대로
 */
export default function MiniCalendar() {
  const dispatch = useAppDispatch();
  const selectedDate = useAppSelector(selectSelectedDate);
  const today = toLocalDate(useNow());
  const weekStart = useAppSelector(selectWeekStartDay);
  const weeks = useMemo(() => buildMonthGrid(selectedDate, weekStart, today), [selectedDate, weekStart, today]);
  const weekdays = weeks[0].days.map((day) => day.weekday);
  const title = formatMonthTitle(selectedDate);

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-bold">{title}</h3>
      <div className="grid grid-cols-7 gap-y-0.5 text-center text-[11px]">
        {weekdays.map((weekday) => (
          <span key={weekday} aria-hidden="true" className={weekdayTextClass(weekday) ?? 'text-tp-muted'}>
            {'일월화수목금토'[weekday]}
          </span>
        ))}
        {weeks.flatMap((week) =>
          week.days.map((day) =>
            day.inMonth ? (
              <button
                key={day.date}
                type="button"
                // 달 제목(‘2026년 9월’) 아래라서 ‘23일 (수)’까지만 — 큰 달력의 날짜 칸 이름과 겹치지 않게
                aria-label={formatDayTitle(day.date).replace(/^\d+월 /, '')}
                aria-current={day.isToday ? 'date' : undefined}
                aria-pressed={day.date === selectedDate}
                onClick={() => dispatch(selectDate(day.date))}
                className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                  day.isToday ? 'bg-tp-primary font-bold text-tp-on-primary' : (weekdayTextClass(day.weekday) ?? 'text-tp-text')
                }`}
                style={day.date === selectedDate && !day.isToday ? { boxShadow: 'inset 0 0 0 2px var(--tp-theme2)' } : undefined}
              >
                {day.dayOfMonth}
              </button>
            ) : (
              <span key={day.date} aria-hidden="true" />
            )
          )
        )}
      </div>
    </div>
  );
}
