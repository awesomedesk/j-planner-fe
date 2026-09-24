"use client";

import { useEffect, useState } from 'react';

import Icon from '@components/icons/LineIcon';

import { ADD_MENU_ITEMS, type AddTarget } from './addMenuItems';

interface MobileAddMenuProps {
  onSelect: (target: AddTarget) => void;
  className?: string;
}

/**
 * MobileAddMenu - 모바일 오른쪽 아래 + 버튼 → 추가 선택 (MO-07, D-021)
 * + 버튼이 ×로 바뀌고 일정 / Todo / D-Day 선택지가 위로 펼쳐진다. 바깥을 누르면 닫힌다.
 */
export default function MobileAddMenu({ onSelect, className = '' }: MobileAddMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className={className}>
      {isOpen && <div className="fixed inset-0 z-20 bg-black/45" aria-hidden="true" onClick={() => setIsOpen(false)} />}

      <div className="fixed bottom-5 right-4 z-20 flex flex-col items-end gap-3">
        {isOpen && (
          <div role="menu" aria-label="추가할 항목" className="flex flex-col items-end gap-3">
            {ADD_MENU_ITEMS.map((item) => (
              <div key={item.target} className={`flex items-center gap-2.5 ${item.enabled ? '' : 'opacity-50'}`}>
                <span className="rounded-lg bg-white px-2.5 py-1.5 text-[13px] font-bold text-[#26301F] shadow-[0_2px_8px_rgba(0,0,0,0.15)]" aria-hidden="true">
                  {item.label}
                </span>
                <button
                  type="button"
                  role="menuitem"
                  aria-label={`${item.label} 추가`}
                  disabled={!item.enabled}
                  onClick={() => {
                    setIsOpen(false);
                    onSelect(item.target);
                  }}
                  className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-full bg-tp-secondary text-tp-on-secondary shadow-[0_2px_8px_rgba(0,0,0,0.2)] disabled:cursor-not-allowed"
                >
                  <Icon name={item.icon} size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          aria-label={isOpen ? '추가 닫기' : '추가'}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-tp-primary text-tp-on-primary shadow-[0_6px_16px_rgba(0,0,0,0.25)]"
        >
          <Icon name={isOpen ? 'close' : 'plus'} size={24} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
