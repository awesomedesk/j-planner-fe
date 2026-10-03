"use client";

import { useEffect, useId, useRef, useState } from 'react';

import type { Id, Memo } from '@/types/api';
import ThemeButton from '@components/button/ThemeButton';
import DialogFrame, { useDialogRequestClose } from '@components/dialog/DialogFrame';
import DiscardConfirm from '@components/dialog/DiscardConfirm';
import Icon from '@components/icons/LineIcon';

import { useMemoForm, type MemoForm } from './hooks/useMemoForm';
import { useMemos } from './hooks/useMemos';
import EmptyMemoMessage from './EmptyMemoMessage';
import MemoDeleteButtons from './MemoDeleteButtons';
import MemoFields from './MemoFields';
import { getMemoHeading, getMemoPreview, pickMemoAfterDelete } from './utils/memoUtils';

/** 'list' = 맨 위(최근 수정) 메모를 보며 열기 ('n개'), 'new' = 새 메모로 열기 (+) (D-055) */
export type MemoDialogStart = 'list' | 'new';

interface MemoDialogProps {
  startWith: MemoDialogStart;
  onClose: () => void;
  /** 저장·삭제로 메모가 바뀌었을 때 (사이드바 다시 불러오기) */
  onChanged?: () => void;
}

/**
 * MemoDialog - 메모 창 (OV-06, PC)
 * 왼쪽 목록(최근 수정 순, D-029) + 새 메모, 오른쪽 제목·내용. 아래 삭제 | 닫기 · 저장.
 * 바뀐 것이 있는 채 닫거나 다른 메모를 고르면 "작성을 취소할까요?" (D-037).
 */
export default function MemoDialog({ startWith, onClose, onChanged }: MemoDialogProps) {
  const formId = useId();
  const { memos, isLoaded, upsertMemo, removeMemo } = useMemos();
  /** 바꾼 것이 있는 채 고른 메모 — 확인 뒤 연다 (undefined = 확인 중 아님, null = 새 메모) */
  const [pendingSelection, setPendingSelection] = useState<Memo | null | undefined>(undefined);
  const hasOpenedFirst = useRef(false);

  const form = useMemoForm({
    initialMemo: null,
    onSaved: (saved: Memo) => {
      upsertMemo(saved);
      onChanged?.();
    },
    onDeleted: (id: Id) => {
      removeMemo(id);
      // 지운 뒤 남은 맨 위 메모(없으면 새 메모)를 연다. form은 이 콜백이 불릴 때(삭제 뒤)에는 이미 있다
      form.load(pickMemoAfterDelete(memos, id));
      onChanged?.();
    },
  });

  // 다른 메모로 바꿀지 묻는 중에는 Esc가 그 확인만 닫는다 (창 닫기 확인이 겹치지 않게)
  useEffect(() => {
    if (pendingSelection === undefined) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      setPendingSelection(undefined);
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [pendingSelection]);

  // 'n개'로 열었으면 목록을 받은 뒤 맨 위 메모를 연다 (확인 부탁)
  useEffect(() => {
    if (startWith !== 'list' || !isLoaded || hasOpenedFirst.current) return;
    hasOpenedFirst.current = true;
    if (memos[0]) form.load(memos[0]);
  }, [form, isLoaded, memos, startWith]);

  const requestSelect = (next: Memo | null) => {
    if (form.isDirty) setPendingSelection(next);
    else form.load(next);
  };

  return (
    <DialogFrame
      title="메모"
      onClose={onClose}
      isDirty={form.isDirty}
      widthClassName="fold:w-[600px]"
      footer={<MemoDialogFooter formId={formId} form={form} />}
    >
      <div className="flex min-h-0 flex-1 gap-3.5 fold:h-[560px]">
        <div className="flex w-[190px] shrink-0 flex-col gap-2 overflow-y-auto">
          <ul aria-label="메모 목록" className="flex flex-col gap-2">
            {memos.map((item) => (
              <li key={item.id}>
                <MemoListButton memo={item} isSelected={form.memo?.id === item.id} onSelect={() => requestSelect(item)} />
              </li>
            ))}
          </ul>
          {isLoaded && memos.length === 0 && <EmptyMemoMessage />}
          <button
            type="button"
            onClick={() => requestSelect(null)}
            aria-pressed={!form.isEdit}
            className="flex items-center justify-center gap-1 rounded-[10px] border border-dashed border-tp-secondary-line p-2 text-[13px] text-tp-muted"
          >
            <Icon name="plus" size={14} />
            새 메모
          </button>
        </div>
        <MemoFields formId={formId} form={form} />
      </div>

      {pendingSelection !== undefined && (
        <DiscardConfirm
          onKeepEditing={() => setPendingSelection(undefined)}
          onDiscard={() => {
            form.load(pendingSelection);
            setPendingSelection(undefined);
          }}
        />
      )}
    </DialogFrame>
  );
}

// ---------------------------------------------------------------- 작은 부품

interface MemoListButtonProps {
  memo: Memo;
  isSelected: boolean;
  onSelect: () => void;
}

function MemoListButton({ memo, isSelected, onSelect }: MemoListButtonProps) {
  const preview = getMemoPreview(memo);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isSelected ? 'true' : undefined}
      className={`flex w-full flex-col gap-0.5 rounded-[10px] border px-3 py-2.5 text-left ${
        isSelected ? 'border-tp-primary bg-tp-secondary text-tp-on-secondary' : 'border-tp-line'
      }`}
    >
      <span className="w-full truncate text-sm font-semibold">{getMemoHeading(memo)}</span>
      {preview && <span className="w-full truncate text-xs text-tp-muted">{preview}</span>}
    </button>
  );
}

/** 아래 버튼 줄: 삭제 | 닫기 · 저장 */
function MemoDialogFooter({ formId, form }: { formId: string; form: MemoForm }) {
  const requestClose = useDialogRequestClose();
  return (
    <>
      <MemoDeleteButtons form={form} label="삭제" />
      <div className="ml-auto flex gap-2">
        <ThemeButton size="md" onClick={requestClose}>
          닫기
        </ThemeButton>
        <ThemeButton type="submit" form={formId} size="md" variant="primary" disabled={!form.canSave}>
          {form.isSubmitting ? '저장 중…' : '저장'}
        </ThemeButton>
      </div>
    </>
  );
}
