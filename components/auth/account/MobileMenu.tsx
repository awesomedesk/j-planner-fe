"use client";

import { useEffect } from 'react';

import Icon from '@components/icons/LineIcon';

import AccountMenuItems from './AccountMenuItems';

/**
 * MobileMenu - 모바일 ≡ 메뉴 (MO-02). 머리: 왼쪽 <, 가운데 '메뉴' (D-022).
 * 지금은 맨 아래 계정 항목만 (US-34, D-072). Todo·D-Day·일기·메모·카테고리·설정 항목은 US-28에서 위에 더한다.
 */
export default function MobileMenu({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('[role="alertdialog"]')) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="메뉴" className="fixed inset-0 z-[60] flex flex-col bg-tp-bg text-tp-text">
      <div className="relative flex h-[52px] shrink-0 items-center justify-center bg-tp-primary px-3 text-tp-on-primary">
        <button
          type="button"
          aria-label="메뉴 닫기"
          onClick={onClose}
          className="absolute left-3 inline-flex h-11 w-11 items-center justify-center"
        >
          <Icon name="chevronLeft" size={20} />
        </button>
        <h2 className="text-[17px] font-bold">메뉴</h2>
      </div>
      {/* US-28 항목 자리 */}
      <div className="flex-1" />
      <div className="border-t border-tp-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AccountMenuItems />
      </div>
    </div>
  );
}
