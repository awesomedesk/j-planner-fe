"use client";

import { useEffect, useState } from 'react';

import type { Id, Memo } from '@/types/api';

import { memoApi } from '@utils/api';
import { useErrorNotice } from '@utils/hooks/useErrorNotice';
import { useNow } from '@utils/hooks/useNow';

import EmptyMemoMessage from './EmptyMemoMessage';
import { useMemos } from './hooks/useMemos';
import MemoEditor from './mobile/MemoEditor';
import SwipeDeleteItem from './mobile/SwipeDeleteItem';
import { formatMemoDate, getMemoHeading, getMemoPreview } from './utils/memoUtils';

interface MemoTabProps {
  /**
   * 바뀔 때마다 새 메모 편집(MO-15)을 연다. 메모 탭의 + 버튼이 숫자를 하나씩 올려 넘긴다 (D-055).
   * 없거나 0이면 열지 않는다.
   */
  newMemoRequestKey?: number;
}

/** 편집 중인 메모. null = 새 메모 */
type EditingMemo = { memo: Memo | null } | null;

/**
 * MemoTab - 모바일 일간 '메모' 탭 내용 (MO-14, D-049)
 * 카드 목록(최근 수정 순, D-029). 누르면 메모 편집(MO-15), 저장하면 탭으로 돌아온다.
 * 카드를 왼쪽으로 밀면 삭제 버튼, 누르면 확인 없이 바로 삭제 (D-030 · D-055 · D-057). 검색 없음 (D-030).
 */
export default function MemoTab({ newMemoRequestKey }: MemoTabProps) {
  const now = useNow();
  const notifyError = useErrorNotice();
  const { memos, isLoaded, upsertMemo, removeMemo } = useMemos();
  const [editing, setEditing] = useState<EditingMemo>(null);
  const [deletingId, setDeletingId] = useState<Id | null>(null);

  useEffect(() => {
    if (newMemoRequestKey) setEditing({ memo: null });
  }, [newMemoRequestKey]);

  const handleSwipeDelete = async (id: Id) => {
    setDeletingId(id);
    try {
      await memoApi.remove(id);
      removeMemo(id);
    } catch (error) {
      notifyError(error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 p-3">
      <ul aria-label="메모 목록" className="flex flex-col gap-2.5">
        {memos.map((memo) => (
          <SwipeDeleteItem
            key={memo.id}
            onDelete={() => void handleSwipeDelete(memo.id)}
            deleteLabel={`${getMemoHeading(memo)} 삭제`}
            isDeleting={deletingId === memo.id}
          >
            {({ isRevealed, close }) => (
              <MemoCard memo={memo} now={now} onOpen={() => (isRevealed ? close() : setEditing({ memo }))} />
            )}
          </SwipeDeleteItem>
        ))}
      </ul>
      {isLoaded && memos.length === 0 && <EmptyMemoMessage />}

      {editing && (
        <MemoEditor
          memo={editing.memo}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            upsertMemo(saved);
            setEditing(null);
          }}
          onDeleted={(id) => {
            removeMemo(id);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

interface MemoCardProps {
  memo: Memo;
  now: Date;
  onOpen: () => void;
}

function MemoCard({ memo, now, onOpen }: MemoCardProps) {
  const preview = getMemoPreview(memo);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-1 rounded-xl border border-tp-line bg-white px-3.5 py-3 text-left text-ink"
    >
      <span className="flex w-full items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-[15px] font-bold">{getMemoHeading(memo)}</span>
        <span className="shrink-0 text-[11px] text-tp-muted">{formatMemoDate(memo.updatedAt, now)}</span>
      </span>
      {preview && <span className="w-full truncate text-[13px] text-tp-muted">{preview}</span>}
    </button>
  );
}
