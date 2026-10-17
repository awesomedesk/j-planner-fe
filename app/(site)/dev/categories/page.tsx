"use client";

import { useState } from 'react';

import ThemeButton from '@components/button/ThemeButton';
import CategoryManagerDialog from '@components/category/CategoryManagerDialog';
import { useAppSelector } from '@/app/hooks';
import { selectCategories, selectCategoryStatus } from '@store/slices/categorySlice';

/**
 * 개발용: 카테고리 관리 창(OV-04, US-04) 확인 — /dev/categories
 * 실제로 여는 곳(필터 드롭다운·설정·모바일 메뉴)이 생기면 이 페이지는 지운다.
 */
export default function CategoryDevPage() {
  const [isOpen, setIsOpen] = useState(true);
  const categories = useAppSelector(selectCategories);
  const status = useAppSelector(selectCategoryStatus);

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-4 p-6 text-sm">
      <h1 className="text-lg font-bold">개발용 · 카테고리 관리 (US-04)</h1>
      <ThemeButton variant="primary" size="md" className="w-fit" onClick={() => setIsOpen(true)}>
        카테고리 관리 열기
      </ThemeButton>
      <p className="text-tp-muted">불러오기: {status} · {categories.length}개 (입력 창·필터가 쓰는 순서)</p>
      <ol className="list-decimal pl-5">
        {categories.map((c) => (
          <li key={c.id}>
            {c.name} {c.isDefault ? '(기본)' : ''} · {c.color}
          </li>
        ))}
      </ol>
      {isOpen && <CategoryManagerDialog onClose={() => setIsOpen(false)} />}
    </main>
  );
}
