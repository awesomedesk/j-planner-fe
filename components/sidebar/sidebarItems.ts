import type { components } from '@/types/api/schema';
import type { MobileDayTabKey, SidebarItemType } from '@/types/calendar';

/**
 * 사이드바 항목 규칙 (D-013, D-024, D-049)
 * PC 사이드바, 모바일 일간 탭, 모바일 메뉴(US-28)가 같이 쓴다.
 */

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

export type { MobileDayTabKey, SidebarItemType };

export interface MobileDayTab {
  key: MobileDayTabKey;
  label: string;
  enabled: boolean;
}

/**
 * 모바일 일간 탭 (D-049)
 * 시간표(맨 앞 고정) + 설정의 사이드바 항목 순서대로. 설정에서 끈 항목은 숨긴다 (PC 사이드바와 같게)
 * @param enabledTypes 내용이 있는 탭 (AppShell의 dayTabSlots). 없는 탭은 흐리게, 눌리지 않게 (D-048)
 */
export const buildMobileDayTabs = (
  sidebarItems: SidebarItem[] = DEFAULT_SIDEBAR_ITEMS,
  enabledTypes: ReadonlySet<SidebarItemType> = new Set()
): MobileDayTab[] => [
  { key: 'TIMETABLE', label: '시간표', enabled: true },
  ...sidebarItems
    .filter((item) => item.visible)
    .map((item) => ({
      key: item.type,
      label: SIDEBAR_SECTIONS.find((section) => section.type === item.type)?.label ?? item.type,
      enabled: enabledTypes.has(item.type),
    })),
];

/** 모바일 일간 탭별 동작 (D-049) */
export interface DayTabBehavior {
  /** 좌우로 밀어 날짜 이동 */
  swipe: boolean;
  /** 화면 선택 줄의 카테고리 필터 */
  categoryFilter: boolean;
  /** 날짜 이동 방법: 스와이프 / 머리 줄 < > / 없음(날짜와 상관없는 탭) */
  dateNav: 'swipe' | 'arrows' | 'none';
}

const DAY_TAB_BEHAVIOR: Record<MobileDayTabKey, DayTabBehavior> = {
  TIMETABLE: { swipe: true, categoryFilter: true, dateNav: 'swipe' },
  TODO: { swipe: false, categoryFilter: true, dateNav: 'arrows' },
  DIARY: { swipe: false, categoryFilter: false, dateNav: 'arrows' },
  DDAY: { swipe: false, categoryFilter: false, dateNav: 'none' },
  MEMO: { swipe: false, categoryFilter: false, dateNav: 'none' },
};

export const dayTabBehavior = (key: MobileDayTabKey): DayTabBehavior => DAY_TAB_BEHAVIOR[key];
