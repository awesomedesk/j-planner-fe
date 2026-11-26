"use client";

import { useMemo } from 'react';

import type { LocalDate, Schedule } from '@/types/api';
import { useAppSelector } from '@/app/hooks';
import Icon from '@components/icons/LineIcon';
import { selectSchedules } from '@store/slices/scheduleSlice';
import { selectScheduledTodos } from '@store/slices/todoSlice';
import { toLocalDate } from '@utils/date/dateUtils';
import { useNow } from '@utils/hooks/useNow';

import { dayAgendaItems } from '../utils/dayAgendaUtils';
import AgendaRows from './AgendaRows';

interface DayAgendaListProps {
  date: LocalDate;
  onOpenSchedule: (schedule: Schedule) => void;
}

/**
 * DayAgendaList - 모바일 일간 Todo 탭의 '그날 일정' 목록 (US-17, D-022 · MO-10 ③)
 * - 일정과 시간 지정 Todo를 시간순으로 — 줄 모양은 AgendaRows (목록 보기와 같음)
 * - 데이터는 일간 화면(CalendarDaily)이 받아 둔 그날 일정 · 시간 지정 Todo를 그대로 쓴다 — 새 요청 없음 (US-17은 기존 조회)
 */
export default function DayAgendaList({ date, onOpenSchedule }: DayAgendaListProps) {
  const schedules = useAppSelector(selectSchedules);
  const todos = useAppSelector(selectScheduledTodos);
  const today = toLocalDate(useNow());
  const items = useMemo(() => dayAgendaItems(schedules, todos, date), [schedules, todos, date]);
  const title = date === today ? '오늘 일정' : '이날 일정';

  return (
    <section className="flex flex-col gap-1.5" aria-label={title}>
      <h3 className="flex items-center gap-1.5 text-sm font-bold">
        <Icon name="calendar" size={18} className="text-tp-primary" />
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="py-2 text-[13px] text-tp-muted">이날 일정이 없어요</p>
      ) : (
        <AgendaRows label={title} items={items} onOpenSchedule={onOpenSchedule} />
      )}
    </section>
  );
}
