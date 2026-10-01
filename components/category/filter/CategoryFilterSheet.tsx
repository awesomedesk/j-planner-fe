"use client";

import { useEffect, useState } from 'react';

import type { Id } from '@/types/api';
import ThemeButton from '@components/button/ThemeButton';
import Icon from '@components/icons/LineIcon';

import { categoryFilterLabel, selectedCategoryIds, toCategoryFilter } from '../utils/categoryFilterUtils';

import type { CategoryFilterProps } from './CategoryFilterDropdown';
import CategoryFilterList from './CategoryFilterList';
import { useFilterReveal } from './useFilterReveal';

/**
 * CategoryFilterSheet - 모바일 카테고리 필터 (US-11, MO-06)
 * - 화면 선택 줄 오른쪽 버튼 '전체 ▾' / '2개 ▾'. 누르면 아래에서 시트가 올라온다
 * - 시트 안에서 고른 것은 '적용'을 눌러야 반영. 바깥·Esc로 닫으면 버린다
 * - '관리' → 카테고리 관리 (MO-21)
 * - 필터에서 빠진 카테고리로 저장하면 저절로 펼쳐 그 줄을 보여 주고 잠시 뒤 닫힌다 (D-056)
 */
export default function CategoryFilterSheet({ categories, filter, onChange, onOpenManager, reveal, onRevealDone }: CategoryFilterProps) {
  /** 시트에서 고르는 중인 값 (null = 닫힘) */
  const [draft, setDraft] = useState<Id[] | null>(null);
  const isOpen = draft !== null;
  const revealed = useFilterReveal(reveal, {
    isOpen,
    open: () => setDraft(selectedCategoryIds(filter, categories)),
    close: () => setDraft(null),
    onDone: onRevealDone,
  });
  const label = categoryFilterLabel(filter, categories);
  const close = () => setDraft(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDraft(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <ThemeButton
        data-category-filter-button
        data-reveal-pulse={revealed.pulse || undefined}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`카테고리 필터: ${label}`}
        className={`relative z-[47] text-xs ${revealed.pulse ? 'animate-reveal-pulse' : ''}`}
        onClick={() => setDraft(selectedCategoryIds(filter, categories))}
      >
        <Icon name="filter" size={14} />
        <span aria-hidden="true">{label}</span>
        <Icon name="chevronDown" size={14} />
      </ThemeButton>

      {isOpen && (
        <div className="fixed inset-0 z-50" data-swipe-ignore>
          <div data-testid="category-filter-backdrop" className="absolute inset-0 bg-black/45" aria-hidden="true" onClick={close} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="카테고리 필터"
            {...revealed.panelProps}
            className="absolute inset-x-0 bottom-0 flex max-h-[min(560px,90dvh)] flex-col gap-2.5 rounded-t-[18px] bg-white px-4 pb-4 pt-2 text-ink shadow-[0_-6px_18px_rgba(0,0,0,0.14)]"
          >
            <div className="mx-auto h-1 w-10 shrink-0 rounded-full bg-tp-line" aria-hidden="true" />
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">카테고리</h2>
              <button
                type="button"
                onClick={() => {
                  close();
                  onOpenManager();
                }}
                className="text-[13px] font-semibold text-tp-primary"
              >
                관리
              </button>
            </div>
            <CategoryFilterList
              size="mobile"
              categories={categories}
              checkedIds={draft}
              onChange={setDraft}
              markedId={revealed.markedId}
              glow={revealed.glow}
            />
            <ThemeButton
              variant="primary"
              size="md"
              className="mt-auto w-full shrink-0 justify-center py-3"
              onClick={() => {
                onChange(toCategoryFilter(draft, categories));
                close();
              }}
            >
              적용 ({categoryFilterLabel(toCategoryFilter(draft, categories), categories)})
            </ThemeButton>
          </div>
        </div>
      )}
    </>
  );
}
