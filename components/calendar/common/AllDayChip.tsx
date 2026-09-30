"use client";

import type { Category, Schedule } from '@/types/api';

import { blockBackground, readableTextColor } from '../utils/calendarUtils';

interface AllDayChipProps {
  schedule: Schedule;
  category: Category | null | undefined;
  /** 모바일 7칸처럼 좁은 칸 */
  compact?: boolean;
  onOpen: (schedule: Schedule) => void;
}

/**
 * AllDayChip - 시간표(주간·일간) 맨 위 종일 줄의 일정 (PC-02 ⑤, US-08)
 * 한 줄에서 넘치면 '…' (D-023), 누르면 일정 수정 창
 */
export default function AllDayChip({ schedule, category, compact = false, onOpen }: AllDayChipProps) {
  return (
    <button
      type="button"
      title={schedule.title}
      onClick={() => onOpen(schedule)}
      className={`truncate rounded pl-[11px] text-left ${compact ? 'py-px text-[9px] font-semibold' : 'py-0.5 pr-1.5 text-[11px] font-medium'}`}
      style={{ background: blockBackground(category, schedule.color), color: readableTextColor(schedule.color) }}
    >
      {schedule.title}
    </button>
  );
}
