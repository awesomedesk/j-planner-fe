"use client";

import { useId } from 'react';

import ThemeButton from '@components/button/ThemeButton';

/** "작성을 취소할까요?" 확인 창 문구 */
export const DISCARD_CONFIRM = {
  title: '작성을 취소할까요?',
  description: '입력하거나 바꾼 내용은 저장되지 않아요.',
  confirm: '작성 취소',
  cancel: '계속 작성',
} as const;

interface DiscardConfirmProps {
  onKeepEditing: () => void;
  onDiscard: () => void;
}

/**
 * DiscardConfirm - 입력 중 닫을 때 묻는 확인 창 (D-037)
 * 일정 입력 창(DialogFrame)과 빠른 추가(US-10)가 같이 쓴다. Esc 처리는 띄운 쪽이 맡는다.
 */
export default function DiscardConfirm({ onKeepEditing, onDiscard }: DiscardConfirmProps) {
  const titleId = useId();
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/45" aria-hidden="true" onClick={onKeepEditing} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex w-full max-w-[320px] flex-col gap-2 rounded-2xl bg-tp-bg p-5 text-tp-text shadow-2xl"
      >
        <h3 id={titleId} className="text-base font-bold">
          {DISCARD_CONFIRM.title}
        </h3>
        <p className="text-sm text-tp-muted">{DISCARD_CONFIRM.description}</p>
        <div className="mt-3 flex justify-end gap-2">
          <ThemeButton size="md" onClick={onKeepEditing} autoFocus>
            {DISCARD_CONFIRM.cancel}
          </ThemeButton>
          <ThemeButton size="md" variant="primary" onClick={onDiscard}>
            {DISCARD_CONFIRM.confirm}
          </ThemeButton>
        </div>
      </div>
    </div>
  );
}
