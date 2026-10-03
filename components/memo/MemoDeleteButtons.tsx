"use client";

import ThemeButton from '@components/button/ThemeButton';

import type { MemoForm } from './hooks/useMemoForm';

interface MemoDeleteButtonsProps {
  form: MemoForm;
  /** 버튼 글자 (PC '삭제', 모바일 '메모 삭제') */
  label: string;
}

/** 삭제 → '… 확인' + 취소. 두 번 눌러 확인 (D-055, 일정 삭제 D-037과 같은 방식) */
export default function MemoDeleteButtons({ form, label }: MemoDeleteButtonsProps) {
  if (!form.isEdit) return null;
  return (
    <div className="flex items-center gap-2">
      <ThemeButton variant="danger" className="px-0" onClick={() => void form.handleDelete()} disabled={form.isSubmitting}>
        {form.isDeleteConfirming ? `${label} 확인` : label}
      </ThemeButton>
      {form.isDeleteConfirming && <ThemeButton onClick={form.cancelDeleteConfirm}>취소</ThemeButton>}
    </div>
  );
}
