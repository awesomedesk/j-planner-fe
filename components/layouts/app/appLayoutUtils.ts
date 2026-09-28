import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

import type { LocalDate } from '@/types/api';
import { DEFAULT_WEEK_START, formatDayTitle } from '@components/calendar/utils/calendarUtils';
import { formatWeekTitle, getWeekRange } from '@components/calendar/utils/timetableUtils';

/**
 * 헤더 가운데 날짜 제목
 * 월간 `2026년 9월`, 주간 `9월 20일 – 26일` (PC-02·MO-05), 일간 `9월 24일 (목)` (PC-03·MO-03)
 */
export const formatViewTitle = (viewMode: CalendarViewMode, viewDate: LocalDate) => {
  if (viewMode === 'WEEK') return formatWeekTitle(getWeekRange(viewDate, DEFAULT_WEEK_START));
  if (viewMode === 'DAY') return formatDayTitle(viewDate);
  return format(parseISO(viewDate), 'yyyy년 M월');
};

/** 사이드바 머리 날짜: 9월 24일 (목) */
export const formatSidebarDate = (date: Date) => format(date, 'M월 d일 (EEE)', { locale: ko });

/** 보기 전환 (PC: 월·주·일 버튼 3개, D-021) */
export type CalendarViewMode = 'MONTH' | 'WEEK' | 'DAY';

export const VIEW_MODE_LABEL: Record<CalendarViewMode, string> = {
  MONTH: '월',
  WEEK: '주',
  DAY: '일',
};

/** 모바일 화면 선택 드롭다운 글자 (D-022). 3일·목록은 US-29 */
export const MOBILE_VIEW_MODE_LABEL: Record<CalendarViewMode, string> = {
  MONTH: '월간',
  WEEK: '주간',
  DAY: '일간',
};

/** 사이드바 섹션 (D-013, 설정 기본 순서 D-024) */
export const SIDEBAR_SECTIONS = [
  { type: 'TODO', label: 'Todo', icon: 'todo' },
  { type: 'DDAY', label: 'D-Day', icon: 'dday' },
  { type: 'DIARY', label: '일기', icon: 'diary' },
  { type: 'MEMO', label: '메모', icon: 'memo' },
] as const;
