"use client";

import { useEffect, useId, useRef } from 'react';

import Icon from '@components/icons/LineIcon';

import { SETTINGS_ACCOUNT_LABEL } from './AccountMenuButton';
import AccountMenuItems from './AccountMenuItems';

/**
 * SettingsAccountScreen - 모바일 '설정 및 계정' 전체 화면 (D-109, MO-16 자리)
 * 머리 ⚙와 ≡ 메뉴의 [설정 및 계정]이 같이 연다. 내용은 PC 메뉴와 같은 AccountMenuItems.
 * 열리면 [닫기]로 초점, 닫으면 연 버튼으로 초점을 돌려준다. 모든 기기 확인 창이 떠 있으면 Esc는 그 창이 먼저 받는다.
 */
export default function SettingsAccountScreen({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('[role="alertdialog"]')) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-[60] flex flex-col bg-tp-bg text-tp-text">
      <div className="relative flex h-[52px] shrink-0 items-center justify-center bg-tp-primary px-3 text-tp-on-primary">
        <button
          ref={closeRef}
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute left-3 inline-flex h-11 w-11 items-center justify-center"
        >
          <Icon name="chevronLeft" size={20} />
        </button>
        <h2 id={titleId} className="text-[17px] font-bold">
          {SETTINGS_ACCOUNT_LABEL}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AccountMenuItems />
      </div>
    </div>
  );
}
