import type { Id } from '@/types/api';
import type { components } from '@/types/api/schema';

/** 달력 보기 종류 (PC 월·주·일 버튼 D-021, 모바일 화면 선택 D-022). 3일(THREE_DAY)·목록(LIST)은 모바일 전용 (US-29, D-025) */
export type CalendarViewMode = 'MONTH' | 'WEEK' | 'THREE_DAY' | 'DAY' | 'LIST';

/** PC·태블릿 헤더 버튼이 있는 보기 (월·주·일, D-021) */
export type PcViewMode = 'MONTH' | 'WEEK' | 'DAY';

/**
 * 카테고리 필터 (US-11, CAT-03)
 * - null = 전체 (조회에 categoryId를 붙이지 않는다 — 새로 만든 카테고리도 자동으로 보임)
 * - Id[] = 고른 카테고리만 (빈 목록 = 아무것도 안 봄)
 */
export type CategoryFilter = Id[] | null;

/** 사이드바 항목 종류 (Todo·D-Day·일기·메모, D-013) */
export type SidebarItemType = components['schemas']['SidebarItem']['type'];

/** 모바일 일간 탭: 시간표 + 사이드바 항목 (D-049) */
export type MobileDayTabKey = 'TIMETABLE' | SidebarItemType;
