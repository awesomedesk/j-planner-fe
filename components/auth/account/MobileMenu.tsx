"use client";

import { useEffect, useRef } from 'react';

import type { SidebarItemType } from '@/types/calendar';
import ThemeButton from '@components/button/ThemeButton';
import Icon, { type IconName } from '@components/icons/LineIcon';
import { SIDEBAR_SECTIONS, type MobileMenuTab } from '@components/sidebar/sidebarItems';

import { SETTINGS_ACCOUNT_LABEL } from './AccountMenuButton';

export interface MobileMenuProps {
  /** 기능 항목: 사이드바 순서의 Todo·D-Day·일기·메모 (buildMobileMenuTabs) */
  items: MobileMenuTab[];
  /** 기능 항목 → 오늘 날짜 일간의 그 탭 (D-049) */
  onOpenTab: (key: SidebarItemType) => void;
  /** 카테고리 → 카테고리 관리 전체 화면 (MO-21) */
  onOpenCategories: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
}

const iconOf = (key: SidebarItemType): IconName => SIDEBAR_SECTIONS.find((section) => section.type === key)?.icon ?? 'menu';

const ROW_CLASS =
  'flex h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px] font-semibold hover:bg-tp-panel disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

/**
 * MobileMenu - 모바일 ≡ 메뉴 (MO-02, US-28). 머리: 왼쪽 < (메뉴 닫기), 가운데 '메뉴' (D-022).
 * 항목: Todo · D-Day · 일기 · 메모 → 카테고리 → [설정 및 계정] (D-109의 연결 한 개). '오늘'·별도 '설정'은 두지 않는다 (D-021).
 * 아직 내용이 없는 탭은 흐리게·눌리지 않게 (D-040). 열리면 '<'에 초점, 닫히면 연 버튼(≡)으로 돌려준다.
 */
export default function MobileMenu({ items, onOpenTab, onOpenCategories, onOpenSettings, onClose }: MobileMenuProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);

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
          ref={closeRef}
          type="button"
          aria-label="메뉴 닫기"
          onClick={onClose}
          className="absolute left-3 inline-flex h-11 w-11 items-center justify-center"
        >
          <Icon name="chevronLeft" size={20} />
        </button>
        <h2 className="text-[17px] font-bold">메뉴</h2>
      </div>

      <nav aria-label="기능" className="flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.key}>
              <button type="button" disabled={!item.enabled} onClick={() => onOpenTab(item.key)} className={ROW_CLASS}>
                <Icon name={iconOf(item.key)} size={20} className="text-tp-muted" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="my-2 border-t border-tp-line" />
        <button type="button" onClick={onOpenCategories} className={ROW_CLASS}>
          <Icon name="category" size={20} className="text-tp-muted" />
          카테고리
        </button>
      </nav>

      <div className="border-t border-tp-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <ThemeButton size="md" className="w-full justify-center gap-2" onClick={onOpenSettings}>
          <Icon name="gear" size={18} />
          {SETTINGS_ACCOUNT_LABEL}
        </ThemeButton>
      </div>
    </div>
  );
}
