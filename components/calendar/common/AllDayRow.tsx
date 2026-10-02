"use client";

import { useState } from 'react';
import type { CSSProperties } from 'react';

import type { Category, Id, LocalDate, Schedule } from '@/types/api';

import { formatDayTitle } from '@utils/date/dateUtils';

import { multiDayProgress } from '../utils/calendarUtils';
import { allDaySchedulesOn, layoutAllDayRow } from '../utils/timetableUtils';

import AllDayChip from './AllDayChip';
import DayListPopover from './DayListPopover';

interface AllDayRowProps {
  /** 보이는 날짜들 (주간 7일, 일간 하루) */
  dates: LocalDate[];
  schedules: Schedule[];
  categoriesById: Map<Id, Category>;
  /** 모바일 7칸처럼 좁은 칸 */
  compact?: boolean;
  /** 왼쪽 '종일' 글자 칸 폭 (px) — 시간표의 시각 칸과 맞춘다 */
  labelWidth: number;
  labelClassName: string;
  /** 날짜 칸 사이 세로선 (주간) */
  showDayLines?: boolean;
  /** 시간표 스크롤바 폭만큼 오른쪽을 비워 세로선을 맞춘다 */
  paddingRight?: number;
  minHeight: number;
  onOpen: (schedule: Schedule) => void;
}

/**
 * AllDayRow - 주간·일간 맨 위 종일 줄 (PC-02 ⑤, US-08, D-052)
 * - 여러 날 종일 일정은 이어진 막대 하나 (주를 넘으면 다음 주에서 이어서 시작)
 * - 3줄까지 막대, 넘으면 그날 칸 아래 '+n' → 누르면 그날 종일 일정 목록
 * 격자: 1열 = '종일' 글자, 2열부터 날짜 칸. 막대는 grid-column으로 걸친 칸만큼 늘린다
 */
export default function AllDayRow({
  dates,
  schedules,
  categoriesById,
  compact = false,
  labelWidth,
  labelClassName,
  showDayLines = false,
  paddingRight = 0,
  minHeight,
  onOpen,
}: AllDayRowProps) {
  const [openDate, setOpenDate] = useState<LocalDate | null>(null);
  /** 일간(하루)에서는 여러 날 일정에 '(2/3일)'. 주간 이어진 막대에는 붙이지 않는다 (D-052 보완) */
  const suffixOf = (schedule: Schedule, date: LocalDate) => {
    if (dates.length !== 1) return undefined;
    const progress = multiDayProgress(schedule, date);
    return progress ? `(${progress.nth}/${progress.total}일)` : undefined;
  };
  const { bars, hidden, laneCount } = layoutAllDayRow(schedules, dates);
  const rowCount = Math.max(laneCount, 1) + (hidden.some(Boolean) ? 1 : 0);
  const style: CSSProperties = {
    gridTemplateColumns: `${labelWidth}px repeat(${dates.length}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rowCount}, auto)`,
    paddingRight,
    minHeight,
  };

  return (
    <section aria-label="종일" className="grid border-b border-tp-line" style={style}>
      <div className={`flex items-center ${labelClassName}`} style={{ gridColumn: 1, gridRow: '1 / -1' }}>
        종일
      </div>
      {dates.map((date, index) => (
        <div
          key={date}
          role="group"
          aria-label={`${formatDayTitle(date)} 종일`}
          className={showDayLines ? 'border-l border-tp-line' : undefined}
          style={{ gridColumn: index + 2, gridRow: '1 / -1' }}
        />
      ))}
      {bars.map((bar) => (
        <AllDayChip
          key={bar.schedule.id}
          schedule={bar.schedule}
          category={categoriesById.get(bar.schedule.categoryId)}
          compact={compact}
          continuesBefore={bar.continuesBefore}
          continuesAfter={bar.continuesAfter}
          suffix={suffixOf(bar.schedule, dates[bar.startCol])}
          onOpen={onOpen}
          style={{
            gridColumn: `${bar.startCol + 2} / span ${bar.span}`,
            gridRow: bar.lane + 1,
            margin: compact ? '1px' : '2px',
          }}
        />
      ))}
      {hidden.map((count, index) =>
        count > 0 ? (
          <div key={dates[index]} className="relative" style={{ gridColumn: index + 2, gridRow: rowCount }}>
            <button
              type="button"
              aria-label={`${formatDayTitle(dates[index])} 종일 일정 ${count}개 더 보기`}
              onClick={() => setOpenDate(dates[index])}
              className={`w-full rounded text-left font-semibold text-tp-muted hover:bg-tp-panel ${compact ? 'px-0.5 text-[9px]' : 'px-1.5 text-[11px]'}`}
            >
              +{count}
            </button>
            {openDate === dates[index] && (
              <DayListPopover
                title={formatDayTitle(dates[index])}
                ariaLabel={`${formatDayTitle(dates[index])} 종일`}
                alignRight={index >= dates.length - 2 && dates.length > 2}
                onClose={() => setOpenDate(null)}
              >
                {allDaySchedulesOn(schedules, dates[index]).map((schedule) => (
                  <AllDayChip
                    key={schedule.id}
                    schedule={schedule}
                    category={categoriesById.get(schedule.categoryId)}
                    suffix={suffixOf(schedule, dates[index])}
                    onOpen={(target) => {
                      setOpenDate(null);
                      onOpen(target);
                    }}
                  />
                ))}
              </DayListPopover>
            )}
          </div>
        ) : null
      )}
    </section>
  );
}
