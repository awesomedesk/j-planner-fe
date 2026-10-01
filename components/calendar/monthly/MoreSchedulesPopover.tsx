"use client";

import type { Category, Id, LocalDate, Schedule } from '@/types/api';

import { formatDayTitle } from '@utils/date/dateUtils';

import DayListPopover from '../common/DayListPopover';
import ScheduleBar from '../common/ScheduleBar';

interface MoreSchedulesPopoverProps {
  date: LocalDate;
  schedules: Schedule[];
  categoriesById: Map<Id, Category>;
  /** 오른쪽 끝 칸이면 오른쪽에 맞춰 연다 */
  alignRight: boolean;
  onOpen: (schedule: Schedule) => void;
  onClose: () => void;
}

/** MoreSchedulesPopover - 월간 '+n 더보기'를 누르면 그날 일정 전체를 칸 위에 띄운다 */
export default function MoreSchedulesPopover({ date, schedules, categoriesById, alignRight, onOpen, onClose }: MoreSchedulesPopoverProps) {
  return (
    <DayListPopover title={formatDayTitle(date)} ariaLabel={`${formatDayTitle(date)} 일정`} alignRight={alignRight} onClose={onClose}>
      {schedules.map((schedule) => (
        <ScheduleBar
          key={schedule.id}
          schedule={schedule}
          date={date}
          category={categoriesById.get(schedule.categoryId) ?? null}
          onOpen={onOpen}
        />
      ))}
    </DayListPopover>
  );
}
