import type { ReactNode } from 'react';

import type { LocalDate } from '@/types/api';
import type { SidebarItemType } from '@/types/calendar';

/**
 * 모바일 일간 탭 내용 (D-049, US-25 연결 지점)
 * - render: 탭 내용. addRequestKey는 + 버튼을 누를 때마다 1씩 늘어난다 (directAddLabel이 있을 때)
 * - directAddLabel: 있으면 이 탭에서는 + 가 추가 메뉴 대신 바로 이 동작 (예: 메모 탭 '새 메모', D-055)
 * 여기 꽂은 탭만 탭 줄에서 눌린다. 탭별 스와이프·필터·< >는 sidebarItems의 dayTabBehavior
 */
export interface DayTabSlot {
  render: (context: { date: LocalDate; addRequestKey: number }) => ReactNode;
  directAddLabel?: string;
}

type DayTabSlots = Partial<Record<SidebarItemType, DayTabSlot>>;

/** 기능을 만들 때 여기에 한 줄씩 꽂는다 (Todo M2, D-Day·일기·메모 M3) */
const DAY_TAB_SLOTS: DayTabSlots = {};

let override: DayTabSlots | null = null;
/** 테스트에서만: 가짜 탭 내용으로 연결 지점을 확인한다 (null이면 원래대로) */
export const setDayTabSlotsForTest = (slots: DayTabSlots | null) => {
  override = slots;
};

export const getDayTabSlots = (): DayTabSlots => override ?? DAY_TAB_SLOTS;
