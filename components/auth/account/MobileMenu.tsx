"use client";

import { useEffect } from 'react';

import ThemeButton from '@components/button/ThemeButton';
import Icon from '@components/icons/LineIcon';

import { SETTINGS_ACCOUNT_LABEL } from './AccountMenuButton';

/**
 * MobileMenu - 모바일 ≡ 메뉴 (MO-02). 머리: 왼쪽 <, 가운데 '메뉴' (D-022).
 * 계정 기능은 겹쳐 두지 않고 [설정 및 계정] 하나로 같은 전체 화면을 연다 (D-109).
 * Todo·D-Day·일기·메모·카테고리 항목은 US-28에서 위에 더한다.
 */
export default function MobileMenu({ onClose, onOpenSettings }: { onClose: () => void; onOpenSettings: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
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
        <ThemeButton size="md" className="w-full justify-center gap-2" onClick={onOpenSettings}>
          <Icon name="gear" size={18} />
          {SETTINGS_ACCOUNT_LABEL}
        </ThemeButton>
      </div>
    </div>
  );
}
