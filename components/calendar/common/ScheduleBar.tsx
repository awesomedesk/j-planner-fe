"use client";

import type { Category, LocalDate, Schedule } from '@/types/api';
import { getCategoryStripeColor } from '@components/category/utils/categoryUtils';
import Icon from '@components/icons/LineIcon';

import { barTimeLabel, readableTextColor } from '../utils/calendarUtils';

interface ScheduleBarProps {
  schedule: Schedule;
  /** 이 막대가 놓인 날짜 (시작한 날에만 시각을 붙인다) */
  date: LocalDate;
  category: Category | null;
  onOpen: (schedule: Schedule) => void;
}

/**
 * ScheduleBar - 월간 칸의 일정 막대 (D-019, D-023)
 * 왼쪽 5px 띠 = 카테고리 색(미지정은 테마 Theme2), 몸통 = 일정 색(안 고르면 테마 Theme2, D-030).
 * 한 줄에서 넘치면 '…'. 누르면 일정 수정 창. URL이 있으면 오른쪽 링크 아이콘으로 새 탭에서 연다 (D-021).
 */
export default function ScheduleBar({ schedule, date, category, onOpen }: ScheduleBarProps) {
  const stripe = category ? getCategoryStripeColor(category) : 'var(--tp-theme2)';
  const body = schedule.color ?? 'var(--tp-theme2)';
  const textColor = readableTextColor(schedule.color);
  const time = barTimeLabel(schedule, date);

  return (
    <div
      className="flex h-[18px] min-w-0 shrink-0 items-center rounded text-[11px] font-medium leading-none"
      style={{ background: `linear-gradient(to right, ${stripe} 0 5px, ${body} 5px)`, color: textColor }}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onOpen(schedule);
        }}
        onDoubleClick={(event) => event.stopPropagation()}
        title={schedule.title}
        className="h-full min-w-0 flex-1 truncate pl-[11px] pr-1.5 text-left"
      >
        {time && <span className="mr-1 opacity-85">{time}</span>}
        {schedule.title}
      </button>
      {schedule.url && (
        <a
          href={schedule.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${schedule.title} 링크 열기`}
          title="링크 열기"
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
          className="inline-flex h-full shrink-0 items-center pr-1.5 opacity-85 hover:opacity-100"
        >
          <Icon name="link" size={11} strokeWidth={2.4} />
        </a>
      )}
    </div>
  );
}
