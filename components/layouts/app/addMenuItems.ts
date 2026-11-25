import type { IconName } from '@components/icons/LineIcon';

/**
 * 추가 선택지 (PC 헤더 '추가', 모바일 + 버튼 MO-07, D-021)
 * 아직 입력 창이 없는 항목은 enabled: false (점선). D-Day는 US-22에서 열었다
 */
export type AddTarget = 'SCHEDULE' | 'TODO' | 'DDAY';

export interface AddMenuItem {
  target: AddTarget;
  label: string;
  icon: IconName;
  enabled: boolean;
}

export const ADD_MENU_ITEMS: readonly AddMenuItem[] = [
  { target: 'SCHEDULE', label: '일정', icon: 'calendar', enabled: true },
  { target: 'TODO', label: 'Todo', icon: 'todo', enabled: true },
  { target: 'DDAY', label: 'D-Day', icon: 'dday', enabled: true },
];
