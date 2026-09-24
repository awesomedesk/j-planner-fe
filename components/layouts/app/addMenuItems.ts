import type { IconName } from '@components/icons/LineIcon';

/**
 * 추가 선택지 (PC 헤더 '추가', 모바일 + 버튼 MO-07, D-021)
 * Todo는 M2(US-12), D-Day는 M3(US-22)에서 입력 창이 생기면 enabled로 바꾼다.
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
  { target: 'TODO', label: 'Todo', icon: 'todo', enabled: false },
  { target: 'DDAY', label: 'D-Day', icon: 'dday', enabled: false },
];
