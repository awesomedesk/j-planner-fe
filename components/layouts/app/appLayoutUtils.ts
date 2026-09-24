import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

/** 헤더 가운데 날짜: 2026년 9월 */
export const formatHeaderMonth = (date: Date) => format(date, 'yyyy년 M월');

/** 사이드바 머리 날짜: 9월 24일 (목) */
export const formatSidebarDate = (date: Date) => format(date, 'M월 d일 (EEE)', { locale: ko });

/** 보기 전환 (PC: 월·주·일 버튼 3개, D-021) */
export type CalendarViewMode = 'MONTH' | 'WEEK' | 'DAY';

export const VIEW_MODE_LABEL: Record<CalendarViewMode, string> = {
  MONTH: '월',
  WEEK: '주',
  DAY: '일',
};

/** 사이드바 섹션 (D-013, 설정 기본 순서 D-024) */
export const SIDEBAR_SECTIONS = [
  { type: 'TODO', label: 'Todo', icon: 'todo' },
  { type: 'DDAY', label: 'D-Day', icon: 'dday' },
  { type: 'DIARY', label: '일기', icon: 'diary' },
  { type: 'MEMO', label: '메모', icon: 'memo' },
] as const;
