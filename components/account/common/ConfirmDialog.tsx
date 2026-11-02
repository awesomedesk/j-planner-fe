"use client";

import { useRef, type ReactNode } from 'react';

import ThemeButton, { themeButtonClass } from '@components/button/ThemeButton';
import { CardError } from '@components/auth/common/AuthFrame';

import ModalShell from '@components/dialog/ModalShell';

interface ConfirmDialogProps {
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  /** 되돌릴 수 없는 일 (탈퇴)이면 danger */
  danger?: boolean;
  /** 보내는 중 — 확인 버튼 잠금 */
  busy?: boolean;
  /** 창 안 오류 줄 (실패를 성공처럼 보이지 않게) */
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 확인 창 (US-37) — [취소]가 기본 초점, [확인 버튼]을 눌러야 보낸다 */
export default function ConfirmDialog({ title, description, confirmLabel, danger = false, busy = false, error = null, onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <ModalShell role="alertdialog" title={title} description={description} onCancel={onCancel} initialFocusRef={cancelRef}>
      <CardError message={error} />
      <div className="flex justify-end gap-2">
        <button ref={cancelRef} type="button" onClick={onCancel} className={themeButtonClass('secondary', 'md')}>
          취소
        </button>
        <ThemeButton size="md" variant={danger ? 'danger' : 'primary'} disabled={busy} onClick={onConfirm}>
          {confirmLabel}
        </ThemeButton>
      </div>
    </ModalShell>
  );
}
