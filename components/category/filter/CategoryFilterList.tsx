"use client";

import { useState } from 'react';

import type { Category, Id } from '@/types/api';
import ThemeButton from '@components/button/ThemeButton';

import { getCategoryListColor } from '../utils/categoryUtils';
import { searchCategories } from '../utils/categoryFilterUtils';

interface CategoryFilterListProps {
  categories: Category[];
  checkedIds: Id[];
  onChange: (checkedIds: Id[]) => void;
  /** PC 드롭다운(작게) / 모바일 시트(손가락 크기) */
  size: 'pc' | 'mobile';
}

/**
 * CategoryFilterList - 카테고리 필터의 본문 (PC 드롭다운·모바일 시트 공통, D-015)
 * 검색 · 전체 선택 / 모두 해제 · 여러 개 체크. 검색 중이면 전체 선택·모두 해제는 보이는 것에만.
 * 카테고리 순서는 사용자 순서, 미지정은 맨 위 (D-029). 미지정 색은 회색 (D-037)
 */
export default function CategoryFilterList({ categories, checkedIds, onChange, size }: CategoryFilterListProps) {
  const [query, setQuery] = useState('');
  const visible = searchCategories(categories, query);
  const checked = new Set(checkedIds);
  const isPc = size === 'pc';

  const toggle = (id: Id) => onChange(checked.has(id) ? checkedIds.filter((v) => v !== id) : [...checkedIds, id]);
  const checkVisible = () => onChange([...new Set([...checkedIds, ...visible.map((c) => c.id)])]);
  const uncheckVisible = () => {
    const hidden = new Set(visible.map((c) => c.id));
    onChange(checkedIds.filter((id) => !hidden.has(id)));
  };

  return (
    <div className={`flex min-h-0 flex-col ${isPc ? 'gap-1.5' : 'gap-2.5'}`}>
      <input
        type="text"
        aria-label="카테고리 검색"
        placeholder="카테고리 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={`w-full border border-tp-line bg-white text-ink outline-none focus:ring-2 focus:ring-tp-theme2 ${
          isPc ? 'rounded-lg px-2.5 py-[7px] text-[13px]' : 'rounded-[10px] px-3 py-2.5 text-sm'
        }`}
      />
      <div className={`flex ${isPc ? 'gap-1.5' : 'gap-2'}`}>
        <ThemeButton onClick={checkVisible}>전체 선택</ThemeButton>
        <ThemeButton onClick={uncheckVisible}>모두 해제</ThemeButton>
      </div>
      <ul className={`flex min-h-0 flex-col overflow-y-auto ${isPc ? 'max-h-[280px] gap-0.5' : ''}`}>
        {visible.map((category) => {
          const isChecked = checked.has(category.id);
          return (
            <li key={category.id}>
              <label
                className={`flex cursor-pointer items-center ${
                  isPc
                    ? `gap-2 rounded-md px-2 py-[7px] text-[13px] ${isChecked ? 'bg-tp-panel' : ''}`
                    : 'gap-3 border-b border-tp-line px-1.5 py-3 text-[15px]'
                }`}
              >
                <input
                  type="checkbox"
                  aria-label={category.name}
                  checked={isChecked}
                  onChange={() => toggle(category.id)}
                  className={`m-0 shrink-0 accent-tp-primary ${isPc ? 'h-[15px] w-[15px]' : 'h-5 w-5'}`}
                />
                <span
                  aria-hidden="true"
                  className={`shrink-0 rounded-full ${isPc ? 'h-2.5 w-2.5' : 'h-3 w-3'}`}
                  style={{ backgroundColor: getCategoryListColor(category) }}
                />
                <span className="truncate">{category.name}</span>
              </label>
            </li>
          );
        })}
        {visible.length === 0 && <li className="px-2 py-3 text-[13px] text-tp-muted">맞는 카테고리가 없어요</li>}
      </ul>
    </div>
  );
}
