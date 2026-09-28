import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

import type { LocalDate } from '@/types/api';
import type { components } from '@/types/api/schema';
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

type SidebarItem = components['schemas']['SidebarItem'];

/** 설정 사이드바 항목 기본값 (D-024: 모두 표시, 이 순서). 설정 연결은 US-21·US-26 */
export const DEFAULT_SIDEBAR_ITEMS: SidebarItem[] = SIDEBAR_SECTIONS.map((section) => ({ type: section.type, visible: true }));

/** 지금 열 수 있는 사이드바 탭. Todo는 M2(US-12~), D-Day·일기·메모는 M3에서 켠다 */
const ENABLED_SIDEBAR_TABS: ReadonlySet<SidebarItem['type']> = new Set();

export interface MobileDayTab {
  key: 'TIMETABLE' | SidebarItem['type'];
  label: string;
  enabled: boolean;
}

/**
 * 모바일 일간 탭 (D-049)
 * 시간표(맨 앞 고정) + 설정의 사이드바 항목 순서대로. 설정에서 끈 항목은 숨긴다 (PC 사이드바와 같게)
 */
export const buildMobileDayTabs = (sidebarItems: SidebarItem[] = DEFAULT_SIDEBAR_ITEMS): MobileDayTab[] => [
  { key: 'TIMETABLE', label: '시간표', enabled: true },
  ...sidebarItems
    .filter((item) => item.visible)
    .map((item) => ({
      key: item.type,
      label: SIDEBAR_SECTIONS.find((section) => section.type === item.type)?.label ?? item.type,
      enabled: ENABLED_SIDEBAR_TABS.has(item.type),
    })),
];
