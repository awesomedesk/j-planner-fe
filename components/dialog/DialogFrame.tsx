"use client";

import { useEffect, useId } from 'react';
import type { ReactNode } from 'react';

import Icon from '@components/icons/LineIcon';

interface DialogFrameProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** 아래 버튼 줄 */
  footer?: ReactNode;
  /** 600px 이상에서 창 폭 (기본 552px, 화면기획서 OV 창) */
  widthClassName?: string;
}

/**
 * DialogFrame - 입력·관리 창의 공통 틀 (D-017)
 * - 600px 이상: 화면 가운데 창 + 어두운 바깥
 * - 600px 미만: 전체 화면, 머리 왼쪽 '뒤로'
 * 바깥을 눌러도 닫지 않는다 (입력 내용 보호). Esc로 닫는다.
 */
export default function DialogFrame({ title, onClose, children, footer, widthClassName = 'fold:w-[552px]' }: DialogFrameProps) {
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex fold:items-center fold:justify-center fold:p-6">
      <div className="absolute inset-0 hidden bg-black/45 fold:block" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex h-full w-full flex-col overflow-hidden bg-tp-bg text-tp-text fold:h-auto fold:max-h-full fold:rounded-2xl fold:shadow-2xl ${widthClassName}`}
      >
        <div className="flex h-[52px] shrink-0 items-center gap-1 bg-tp-primary px-2 text-tp-on-primary fold:h-auto fold:justify-between fold:px-5 fold:py-4">
          <button type="button" onClick={onClose} aria-label="뒤로" className="inline-flex h-11 w-11 items-center justify-center fold:hidden">
            <Icon name="chevronLeft" />
          </button>
          <h2 id={titleId} className="text-[17px] font-bold">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="hidden h-8 w-8 items-center justify-center fold:inline-flex">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 fold:px-5 fold:py-5">{children}</div>
        {footer && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-tp-line px-4 py-3.5 fold:px-5">{footer}</div>
        )}
      </div>
    </div>
  );
}
