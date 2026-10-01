"use client";

import type { CSSProperties } from 'react';

import type { Category, Schedule } from '@/types/api';

import { blockBackground, readableTextColor } from '../utils/calendarUtils';

interface AllDayChipProps {
  schedule: Schedule;
  category: Category | null | undefined;
  /** 모바일 7칸처럼 좁은 칸: 작은 글자, '…' 없이 칸 끝에서 자른다 (D-052 ②) */
  compact?: boolean;
  /** 보이는 기간 앞·뒤로 이어지면 그쪽 모서리를 각지게 (D-052 ①) */
  continuesBefore?: boolean;
  continuesAfter?: boolean;
  /** 종일 줄 격자 안 자리 (gridColumn·gridRow) */
  style?: CSSProperties;
  onOpen: (schedule: Schedule) => void;
}

/**
 * AllDayChip - 시간표(주간·일간) 맨 위 종일 줄의 일정 (PC-02 ⑤, US-08, D-052)
 * - 여러 날이면 걸친 칸만큼 이어진 막대 하나, 제목은 시작 쪽에 한 번
 * - PC는 넘치면 '…' (D-023), 모바일 7칸은 '…' 없이 칸 끝에서 자른다 (글자가 더 많이 보이게)
 * - 누르면 일정 수정 창
 */
export default function AllDayChip({ schedule, category, compact = false, continuesBefore = false, continuesAfter = false, style, onOpen }: AllDayChipProps) {
  const radius = `${continuesBefore ? 'rounded-l-none' : ''} ${continuesAfter ? 'rounded-r-none' : ''}`;
  return (
    <button
      type="button"
      title={schedule.title}
      onClick={() => onOpen(schedule)}
      data-continues-before={continuesBefore || undefined}
      data-continues-after={continuesAfter || undefined}
      className={`min-w-0 overflow-hidden whitespace-nowrap rounded pl-[11px] text-left ${radius} ${
        compact ? 'text-clip py-px pr-0.5 text-[9px] font-semibold' : 'truncate py-0.5 pr-1.5 text-[11px] font-medium'
      }`}
      style={{ ...style, background: blockBackground(category, schedule.color), color: readableTextColor(schedule.color) }}
    >
      {schedule.title}
    </button>
  );
}
