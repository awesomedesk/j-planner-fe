"use client";

import { forwardRef } from 'react';

import { draftBlockLabel, draftBlockMinutes, type TimetableDraft } from '../utils/timetableUtils';

interface DraftBlockProps {
  draft: TimetableDraft;
  /** 1시간 높이 (px) */
  hourHeight: number;
  /** 글자 크기 (px) */
  fontSize: number;
}

/**
 * DraftBlock - 빠른 추가 중 임시 블록 (US-10, D-017, PC-03)
 * 점선 테두리 + 옅은 바탕, `(제목 없음) · 14:00-15:00`. 저장하면 실제 블록으로, 취소하면 사라진다.
 */
const DraftBlock = forwardRef<HTMLDivElement, DraftBlockProps>(function DraftBlock({ draft, hourHeight, fontSize }, ref) {
  const { top, height } = draftBlockMinutes(draft);
  const toPx = (minutes: number) => (minutes / 60) * hourHeight;

  return (
    <div
      ref={ref}
      data-testid="draft-block"
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 z-10 p-px pl-0"
      style={{ top: `${toPx(top)}px`, height: `${toPx(height)}px` }}
    >
      <div
        className="h-full overflow-hidden rounded border-2 border-dashed border-[#3B4A35] bg-[rgba(59,74,53,0.06)] px-1.5 py-0.5 font-semibold leading-tight text-ink"
        style={{ fontSize }}
      >
        {draftBlockLabel(draft.title, draft.startTime, draft.endTime)}
      </div>
    </div>
  );
});

export default DraftBlock;
