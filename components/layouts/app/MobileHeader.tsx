"use client";

import ThemeButton from '@components/button/ThemeButton';
import Icon from '@components/icons/LineIcon';
import type { CalendarViewMode } from '@/types/calendar';

import { MOBILE_VIEW_MODE_LABEL } from './appLayoutUtils';

interface MobileHeaderProps {
  /** 가운데 날짜 제목 (월간 `2026년 9월`, 주간 `9월 20일 – 26일`) */
  title: string;
  viewMode: CalendarViewMode;
  onClickMenu?: () => void;
  onClickSettings?: () => void;
  className?: string;
}

/**
 * MobileHeader - 모바일 헤더 (768px 미만, MO-01·FOLD-01)
 * 위 줄: 메뉴 · 제목(날짜) · 설정
 * 아래 줄: 화면 선택 드롭다운 · 오늘 | 카테고리 필터
 * 메뉴(US-28)·화면 선택(US-09)·필터(US-11)·설정(US-26)은 각 스토리에서 동작을 붙인다.
 */
export default function MobileHeader({ title, viewMode, onClickMenu, onClickSettings, className = '' }: MobileHeaderProps) {
  return (
    <div className={`shrink-0 flex-col ${className}`}>
      <header className="flex h-[52px] items-center justify-between bg-tp-primary px-3 text-tp-on-primary">
        <button type="button" aria-label="메뉴" onClick={onClickMenu} className="inline-flex h-11 w-11 items-center justify-center">
          <Icon name="menu" size={20} />
        </button>
        <h1 className="text-[17px] font-bold">
          {title}
        </h1>
        <button type="button" aria-label="설정" onClick={onClickSettings} className="inline-flex h-11 w-11 items-center justify-center">
          <Icon name="gear" size={20} />
        </button>
      </header>

      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <ThemeButton aria-haspopup="listbox" aria-label="화면 선택" className="text-sm font-bold">
            {MOBILE_VIEW_MODE_LABEL[viewMode]}
            <Icon name="chevronDown" size={14} />
          </ThemeButton>
          <ThemeButton>오늘</ThemeButton>
        </div>
        <ThemeButton aria-haspopup="listbox" aria-label="카테고리 필터" className="text-xs">
          <Icon name="filter" size={14} />
          <span>전체</span>
          <Icon name="chevronDown" size={14} />
        </ThemeButton>
      </div>
    </div>
  );
}
