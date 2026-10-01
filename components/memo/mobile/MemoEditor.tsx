"use client";

import { useId } from 'react';

import type { Id, Memo } from '@/types/api';
import ThemeButton from '@components/button/ThemeButton';
import DialogFrame, { useDialogRequestClose } from '@components/dialog/DialogFrame';

import { useMemoForm, type MemoForm } from '../hooks/useMemoForm';
import MemoDeleteButtons from '../MemoDeleteButtons';
import MemoFields from '../MemoFields';

interface MemoEditorProps {
  /** null = 새 메모 */
  memo: Memo | null;
  onClose: () => void;
  onSaved: (memo: Memo) => void;
  onDeleted: (id: Id) => void;
}

/**
 * MemoEditor - 모바일 메모 편집 (MO-15)
 * 머리: '<' 뒤로 · 메모 · 저장 (D-049, D-030). 600px 이상(폴드)은 가운데 창 (D-018).
 * 새 메모를 비운 채 뒤로 가면 안내 없이 버린다 (D-032), 바꾼 것이 있으면 "작성을 취소할까요?" (D-037).
 */
export default function MemoEditor({ memo, onClose, onSaved, onDeleted }: MemoEditorProps) {
  const formId = useId();
  const form = useMemoForm({ initialMemo: memo, onSaved, onDeleted });

  return (
    <DialogFrame
      title="메모"
      onClose={onClose}
      isDirty={form.isDirty}
      mobileHeaderAction={
        <button type="submit" form={formId} disabled={!form.canSave} className="h-11 min-w-11 px-2 text-[15px] font-bold disabled:opacity-50">
          저장
        </button>
      }
      footer={<MemoEditorFooter formId={formId} form={form} />}
    >
      <MemoFields formId={formId} form={form} footerAction={<MemoDeleteButtons form={form} label="메모 삭제" />} />
    </DialogFrame>
  );
}

/** 600px 이상 아래 버튼 줄: 취소 · 저장 */
function MemoEditorFooter({ formId, form }: { formId: string; form: MemoForm }) {
  const requestClose = useDialogRequestClose();
  return (
    <div className="ml-auto flex gap-2">
      <ThemeButton size="md" onClick={requestClose}>
        취소
      </ThemeButton>
      <ThemeButton type="submit" form={formId} size="md" variant="primary" disabled={!form.canSave}>
        저장
      </ThemeButton>
    </div>
  );
}
