"use client";

import type { CSSProperties } from 'react';

import type { Id } from '@/types/api';

import { ddayChipText, type DdayChipItem } from '../utils/ddayMarkUtils';

interface DdayMarkChipProps {
  chip: DdayChipItem;
  /** 좁은 칸(모바일 주간 7칸): 라벨만 보이고 접근 이름에 제목 (06 달력 표시) */
  compact?: boolean;
  style?: CSSProperties;
  onOpen?: (ddayId: Id) => void;
}

/**
 * DdayMarkChip - 달력 칸의 D-Day 한 줄 칩 `D-3 제목` (US-23, 06 달력 표시)
 * 카테고리 색 없이 테마 보조 색. 누르면 그 D-Day 수정 창
 */
export default function DdayMarkChip({ chip, compact = false, style, onOpen }: DdayMarkChipProps) {
  const text = ddayChipText(chip);
  return (
    <button
      type="button"
      aria-label={text}
      title={text}
      data-dday-chip=""
      onClick={(event) => {
        event.stopPropagation();
        onOpen?.(chip.ddayId);
      }}
      onDoubleClick={(event) => event.stopPropagation()}
      className={`flex min-w-0 shrink-0 items-center gap-1 overflow-hidden whitespace-nowrap rounded border border-tp-secondary-line bg-tp-secondary text-left text-tp-on-secondary ${
        compact ? 'h-auto px-0.5 py-px text-[9px] font-bold' : 'h-[18px] px-1.5 text-[11px]'
      }`}
      style={style}
    >
      <span className="shrink-0 font-bold">{chip.label}</span>
      {!compact && chip.title && <span className="min-w-0 truncate font-medium">{chip.title}</span>}
    </button>
  );
}
