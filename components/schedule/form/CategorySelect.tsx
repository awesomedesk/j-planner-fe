"use client";

import type { Category, Id } from '@/types/api';
import { getCategoryListColor } from '@components/category/utils/categoryUtils';

interface CategorySelectProps {
  id?: string;
  /** 바깥 label이 없을 때 */
  ariaLabel?: string;
  categories: Category[];
  /** null = 미지정 (기본 카테고리로 보여 준다, D-014) */
  value: Id | null;
  onChange: (categoryId: Id) => void;
  className?: string;
}

/**
 * CategorySelect - 색 점이 붙은 카테고리 고르기
 * 일정 입력 창(OV-01)과 빠른 추가(US-10)가 같이 쓴다.
 */
export default function CategorySelect({ id, ariaLabel, categories, value, onChange, className = '' }: CategorySelectProps) {
  const defaultCategory = categories.find((c) => c.isDefault) ?? null;
  const selectedId = value ?? defaultCategory?.id ?? '';
  const selected = categories.find((c) => c.id === selectedId) ?? null;

  return (
    <div className={`relative ${className}`}>
      {selected && (
        <span
          className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: getCategoryListColor(selected) }}
          aria-hidden="true"
        />
      )}
      <select
        id={id}
        aria-label={ariaLabel}
        value={selectedId}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full appearance-none truncate rounded-lg border border-tp-secondary-line bg-tp-secondary py-2.5 pl-8 pr-9 text-sm font-medium text-tp-on-secondary outline-none focus:ring-2 focus:ring-tp-theme2"
      >
        {categories.length === 0 && <option value="">미지정</option>}
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-tp-on-secondary"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}
