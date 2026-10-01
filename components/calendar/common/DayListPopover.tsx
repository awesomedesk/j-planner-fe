"use client";

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import Icon from '@components/icons/LineIcon';

interface DayListPopoverProps {
  /** 머리 글자 (예: `9월 23일 (수)`) */
  title: string;
  /** 창 이름 (예: `9월 23일 (수) 일정`) */
  ariaLabel: string;
  /** 오른쪽 끝 칸이면 오른쪽에 맞춰 연다 */
  alignRight: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * DayListPopover - 칸 위에 띄우는 그날 목록 틀 (월간 '+n 더보기', 주간·일간 종일 줄 '+n', D-052)
 * 바깥을 누르거나 Esc로 닫힌다.
 */
export default function DayListPopover({ title, ariaLabel, alignRight, onClose, children }: DayListPopoverProps) {
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
      aria-label={ariaLabel}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      className={`absolute top-0 z-30 flex w-56 flex-col gap-1 rounded-xl border border-tp-line bg-tp-bg p-2 text-tp-text shadow-lg ${alignRight ? 'right-0' : 'left-0'}`}
    >
      <div className="flex items-center justify-between pb-1">
        <span className="text-[13px] font-bold">{title}</span>
        <button type="button" aria-label="닫기" onClick={onClose} className="inline-flex h-6 w-6 items-center justify-center text-tp-muted">
          <Icon name="close" size={13} />
        </button>
      </div>
      {children}
    </div>
  );
}
