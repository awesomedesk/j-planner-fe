"use client";

import ThemeButton from '@components/button/ThemeButton';
import ModalShell from '@components/dialog/ModalShell';

interface DdayDeleteConfirmProps {
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * D-Day 삭제 확인 (06 D-Day 입력 창, D-030) — 입력 창의 [삭제]와 모바일 밀어서 삭제가 같이 쓴다
 * [취소]에 처음 초점(창 안 첫 버튼). Esc·바깥은 취소와 같고, 닫히면 연 버튼으로 초점이 돌아간다
 */
export default function DdayDeleteConfirm({ onCancel, onConfirm }: DdayDeleteConfirmProps) {
  return (
    <ModalShell role="alertdialog" title="이 D-Day를 지울까요?" description="달력 표시도 함께 사라져요." onCancel={onCancel}>
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
