"use client";

import { useEffect, useRef, useState } from 'react';

import ThemeButton from '@components/button/ThemeButton';
import Icon from '@components/icons/LineIcon';

import { ADD_MENU_ITEMS, type AddTarget } from './addMenuItems';

interface PcAddMenuProps {
  onSelect: (target: AddTarget) => void;
}

/**
 * PcAddMenu - PC·태블릿 헤더의 '추가' → 일정 / Todo / D-Day 선택 (PC-01 ④)
 * 1024px 이상은 '+ 추가', 768~1023px은 아이콘만 (TAB-01)
 * 바깥을 누르거나 Esc를 누르면 닫힌다.
 */
export default function PcAddMenu({ onSelect }: PcAddMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <div ref={containerRef} className="relative">
      {/* 버튼 하나로: 1024px 이상은 아이콘+글자, 768~1023px은 아이콘만 (글자는 화면에서만 숨기고 이름은 남김) */}
      <ThemeButton
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="h-9 w-9 justify-center !p-0 pc:h-auto pc:w-auto pc:!px-3 pc:!py-1.5"
      >
        <Icon name="plus" />
        <span className="sr-only pc:not-sr-only">추가</span>
      </ThemeButton>

      {isOpen && (
        <div
          role="menu"
          aria-label="추가할 항목"
          className="absolute right-0 top-full z-40 mt-2 flex w-40 flex-col gap-0.5 rounded-xl border border-tp-line bg-tp-bg p-1.5 text-tp-text shadow-lg"
        >
          {ADD_MENU_ITEMS.map((item) => (
            <button
              key={item.target}
              type="button"
              role="menuitem"
              disabled={!item.enabled}
              onClick={() => {
                setIsOpen(false);
                onSelect(item.target);
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-tp-panel disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <Icon name={item.icon} size={16} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
