import type { components } from '@/types/api/schema';

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
