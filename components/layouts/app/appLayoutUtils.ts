import type { LocalDate } from '@/types/api';
import type { CalendarViewMode } from '@/types/calendar';
import { DEFAULT_WEEK_START, formatDayTitle, formatMonthTitle } from '@utils/date/dateUtils';
import { formatWeekTitle, getWeekRange } from '@components/calendar/utils/timetableUtils';

/**
 * 헤더 가운데 날짜 제목
 * 월간 `2026년 9월`, 주간 `9월 20일 – 26일` (PC-02·MO-05), 일간 `9월 24일 (목)` (PC-03·MO-03)
 */
export const formatViewTitle = (viewMode: CalendarViewMode, viewDate: LocalDate) => {
  if (viewMode === 'WEEK') return formatWeekTitle(getWeekRange(viewDate, DEFAULT_WEEK_START));
  if (viewMode === 'DAY') return formatDayTitle(viewDate);
  return formatMonthTitle(viewDate);
};

/** PC 보기 전환 버튼 글자 (월·주·일, D-021) */
export const VIEW_MODE_LABEL: Record<CalendarViewMode, string> = {
  MONTH: '월',
  WEEK: '주',
  DAY: '일',
};

/** 모바일 화면 선택 드롭다운 글자 (D-022) */
export const MOBILE_VIEW_MODE_LABEL: Record<CalendarViewMode, string> = {
  MONTH: '월간',
  WEEK: '주간',
  DAY: '일간',
};

/** 모바일 화면 선택 드롭다운 선택지 (D-022, D-025). 3일·목록은 US-29에서 켠다 (mode 없음 = 아직 막힘) */
export const MOBILE_VIEW_OPTIONS: readonly { label: string; mode: CalendarViewMode | null }[] = [
  { label: '월간', mode: 'MONTH' },
  { label: '주간', mode: 'WEEK' },
  { label: '3일', mode: null },
  { label: '일간', mode: 'DAY' },
  { label: '목록', mode: null },
];
