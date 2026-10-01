"use client";

import { useEffect, useRef, useState } from 'react';

import ThemeButton from '@components/button/ThemeButton';
import Icon from '@components/icons/LineIcon';
import type { CalendarViewMode } from '@/types/calendar';

import { MOBILE_VIEW_MODE_LABEL, MOBILE_VIEW_OPTIONS } from './appLayoutUtils';

interface MobileHeaderProps {
  /** 가운데 날짜 제목 (월간 `2026년 9월`, 주간 `9월 20일 – 26일`) */
  title: string;
  viewMode: CalendarViewMode;
  onChangeViewMode: (viewMode: CalendarViewMode) => void;
  /** 화면 선택 줄의 '오늘' (US-09, D-048: 하나만) */
  onToday: () => void;
  onClickMenu?: () => void;
  onClickSettings?: () => void;
  className?: string;
}

/**
 * MobileHeader - 모바일 헤더 (768px 미만, MO-01·FOLD-01)
 * 위 줄: 메뉴 · 제목(날짜) · 설정
 * 아래 줄(화면 선택 줄): 화면 선택 드롭다운 · 오늘 | 카테고리 필터
 * 날짜를 옮기는 것은 달력을 좌우로 밀어서 한다 (D-025). 메뉴(US-28)·필터(US-11)·설정(US-26)은 각 스토리에서.
 */
export default function MobileHeader({
  title,
  viewMode,
  onChangeViewMode,
  onToday,
  onClickMenu,
  onClickSettings,
  className = '',
}: MobileHeaderProps) {
  return (
    <header aria-label="모바일 머리" className={`shrink-0 flex-col ${className}`}>
      <div className="flex h-[52px] items-center justify-between bg-tp-primary px-3 text-tp-on-primary">
        <button type="button" aria-label="메뉴" onClick={onClickMenu} className="inline-flex h-11 w-11 items-center justify-center">
          <Icon name="menu" size={20} />
        </button>
        <h1 className="text-[17px] font-bold">{title}</h1>
        <button type="button" aria-label="설정" onClick={onClickSettings} className="inline-flex h-11 w-11 items-center justify-center">
          <Icon name="gear" size={20} />
        </button>
      </div>

      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <ViewModeSelect viewMode={viewMode} onChange={onChangeViewMode} />
          <ThemeButton onClick={onToday}>오늘</ThemeButton>
        </div>
        <ThemeButton aria-haspopup="listbox" aria-label="카테고리 필터" className="text-xs">
          <Icon name="filter" size={14} />
          <span>전체</span>
          <Icon name="chevronDown" size={14} />
        </ThemeButton>
      </div>
    </header>
  );
}

/** 화면 선택 드롭다운: 월간 / 주간 / 3일 / 일간 / 목록 (D-022, D-025). 바깥을 누르거나 Esc면 닫힌다 */
function ViewModeSelect({ viewMode, onChange }: { viewMode: CalendarViewMode; onChange: (viewMode: CalendarViewMode) => void }) {
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

  return (
    <div ref={containerRef} className="relative">
      <ThemeButton
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="화면 선택"
        className="text-sm font-bold"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {MOBILE_VIEW_MODE_LABEL[viewMode]}
        <Icon name="chevronDown" size={14} />
      </ThemeButton>

      {isOpen && (
        <ul
          role="listbox"
          aria-label="화면 선택"
          className="absolute left-0 top-full z-40 mt-1.5 flex w-32 flex-col gap-0.5 rounded-xl border border-tp-line bg-tp-bg p-1.5 text-tp-text shadow-lg"
        >
          {MOBILE_VIEW_OPTIONS.map((option) => {
            const isSelected = option.mode === viewMode;
            const isDisabled = option.mode === null;
            return (
              <li
                key={option.label}
                role="option"
                aria-selected={isSelected}
                aria-disabled={isDisabled || undefined}
                onClick={() => {
                  if (!option.mode) return;
                  setIsOpen(false);
                  onChange(option.mode);
                }}
                className={`rounded-lg px-3 py-2 text-sm ${isSelected ? 'bg-tp-panel font-bold' : 'font-medium'} ${
                  isDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-tp-panel'
                }`}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
