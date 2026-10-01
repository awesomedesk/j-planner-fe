"use client";

import { useState } from 'react';

import type { Category, Id, Schedule } from '@/types/api';
import type { CategoryFilter } from '@/types/calendar';
import type { FilterReveal } from '@components/category/filter/useFilterReveal';

import { useReducedMotion } from '@utils/hooks/useReducedMotion';

import type { Point } from './paperPlaneUtils';

/** 화면에 보이는 첫 요소의 가운데 (같은 표시가 PC·모바일 둘 다 있을 수 있어서) */
const visibleCenter = (selector: string): Point | null => {
  const rect = Array.from(document.querySelectorAll(selector))
    .map((el) => el.getBoundingClientRect())
    .find((r) => r.width > 0 && r.height > 0);
  return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
};

/** 저장 버튼에 붙이는 표시 (빠른 추가·일정 추가 창) */
export const SAVE_BUTTON_ATTR = 'data-save-button';

/**
 * 필터에서 빠진 카테고리로 저장했을 때 알려 주기 (US-11, D-056)
 * 종이비행기 → 필터 목록 펼침(reveal) + 화면 읽기 안내. 동작 줄이기면 화면은 그대로 두고 안내만 (D-056 보완)
 * 저장 직후, 입력 창이 닫히기 전에 notify를 불러야 저장 버튼 자리를 잴 수 있다
 */
export function useHiddenSaveNotice(categoryFilter: CategoryFilter, categories: Category[]) {
  const reduceMotion = useReducedMotion();
  const [flight, setFlight] = useState<{ from: Point; to: Point; categoryId: Id } | null>(null);
  const [reveal, setReveal] = useState<FilterReveal | null>(null);
  const [liveMessage, setLiveMessage] = useState('');

  const startReveal = (categoryId: Id) => setReveal({ categoryId, key: Date.now() });

  const notify = (schedule: Schedule) => {
    if (categoryFilter === null) return;
    const categoryId = schedule.categoryId ?? categories.find((c) => c.isDefault)?.id;
    if (categoryId === undefined || categoryFilter.includes(categoryId)) return;
    const name = categories.find((c) => c.id === categoryId)?.name ?? '';
    setLiveMessage(`'${name}'는 필터에서 빠져 있어 달력에 보이지 않아요`);

    if (reduceMotion) return;

    const from = visibleCenter(`[${SAVE_BUTTON_ATTR}]`);
    const to = visibleCenter('[data-category-filter-button]');
    // 자리를 잴 수 없으면(화면 밖 등) 비행기 없이 바로 펼친다
    if (!from || !to) startReveal(categoryId);
    else setFlight({ from, to, categoryId });
  };

  const finishFlight = () => {
    if (flight) startReveal(flight.categoryId);
    setFlight(null);
  };

  return { notify, flight, finishFlight, reveal, clearReveal: () => setReveal(null), liveMessage };
}
