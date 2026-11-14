"use client";

import { useEffect, useId, useRef, useState } from 'react';

import ThemeButton from '@components/button/ThemeButton';
import Icon from '@components/icons/LineIcon';

import AccountMenuItems from './AccountMenuItems';

export const SETTINGS_ACCOUNT_LABEL = '설정 및 계정';

/**
 * AccountMenuButton - PC·태블릿 헤더 맨 끝 ⚙ 하나 = '설정 및 계정' (D-109, US-34 D-072)
 * 이름 첫 글자·아바타는 쓰지 않는다. 누르면 아래 오른쪽 정렬 메뉴(제목 '설정 및 계정').
 * 바깥을 누르거나 Esc면 닫힌다. Esc로 닫으면 ⚙로 초점이 돌아온다.
 * 모든 기기 확인 창이 열려 있으면 첫 Esc는 확인 창이 먼저 받아(캡처 단계) 메뉴는 그대로.
 * 로그인 정보가 없으면(둘러보기) 메뉴 안에 계정 내용이 빠진다 (AccountMenuItems).
 */
export default function AccountMenuButton() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element;
      // 확인 창(모든 기기 로그아웃)은 메뉴 밖에 떠도 메뉴의 일부
      if (containerRef.current?.contains(target) || target.closest?.('[role="alertdialog"]')) return;
      setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      containerRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <ThemeButton
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
        <div
          id={menuId}
          role="dialog"
          aria-labelledby={titleId}
          className="absolute right-0 top-full z-50 mt-2 max-h-[calc(100dvh-80px)] w-[300px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-xl border border-tp-line bg-tp-bg p-3 text-tp-text shadow-lg"
        >
          <h2 id={titleId} className="px-1 pb-2 text-base font-bold">
            {SETTINGS_ACCOUNT_LABEL}
          </h2>
          <AccountMenuItems />
        </div>
      )}
    </div>
  );
}
