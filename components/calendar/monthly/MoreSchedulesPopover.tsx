"use client";

import type { Category, Id, LocalDate, Schedule } from '@/types/api';

import { formatDayTitle } from '@utils/date/dateUtils';

import DayListPopover from '../common/DayListPopover';
import DdayMarkChip from '../common/DdayMarkChip';
import ScheduleBar from '../common/ScheduleBar';
import type { DdayChipItem } from '../utils/ddayMarkUtils';

interface MoreSchedulesPopoverProps {
  date: LocalDate;
  schedules: Schedule[];
  /** 그날 D-Day 칩 (맨 위, US-23) */
  ddayChips?: DdayChipItem[];
  onOpenDday?: (ddayId: Id) => void;
  categoriesById: Map<Id, Category>;
  /** 오른쪽 끝 칸이면 오른쪽에 맞춰 연다 */
  alignRight: boolean;
  onOpen: (schedule: Schedule) => void;
  onClose: () => void;
}

/** MoreSchedulesPopover - 월간 '+n 더보기'를 누르면 그날 D-Day·일정 전체를 칸 위에 띄운다 */
export default function MoreSchedulesPopover({ date, schedules, ddayChips = [], onOpenDday, categoriesById, alignRight, onOpen, onClose }: MoreSchedulesPopoverProps) {
  return (
    <DayListPopover title={formatDayTitle(date)} ariaLabel={`${formatDayTitle(date)} 일정`} alignRight={alignRight} onClose={onClose}>
      {ddayChips.map((chip) => (
        <DdayMarkChip key={chip.key} chip={chip} onOpen={onOpenDday} />
      ))}
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
