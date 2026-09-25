"use client";

import type { Category, Id, LocalDate, Schedule } from '@/types/api';
import { getCategoryStripeColor } from '@components/category/utils/categoryUtils';
import Icon from '@components/icons/LineIcon';

import { listTimeLabel, schedulesOn } from '../utils/calendarUtils';

interface DayScheduleListProps {
  date: LocalDate;
  schedules: Schedule[];
  categoriesById: Map<Id, Category>;
  onOpen: (schedule: Schedule) => void;
}

/**
 * DayScheduleList - 그날 일정 목록 (모바일 날짜 시트 MO-01 ③, 폴드 오른쪽 패널 FOLD-01)
 * 띠(카테고리 색) · 시각 · 제목. 누르면 일정 수정 창, URL이 있으면 링크 아이콘.
 */
export default function DayScheduleList({ date, schedules, categoriesById, onOpen }: DayScheduleListProps) {
  const items = schedulesOn(schedules, date);

  if (items.length === 0) {
    return <p className="py-2 text-[13px] text-tp-muted">이날 일정이 없어요</p>;
  }

  return (
    <ul className="flex flex-col" aria-label="일정 목록">
      {items.map((schedule) => {
        const category = categoriesById.get(schedule.categoryId) ?? null;
        return (
          <li key={schedule.id} className="flex items-center gap-2">
            <button type="button" onClick={() => onOpen(schedule)} className="flex min-h-9 min-w-0 flex-1 items-center gap-2 text-left text-[13px]">
              <span
                className="h-[18px] w-1 shrink-0 rounded-sm"
                style={{ backgroundColor: category ? getCategoryStripeColor(category) : 'var(--tp-theme2)' }}
                aria-hidden="true"
              />
              <span className="w-10 shrink-0 text-tp-muted">{listTimeLabel(schedule, date)}</span>
              <span className="min-w-0 flex-1 truncate font-semibold">{schedule.title}</span>
            </button>
            {schedule.url && (
              <a
                href={schedule.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${schedule.title} 링크 열기`}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-tp-primary"
              >
                <Icon name="link" size={15} />
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
