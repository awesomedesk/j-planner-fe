"use client";

import { useRef, useState, type ReactNode } from 'react';

import type { Id } from '@/types/api';
import Icon from '@components/icons/LineIcon';

import { useMemos } from './hooks/useMemos';
import EmptyMemoMessage from './EmptyMemoMessage';
import MemoDialog, { type MemoDialogStart } from './MemoDialog';
import MemoInlineEditor, { type MemoInlineEditorHandle } from './MemoInlineEditor';
import { getMemoHeading, pickEarliestCreatedMemos } from './utils/memoUtils';

/**
 * MemoSection - PC 사이드바 '메모' 섹션 내용 (D-055)
 * - 오른쪽 위 'n개'(전체 개수) → 메모 창(OV-06), + → 메모 창에서 새 메모
 * - 가장 먼저 만든 메모 3개 (createdAt 순). 긴 메모는 폭만큼 자른다
 * - 누르면 그 자리에서 펼쳐 바로 고친다 — 이 자리만 자동 저장, 모두 비운 채 접으면 삭제 (D-057)
 * - 접기·다른 메모 펼치기·메모 창 열기 전에 펼친 메모를 저장한다. 저장에 실패하면 펼친 채 둔다 (D-058)
 */
interface MemoSectionProps {
  /** 사이드바가 주는 섹션 머리. header(actions) = 기본 머리 + 오른쪽 actions. 없으면 버튼 줄만 그린다 (테스트·단독 확인용) */
  header?: (actions?: ReactNode) => ReactNode;
}

export default function MemoSection({ header }: MemoSectionProps) {
  const { memos, isLoaded, reload, upsertMemo, removeMemo } = useMemos();
  const [dialogStart, setDialogStart] = useState<MemoDialogStart | null>(null);
  const [expandedId, setExpandedId] = useState<Id | null>(null);
  const editorRef = useRef<MemoInlineEditorHandle>(null);

  /** 펼친 메모를 저장(비었으면 삭제)하고 접는다. 실패하면 펼친 채 false (D-058) */
  const collapseExpanded = async () => {
    if (expandedId === null) return true;
    const isFinished = (await editorRef.current?.finish()) ?? true;
    if (isFinished) setExpandedId(null);
    return isFinished;
  };

  const handleToggle = async (id: Id) => {
    const wasExpanded = expandedId === id;
    if (!(await collapseExpanded()) || wasExpanded) return;
    setExpandedId(id);
  };

  /** 메모 창은 펼친 메모를 먼저 저장하고 접은 뒤 연다 — 같은 메모를 두 곳에서 고치지 않게 (D-058) */
  const openDialog = async (start: MemoDialogStart) => {
    if (await collapseExpanded()) setDialogStart(start);
  };

  const sidebarMemos = pickEarliestCreatedMemos(memos);

  /** 섹션 머리 오른쪽 위: 'n개' → 메모 창, + → 메모 창에서 새 메모 (D-055) */
  const headerActions = (
    <>
      {isLoaded && (
        <button
          type="button"
          aria-label={`메모 ${memos.length}개 모두 보기`}
          onClick={() => void openDialog('list')}
          className="rounded-md px-1.5 py-0.5 text-xs font-semibold text-tp-muted hover:underline"
        >
          {memos.length}개
        </button>
      )}
      <button
        type="button"
        aria-label="새 메모"
        onClick={() => void openDialog('new')}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-tp-text hover:bg-tp-secondary"
      >
        <Icon name="plus" size={15} />
      </button>
    </>
  );

  return (
    <div className="flex flex-col gap-2">
      {header ? header(headerActions) : <div className="flex items-center justify-end gap-1">{headerActions}</div>}

      <ul aria-label="사이드바 메모" className="flex flex-col gap-1.5">
        {sidebarMemos.map((memo) => {
          const isExpanded = expandedId === memo.id;
          return (
            <li key={memo.id} className="rounded-lg border border-tp-line bg-tp-bg">
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => void handleToggle(memo.id)}
                className={`w-full px-2.5 py-2 text-left text-[13px] font-semibold ${isExpanded ? 'break-words' : 'truncate'}`}
              >
                {getMemoHeading(memo)}
              </button>
              {isExpanded && <MemoInlineEditor ref={editorRef} memo={memo} onSaved={upsertMemo} onDeleted={removeMemo} />}
            </li>
          );
        })}
      </ul>
      {isLoaded && memos.length === 0 && <EmptyMemoMessage />}

      {dialogStart && <MemoDialog startWith={dialogStart} onClose={() => setDialogStart(null)} onChanged={() => void reload()} />}
    </div>
  );
}
