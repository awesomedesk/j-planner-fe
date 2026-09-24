"use client";

import ThemeButton from '@components/button/ThemeButton';
import Icon from '@components/icons/LineIcon';

import { VIEW_MODE_LABEL, formatHeaderMonth, type CalendarViewMode } from './appLayoutUtils';

interface PcHeaderProps {
  baseDate: Date;
  viewMode: CalendarViewMode;
  onChangeViewMode: (viewMode: CalendarViewMode) => void;
  onClickAdd?: () => void;
  onClickSettings?: () => void;
  className?: string;
}

/**
 * PcHeader - PC·태블릿 헤더 한 줄 (D-017, 768px 이상)
 * 서비스명 · 이전/날짜/다음 · 오늘 · 카테고리 필터 · 월/주/일 · 추가 · 설정
 *
 * 태블릿(768~1023px)은 화면기획서 TAB-01처럼 줄여서 보여준다: 오늘 버튼 없음, 필터는 '전체', 추가는 아이콘만.
 * 날짜 이동(US-09)·필터(US-11)·추가(US-05)는 각 스토리에서 동작을 붙인다.
 */
export default function PcHeader({
  baseDate,
  viewMode,
  onChangeViewMode,
  onClickAdd,
  onClickSettings,
  className = '',
}: PcHeaderProps) {
  return (
    <header
      className={`h-[60px] shrink-0 items-center justify-between gap-3 bg-tp-primary px-3 text-tp-on-primary pc:pl-5 pc:pr-4 ${className}`}
    >
      <div className="flex min-w-0 items-center gap-2 pc:gap-2.5">
        <div className="mr-1.5 whitespace-nowrap text-[17px] font-bold pc:mr-[18px] pc:text-[19px]">J&apos;s Planner</div>
        <ThemeButton iconOnly aria-label="이전">
          <Icon name="chevronLeft" />
        </ThemeButton>
        <div className="whitespace-nowrap text-center text-[17px] font-bold pc:min-w-[140px] pc:text-[19px]" suppressHydrationWarning>
          {formatHeaderMonth(baseDate)}
        </div>
        <ThemeButton iconOnly aria-label="다음">
          <Icon name="chevronRight" />
        </ThemeButton>
        <ThemeButton className="hidden pc:inline-flex">오늘</ThemeButton>
      </div>

      <div className="flex items-center gap-2 pc:gap-3">
        <ThemeButton aria-haspopup="listbox" aria-label="카테고리 필터">
          <Icon name="filter" size={14} />
          <span className="hidden pc:inline">카테고리: 전체</span>
          <span className="pc:hidden">전체</span>
          <Icon name="chevronDown" size={14} />
        </ThemeButton>

        <div role="group" aria-label="보기 전환" className="inline-flex gap-0.5 rounded-[10px] border border-tp-line bg-tp-panel p-[3px]">
          {(Object.keys(VIEW_MODE_LABEL) as CalendarViewMode[]).map((mode) => {
            const isActive = mode === viewMode;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={isActive}
                onClick={() => onChangeViewMode(mode)}
                className={`rounded-[7px] px-3.5 py-[7px] text-[13px] ${
                  isActive ? 'bg-tp-primary font-semibold text-tp-on-primary' : 'font-medium text-tp-text'
                }`}
              >
                {VIEW_MODE_LABEL[mode]}
              </button>
            );
          })}
        </div>

        <ThemeButton onClick={onClickAdd} className="hidden pc:inline-flex">
          <Icon name="plus" />
          <span>추가</span>
        </ThemeButton>
        <ThemeButton onClick={onClickAdd} iconOnly size="md" aria-label="추가" className="pc:hidden">
          <Icon name="plus" />
        </ThemeButton>

        <ThemeButton onClick={onClickSettings} iconOnly size="md" aria-label="설정">
          <Icon name="gear" size={18} />
        </ThemeButton>
      </div>
    </header>
  );
}
