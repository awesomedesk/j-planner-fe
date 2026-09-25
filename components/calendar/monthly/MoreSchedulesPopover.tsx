"use client";

import { useEffect, useRef } from 'react';

import type { Category, Id, LocalDate, Schedule } from '@/types/api';
import Icon from '@components/icons/LineIcon';

import ScheduleBar from '../common/ScheduleBar';
import { formatDayTitle } from '../utils/calendarUtils';

interface MoreSchedulesPopoverProps {
  date: LocalDate;
  schedules: Schedule[];
  categoriesById: Map<Id, Category>;
  /** 오른쪽 끝 칸이면 오른쪽에 맞춰 연다 */
  alignRight: boolean;
  onOpen: (schedule: Schedule) => void;
  onClose: () => void;
}

/**
 * MoreSchedulesPopover - '+n 더보기'를 누르면 그날 일정 전체를 칸 위에 띄운다
 * 바깥을 누르거나 Esc로 닫힌다.
 */
export default function MoreSchedulesPopover({ date, schedules, categoriesById, alignRight, onOpen, onClose }: MoreSchedulesPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`${formatDayTitle(date)} 일정`}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      className={`absolute top-0 z-30 flex w-56 flex-col gap-1 rounded-xl border border-tp-line bg-tp-bg p-2 text-tp-text shadow-lg ${alignRight ? 'right-0' : 'left-0'}`}
    >
      <div className="flex items-center justify-between pb-1">
        <span className="text-[13px] font-bold">{formatDayTitle(date)}</span>
        <button type="button" aria-label="닫기" onClick={onClose} className="inline-flex h-6 w-6 items-center justify-center text-tp-muted">
          <Icon name="close" size={13} />
        </button>
      </div>
      {schedules.map((schedule) => (
        <ScheduleBar
          key={schedule.id}
          schedule={schedule}
          date={date}
          category={categoriesById.get(schedule.categoryId) ?? null}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
