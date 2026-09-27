"use client";

import type { Category, Schedule } from '@/types/api';
import { getCategoryStripeColor } from '@components/category/utils/categoryUtils';
import Icon from '@components/icons/LineIcon';

import { readableTextColor } from '../utils/calendarUtils';
import { lineClampFor, type TimetableBlockLayout } from '../utils/timetableUtils';

interface TimetableBlockProps {
  layout: TimetableBlockLayout;
  category: Category | null;
  /** 1시간 높이 (px) */
  hourHeight: number;
  /** 제목 글자 크기 (px) */
  fontSize: number;
  onOpen: (schedule: Schedule) => void;
}

/** 블록 사이 틈 (위아래·오른쪽 1px) */
const GAP = 1;

const timeText = (schedule: Schedule) => `${schedule.start.slice(11, 16)}~${schedule.end.slice(11, 16)}`;

/**
 * TimetableBlock - 시간표(주간·일간)의 일정 블록 (PC-02 ⑥, MO-05)
 * - 왼쪽 5px 띠 = 카테고리 색(미지정은 테마 Theme2), 몸통 = 일정 색(안 고르면 Theme2) (D-019, D-030)
 * - 제목은 칸 안에서 줄바꿈, 높이가 모자라면 마지막 줄 끝 '…' (D-023)
 * - 누르면 수정 창, URL이 있으면 링크 아이콘으로 새 탭 (D-021)
 */
export default function TimetableBlock({ layout, category, hourHeight, fontSize, onOpen }: TimetableBlockProps) {
  const { schedule } = layout;
  const toPx = (minutes: number) => (minutes / 60) * hourHeight;
  const height = toPx(layout.height);
  const stripe = category ? getCategoryStripeColor(category) : 'var(--tp-theme2)';
  const body = schedule.color ?? 'var(--tp-theme2)';

  return (
    <div
      data-block
      className="absolute"
      style={{
        top: `${toPx(layout.top)}px`,
        height: `${height}px`,
        left: `${(layout.column / layout.columns) * 100}%`,
        width: `${100 / layout.columns}%`,
        padding: `${GAP}px ${GAP}px ${GAP}px 0`,
      }}
    >
      <div
        data-block-body
        className="relative flex h-full overflow-hidden rounded"
        style={{ background: `linear-gradient(to right, ${stripe} 0 5px, ${body} 5px)`, color: readableTextColor(schedule.color) }}
      >
        <button
          type="button"
          aria-label={`${schedule.title}, ${schedule.allDay ? '종일' : timeText(schedule)}`}
          title={schedule.title}
          onClick={(event) => {
            event.stopPropagation();
            onOpen(schedule);
          }}
          onDoubleClick={(event) => event.stopPropagation()}
          className="flex h-full min-w-0 flex-1 flex-col items-start justify-start overflow-hidden pl-[9px] pr-0.5 pt-0.5 text-left font-semibold"
          style={{ fontSize: `${fontSize}px` }}
        >
          <span
            data-title
            className="overflow-hidden break-all leading-[1.25]"
            style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: lineClampFor(height - GAP * 2, fontSize) }}
          >
            {schedule.title}
          </span>
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
            className="shrink-0 pr-1 pt-1 opacity-85 hover:opacity-100"
          >
            <Icon name="link" size={11} strokeWidth={2.4} />
          </a>
        )}
      </div>
    </div>
  );
}
