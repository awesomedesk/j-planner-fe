"use client";

import { createContext, useCallback, useContext, useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';

import Icon from '@components/icons/LineIcon';

import DiscardConfirm from './DiscardConfirm';

interface DialogFrameProps {
  title: string;
  /** 실제로 닫는다 (확인이 끝난 뒤 불림) */
  onClose: () => void;
  /** 입력하거나 바꾼 것이 있으면 true → 닫기 전에 "작성을 취소할까요?" (D-037) */
  isDirty?: boolean;
  children: ReactNode;
  /** 아래 버튼 줄 (600px 이상에서만 보임) */
  footer?: ReactNode;
  /** 모바일(600px 미만) 머리 오른쪽 버튼. 예: 저장 (MO-08) */
  mobileHeaderAction?: ReactNode;
  /** 600px 이상에서 창 폭 (기본 552px, 화면기획서 OV 창) */
  widthClassName?: string;
}

/** 창 안의 '취소'·'닫기' 버튼이 부르는 닫기 요청 (바뀐 것이 있으면 확인부터) */
const DialogCloseContext = createContext<() => void>(() => undefined);
export const useDialogRequestClose = () => useContext(DialogCloseContext);

/**
 * DialogFrame - 입력·관리 창의 공통 틀 (D-017, D-037)
 * - 600px 이상: 화면 가운데 창 + 어두운 바깥. 바깥을 누르면 닫힘
 * - 600px 미만: 전체 화면, 머리 왼쪽 '뒤로'
 * - 바깥·Esc·닫기·뒤로·취소 모두 같은 닫기 요청. 바뀐 것이 있으면 확인 창을 먼저 띄운다
 */
export default function DialogFrame({
  title,
  onClose,
  isDirty = false,
  children,
  footer,
  mobileHeaderAction,
  widthClassName = 'fold:w-[552px]',
}: DialogFrameProps) {
  const titleId = useId();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const requestClose = useCallback(() => {
    if (isDirty) setIsConfirmOpen(true);
    else onClose();
  }, [isDirty, onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (isConfirmOpen) setIsConfirmOpen(false);
      else requestClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConfirmOpen, requestClose]);

  return (
    <DialogCloseContext.Provider value={requestClose}>
      <div className="fixed inset-0 z-50 flex fold:items-center fold:justify-center fold:p-6">
        <div data-testid="dialog-backdrop" className="absolute inset-0 hidden bg-black/45 fold:block" aria-hidden="true" onClick={requestClose} />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`relative flex h-full w-full flex-col overflow-hidden bg-tp-bg text-tp-text fold:h-auto fold:max-h-full fold:rounded-2xl fold:shadow-2xl ${widthClassName}`}
        >
          <div className="flex h-[52px] shrink-0 items-center justify-between gap-1 bg-tp-primary px-2 text-tp-on-primary fold:h-auto fold:px-5 fold:py-4">
            <button type="button" onClick={requestClose} aria-label="뒤로" className="inline-flex h-11 w-11 items-center justify-center fold:hidden">
              <Icon name="chevronLeft" />
            </button>
            <h2 id={titleId} className="text-[17px] font-bold">
              {title}
            </h2>
            <div className="flex min-w-11 justify-end fold:hidden">{mobileHeaderAction}</div>
            <button type="button" onClick={requestClose} aria-label="닫기" className="hidden h-8 w-8 items-center justify-center fold:inline-flex">
              <Icon name="close" size={18} />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-3 fold:px-5 fold:py-5">{children}</div>
          {footer && (
            <div className="hidden shrink-0 items-center justify-between gap-3 border-t border-tp-line px-5 py-3.5 fold:flex">{footer}</div>
          )}
        </div>

        {isConfirmOpen && <DiscardConfirm onKeepEditing={() => setIsConfirmOpen(false)} onDiscard={onClose} />}
      </div>
    </DialogCloseContext.Provider>
  );
}
