import type { LocalDate } from '@/types/api';
import type { CalendarViewMode, PcViewMode } from '@/types/calendar';
import { DEFAULT_WEEK_START, formatDayTitle, formatMonthTitle } from '@utils/date/dateUtils';
import { formatWeekTitle, getThreeDayRange, getWeekRange } from '@components/calendar/utils/timetableUtils';

/**
 * 헤더 가운데 날짜 제목
 * 월간 `2026년 9월`, 주간·목록 `9월 20일 – 26일` (PC-02·MO-05·MO-19), 3일 `9월 25일 – 27일` (MO-20), 일간 `9월 24일 (목)` (PC-03·MO-03)
 */
export const formatViewTitle = (viewMode: CalendarViewMode, viewDate: LocalDate) => {
  if (viewMode === 'WEEK' || viewMode === 'LIST') return formatWeekTitle(getWeekRange(viewDate, DEFAULT_WEEK_START));
  if (viewMode === 'THREE_DAY') return formatWeekTitle(getThreeDayRange(viewDate));
  if (viewMode === 'DAY') return formatDayTitle(viewDate);
  return formatMonthTitle(viewDate);
};

/** PC 보기 전환 버튼 글자 (월·주·일, D-021) */
export const VIEW_MODE_LABEL: Record<PcViewMode, string> = {
  MONTH: '월',
  WEEK: '주',
  DAY: '일',
};

/** 모바일 화면 선택 드롭다운 글자 (D-022) */
export const MOBILE_VIEW_MODE_LABEL: Record<CalendarViewMode, string> = {
  MONTH: '월간',
  WEEK: '주간',
  THREE_DAY: '3일',
  DAY: '일간',
  LIST: '목록',
};

/** 모바일 화면 선택 드롭다운 선택지 (D-022, D-025, US-29) */
export const MOBILE_VIEW_OPTIONS: readonly { label: string; mode: CalendarViewMode }[] = (
  ['MONTH', 'WEEK', 'THREE_DAY', 'DAY', 'LIST'] as const
).map((mode) => ({ label: MOBILE_VIEW_MODE_LABEL[mode], mode }));

/**
 * 화면에 실제로 그릴 보기. 3일·목록은 모바일 보기라서 태블릿·PC 폭(768px~)에서는 주간으로 보여 준다.
 * 보기 상태(store)는 그대로 두어 다시 좁히면 3일·목록으로 돌아온다 (US-29, 제가 정한 부분)
 */
export const displayedViewMode = (viewMode: CalendarViewMode, isTabletUp: boolean): CalendarViewMode =>
  isTabletUp && (viewMode === 'THREE_DAY' || viewMode === 'LIST') ? 'WEEK' : viewMode;
