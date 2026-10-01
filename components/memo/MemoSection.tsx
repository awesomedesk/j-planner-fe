"use client";

import { useState } from 'react';

import type { Id } from '@/types/api';
import Icon from '@components/icons/LineIcon';

import { useMemos } from './hooks/useMemos';
import MemoDialog, { type MemoDialogStart } from './MemoDialog';
import { getMemoBody, getMemoHeading, pickEarliestCreatedMemos } from './utils/memoUtils';

/**
 * MemoSection - PC 사이드바 '메모' 섹션 내용 (D-055)
 * - 오른쪽 위 'n개'(전체 개수) → 메모 창(OV-06), + → 메모 창에서 새 메모
 * - 가장 먼저 만든 메모 3개 (createdAt 순). 긴 메모는 폭만큼 자르고, 누르면 그 자리에서 펼쳐 내용 전체 (편집은 메모 창)
 */
export default function MemoSection() {
  const { memos, isLoaded, reload } = useMemos();
  const [dialogStart, setDialogStart] = useState<MemoDialogStart | null>(null);
  const [expandedId, setExpandedId] = useState<Id | null>(null);

  const sidebarMemos = pickEarliestCreatedMemos(memos);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-1">
        {isLoaded && (
          <button
            type="button"
            onClick={() => setDialogStart('list')}
            className="rounded-md px-1.5 py-0.5 text-xs font-semibold text-tp-muted hover:underline"
          >
            {memos.length}개
          </button>
        )}
        <button
          type="button"
          aria-label="새 메모"
          onClick={() => setDialogStart('new')}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-tp-text hover:bg-tp-secondary"
        >
          <Icon name="plus" size={15} />
        </button>
      </div>

      <ul aria-label="사이드바 메모" className="flex flex-col gap-1.5">
        {sidebarMemos.map((memo) => {
          const isExpanded = expandedId === memo.id;
          const body = getMemoBody(memo);
          return (
            <li key={memo.id} className="rounded-lg border border-tp-line bg-tp-bg">
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setExpandedId(isExpanded ? null : memo.id)}
                className={`w-full px-2.5 py-2 text-left text-[13px] font-semibold ${isExpanded ? 'break-words' : 'truncate'}`}
              >
                {getMemoHeading(memo)}
              </button>
              {isExpanded && body && <p className="whitespace-pre-wrap break-words px-2.5 pb-2.5 text-[13px] text-tp-text">{body}</p>}
            </li>
          );
        })}
      </ul>

      {dialogStart && <MemoDialog startWith={dialogStart} onClose={() => setDialogStart(null)} onChanged={() => void reload()} />}
    </div>
  );
}
