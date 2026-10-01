import type { Id } from '@/types/api';

/** 달력 보기 종류 (PC 월·주·일 버튼 D-021, 모바일 화면 선택 D-022). 3일·목록은 US-29 */
export type CalendarViewMode = 'MONTH' | 'WEEK' | 'DAY';

/**
 * 카테고리 필터 (US-11, CAT-03)
 * - null = 전체 (조회에 categoryId를 붙이지 않는다 — 새로 만든 카테고리도 자동으로 보임)
 * - Id[] = 고른 카테고리만 (빈 목록 = 아무것도 안 봄)
 */
export type CategoryFilter = Id[] | null;
