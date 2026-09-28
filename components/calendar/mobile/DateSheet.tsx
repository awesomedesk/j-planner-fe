"use client";

import { useRef, useState, type PointerEvent } from 'react';

import type { Category, Id, LocalDate, Schedule } from '@/types/api';

import DayScheduleList from '../common/DayScheduleList';
import { formatDayTitle } from '../utils/calendarUtils';

interface DateSheetProps {
  date: LocalDate;
  schedules: Schedule[];
  categoriesById: Map<Id, Category>;
  onOpenSchedule: (schedule: Schedule) => void;
  onOpenDayPlan: (date: LocalDate) => void;
  onClose: () => void;
}

/** 손잡이를 이만큼(px) 아래로 끌면 닫힌다 */
const CLOSE_DRAG_DISTANCE = 60;
/** 이만큼(px) 넘게 움직이면 누르기가 아니라 끌기로 본다 (뒤따르는 클릭으로 닫지 않음) */
const DRAG_SLOP = 5;

/**
 * DateSheet - 모바일 월간에서 날짜를 누르면 아래에서 올라오는 시트 (MO-01 ③)
 * 그날 일정 목록 + '하루 계획 보기'(일간, US-08).
 * Todo·D-Day·일기·메모 섹션(사이드바 설정 순서)은 M2·M3에서 붙인다. 끝까지 올리기(MO-18)는 US-30.
 * 손잡이를 누르거나 아래로 끌면 닫힌다. 끄는 동안 시트가 손가락을 따라 내려오고,
 * 포인터를 붙잡아(setPointerCapture) 손잡이 밖에서 떼도 받는다 (US-06 검수).
 */
export default function DateSheet({ date, schedules, categoriesById, onOpenSchedule, onOpenDayPlan, onClose }: DateSheetProps) {
  const dragStartY = useRef<number | null>(null);
  const wasDragged = useRef(false);
  const [dragOffset, setDragOffset] = useState<number | null>(null);

  const endDrag = () => {
    dragStartY.current = null;
    setDragOffset(null);
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    dragStartY.current = event.clientY;
    wasDragged.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragStartY.current === null) return;
    const distance = event.clientY - dragStartY.current;
    if (Math.abs(distance) > DRAG_SLOP) wasDragged.current = true;
    setDragOffset(Math.max(distance, 0));
  };
  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragStartY.current === null) return;
    const distance = event.clientY - dragStartY.current;
    endDrag();
    if (distance > CLOSE_DRAG_DISTANCE) onClose();
  };

  return (
    <section
      aria-label={`${formatDayTitle(date)} 날짜 시트`}
      className={`fixed inset-x-0 bottom-0 z-10 flex h-[46dvh] flex-col gap-2 rounded-t-[18px] bg-tp-bg px-3.5 pb-4 pt-2 text-tp-text shadow-[0_-6px_18px_rgba(0,0,0,0.12)] ${
        dragOffset === null ? 'transition-transform' : ''
      }`}
      style={dragOffset === null ? undefined : { transform: `translateY(${dragOffset}px)` }}
    >
      <button
        type="button"
        aria-label="시트 닫기"
        onClick={() => {
          // 끌고 난 뒤 따라오는 클릭은 무시 (끌어서 닫기는 pointerup에서 처리)
          if (wasDragged.current) {
            wasDragged.current = false;
            return;
          }
          onClose();
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={endDrag}
        className="flex h-5 w-full shrink-0 touch-none items-center justify-center"
      >
        <span className="h-1 w-10 rounded-full bg-tp-line" />
      </button>
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="text-[15px] font-bold">{formatDayTitle(date)}</h2>
        <button type="button" onClick={() => onOpenDayPlan(date)} className="text-[13px] font-semibold text-tp-primary">
          하루 계획 보기
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-16">
        <DayScheduleList date={date} schedules={schedules} categoriesById={categoriesById} onOpen={onOpenSchedule} />
      </div>
    </section>
  );
}
