"use client";

import { useCallback, useEffect, useId, useRef, useState } from 'react';

import ThemeButton from '@components/button/ThemeButton';
import Icon from '@components/icons/LineIcon';
import { useFocusTrap } from '@utils/hooks/useFocusTrap';

import AccountMenuItems from './AccountMenuItems';

export const SETTINGS_ACCOUNT_LABEL = '설정 및 계정';

/**
 * AccountMenuButton - PC·태블릿 헤더 맨 끝 ⚙ 하나 = '설정 및 계정' (D-109, US-34 D-072)
 * 이름 첫 글자·아바타는 쓰지 않는다. 누르면 아래 오른쪽 정렬 메뉴(제목 '설정 및 계정', 머리 [×] 닫기).
 * 달력이 보이는 모달 (D-117, #382 승인 803ad5e): 열면 [닫기]에 초점, Tab·Shift+Tab은 메뉴 안에서 돌고,
 * 바깥 누름(뒤 달력으로 가지 않음)·Esc·[닫기]로 닫으면 ⚙로 초점이 돌아온다.
 * 모든 기기 확인 창이 열려 있으면 첫 Esc는 확인 창이 먼저 받아(캡처 단계) 메뉴는 그대로.
 * 로그인 정보가 없으면(둘러보기) 메뉴 안에 계정 내용이 빠진다 (AccountMenuItems).
 */
export default function AccountMenuButton() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const titleId = useId();

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  useFocusTrap(panelRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  return (
    <div className="relative">
      <ThemeButton
        ref={triggerRef}
        data-account-entry="gear"
        iconOnly
        size="md"
        aria-label={SETTINGS_ACCOUNT_LABEL}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((open) => !open)}
        className="min-h-11 min-w-11"
      >
        <Icon name="gear" size={18} />
      </ThemeButton>
      {isOpen && (
        <>
          {/* 바깥 누름을 받아 닫는 투명한 막 (뒤 달력은 눌리지 않음, 배경은 어둡게 하지 않음) */}
          <div data-testid="settings-account-backdrop" aria-hidden="true" className="fixed inset-0 z-40" onClick={close} />
          <div
            ref={panelRef}
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute right-0 top-full z-50 mt-2 max-h-[calc(100dvh-80px)] w-[300px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-xl border border-tp-line bg-tp-bg p-3 text-tp-text shadow-lg"
          >
            <div className="flex items-center justify-between pb-2 pl-1">
              <h2 id={titleId} className="text-base font-bold">
                {SETTINGS_ACCOUNT_LABEL}
              </h2>
              <button
                ref={closeRef}
                type="button"
                aria-label="닫기"
                onClick={close}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-tp-muted hover:bg-tp-panel"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <AccountMenuItems entry="gear" />
          </div>
        </>
      )}
    </div>
  );
}
