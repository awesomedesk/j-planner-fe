"use client";

import { forwardRef } from 'react';
import type { PointerEvent } from 'react';

import { draftBlockLabel, draftBlockMinutes, type TimetableDraft } from '../utils/timetableUtils';

type Grip = 'start' | 'end' | 'body';

interface DraftBlockProps {
  draft: TimetableDraft;
  /** 1시간 높이 (px) */
  hourHeight: number;
  /** 글자 크기 (px) */
  fontSize: number;
  /** 있으면 위·아래 손잡이와 몸통을 끌 수 있다 (D-053) */
  onGripDown?: (grip: Grip) => (event: PointerEvent) => void;
}

/**
 * DraftBlock - 빠른 추가 중 임시 블록 (US-10, D-017 · D-053, PC-03)
 * 점선 테두리 + 옅은 바탕, `(제목 없음) · 14:00-15:00`. 저장하면 실제 블록으로, 취소하면 사라진다.
 * 위·아래 손잡이를 끌면 시작·끝이, 몸통을 끌면 자리가 30분 단위로 바뀐다.
 * 빠른 추가 바깥 누르기 층(z-40) 위에 있어야 끌 수 있다.
 */
const DraftBlock = forwardRef<HTMLDivElement, DraftBlockProps>(function DraftBlock({ draft, hourHeight, fontSize, onGripDown }, ref) {
  const { top, height } = draftBlockMinutes(draft);
  const toPx = (minutes: number) => (minutes / 60) * hourHeight;
  const isDraggable = Boolean(onGripDown);

  return (
    <div
      ref={ref}
      data-testid="draft-block"
      data-draft
      data-swipe-ignore
      aria-hidden="true"
      onPointerDown={onGripDown?.('body')}
      className={`absolute inset-x-0 z-[45] p-px pl-0 ${isDraggable ? 'cursor-move touch-none' : 'pointer-events-none'}`}
      style={{ top: `${toPx(top)}px`, height: `${toPx(height)}px` }}
    >
      <div
        className="h-full overflow-hidden rounded border-2 border-dashed border-[#3B4A35] bg-[rgba(59,74,53,0.06)] px-1.5 py-0.5 font-semibold leading-tight text-ink"
        style={{ fontSize }}
      >
        {draftBlockLabel(draft.title, draft.startTime, draft.endTime)}
      </div>
      {onGripDown && (
        <>
          <Handle position="top" onPointerDown={onGripDown('start')} testId="draft-handle-start" />
          <Handle position="bottom" onPointerDown={onGripDown('end')} testId="draft-handle-end" />
        </>
      )}
    </div>
  );
});

/** 손잡이: 가운데 작은 동그라미 + 위·아래 가장자리 넓은 잡는 자리 */
function Handle({ position, onPointerDown, testId }: { position: 'top' | 'bottom'; onPointerDown: (event: PointerEvent) => void; testId: string }) {
  return (
    <div
      data-testid={testId}
      onPointerDown={onPointerDown}
      className={`absolute inset-x-0 flex h-3 cursor-ns-resize touch-none justify-center ${position === 'top' ? '-top-1.5' : '-bottom-1.5'}`}
    >
      <span className="mt-[3px] h-1.5 w-6 rounded-full border border-[#3B4A35] bg-white" />
    </div>
  );
}

export default DraftBlock;
