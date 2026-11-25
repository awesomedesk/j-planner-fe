"use client";

import ThemeButton from '@components/button/ThemeButton';
import ModalShell from '@components/dialog/ModalShell';

/** 일기 삭제 확인 (06 일기 창). [취소]에 처음 초점, Esc·바깥은 취소 */
export default function DiaryDeleteConfirm({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <ModalShell role="alertdialog" title="이날 일기를 지울까요?" description="되돌릴 수 없어요." onCancel={onCancel}>
      <div className="mt-2 flex justify-end gap-2">
        <ThemeButton size="md" onClick={onCancel}>
          취소
        </ThemeButton>
        <ThemeButton size="md" variant="danger" onClick={onConfirm}>
          삭제
        </ThemeButton>
      </div>
    </ModalShell>
  );
}
