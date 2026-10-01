"use client";

import { useEffect, useRef, useState } from 'react';

import type { Category } from '@/types/api';
import type { CategoryFilter } from '@/types/calendar';
import ThemeButton from '@components/button/ThemeButton';
import Icon from '@components/icons/LineIcon';

import { categoryFilterLabel, selectedCategoryIds, toCategoryFilter } from '../utils/categoryFilterUtils';

import CategoryFilterList from './CategoryFilterList';

export interface CategoryFilterProps {
  categories: Category[];
  filter: CategoryFilter;
  onChange: (filter: CategoryFilter) => void;
  /** '카테고리 관리' → OV-04 (D-016) */
  onOpenManager: () => void;
}

/**
 * CategoryFilterDropdown - PC·태블릿 헤더의 카테고리 필터 (US-11, D-015, PC-01 ③⑨)
 * - 버튼 '카테고리: 전체 ▾' / 고르면 '카테고리: 2개'. 태블릿은 '전체' / '2개'만
 * - 체크하면 바로 적용 (달력이 곧바로 다시 받는다). 맨 아래 '카테고리 관리'
 * - 바깥을 누르거나 Esc면 닫힌다
 */
export default function CategoryFilterDropdown({ categories, filter, onChange, onOpenManager }: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const label = categoryFilterLabel(filter, categories);

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
      <ThemeButton aria-haspopup="dialog" aria-expanded={isOpen} aria-label={`카테고리 필터: ${label}`} onClick={() => setIsOpen((v) => !v)}>
        <Icon name="filter" size={14} />
        <span className="hidden pc:inline">카테고리: {label}</span>
        <span className="pc:hidden" aria-hidden="true">
          {label}
        </span>
        <Icon name="chevronDown" size={14} />
      </ThemeButton>

      {isOpen && (
        <div
          role="dialog"
          aria-label="카테고리 선택"
          className="absolute right-0 top-[calc(100%+8px)] z-30 flex w-[250px] flex-col gap-1.5 rounded-xl border border-tp-line bg-tp-bg p-2.5 text-tp-text shadow-[0_10px_28px_rgba(0,0,0,0.18)]"
        >
          <CategoryFilterList
            size="pc"
            categories={categories}
            checkedIds={selectedCategoryIds(filter, categories)}
            onChange={(ids) => onChange(toCategoryFilter(ids, categories))}
          />
          <div className="border-t border-tp-line pt-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenManager();
              }}
              className="text-xs font-semibold text-tp-primary hover:underline"
            >
              카테고리 관리
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
