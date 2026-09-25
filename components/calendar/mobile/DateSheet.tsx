"use client";

import { useRef } from 'react';

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

/**
 * DateSheet - 모바일 월간에서 날짜를 누르면 아래에서 올라오는 시트 (MO-01 ③)
 * 그날 일정 목록 + '하루 계획 보기'(일간, US-08).
 * Todo·D-Day·일기·메모 섹션(사이드바 설정 순서)은 M2·M3에서 붙인다. 끝까지 올리기(MO-18)는 US-30.
 * 손잡이를 누르거나 아래로 끌면 닫힌다.
 */
export default function DateSheet({ date, schedules, categoriesById, onOpenSchedule, onOpenDayPlan, onClose }: DateSheetProps) {
  const dragStartY = useRef<number | null>(null);

  return (
    <section
      aria-label={`${formatDayTitle(date)} 날짜 시트`}
      className="fixed inset-x-0 bottom-0 z-10 flex h-[46dvh] flex-col gap-2 rounded-t-[18px] bg-tp-bg px-3.5 pb-4 pt-2 text-tp-text shadow-[0_-6px_18px_rgba(0,0,0,0.12)]"
    >
      <button
        type="button"
        aria-label="시트 닫기"
        onClick={onClose}
        onPointerDown={(event) => {
          dragStartY.current = event.clientY;
        }}
        onPointerUp={(event) => {
          if (dragStartY.current !== null && event.clientY - dragStartY.current > CLOSE_DRAG_DISTANCE) onClose();
          dragStartY.current = null;
        }}
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
