"use client";

import { useEffect, useId, useRef } from 'react';

import Icon from '@components/icons/LineIcon';
import { useFocusTrap } from '@utils/hooks/useFocusTrap';

import { SETTINGS_ACCOUNT_LABEL } from './AccountMenuButton';
import AccountMenuItems from './AccountMenuItems';
import type { AccountEntry } from './accountReturnFocus';

/**
 * SettingsAccountScreen - 모바일 '설정 및 계정' 전체 화면 (D-109, MO-16 자리)
 * 머리 ⚙와 ≡ 메뉴의 [설정 및 계정]이 같이 연다. 내용은 PC 메뉴와 같은 AccountMenuItems.
 * 열리면 머리 오른쪽 [× 닫기]로 초점, Tab은 화면 안에서 돌고(D-117), 닫으면 연 버튼으로 초점을 돌려준다.
 * 모든 기기 확인 창이 떠 있으면 Esc는 그 창이 먼저 받는다. entry = 연 버튼(⚙ / ≡), [내 계정]에서 돌아올 때 쓴다.
 */
export default function SettingsAccountScreen({ entry, onClose }: { entry: AccountEntry; onClose: () => void }) {
  const titleId = useId();
  const screenRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useFocusTrap(screenRef);

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
    <div ref={screenRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-[60] flex flex-col bg-tp-bg text-tp-text">
      {/* 계정 화면은 '뒤로'보다 '닫기'에 가까워 × (#382 승인 803ad5e, #366 ④ 닫기/뒤로 허용) */}
      <div className="relative flex h-[52px] shrink-0 items-center justify-center bg-tp-primary px-3 text-tp-on-primary">
        <h2 id={titleId} className="text-[17px] font-bold">
          {SETTINGS_ACCOUNT_LABEL}
        </h2>
        <button
          ref={closeRef}
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute right-3 inline-flex h-11 w-11 items-center justify-center"
        >
          <Icon name="close" size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AccountMenuItems entry={entry} />
      </div>
    </div>
  );
}
