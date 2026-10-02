import type { ReactNode } from 'react';

import type { SidebarItemType } from '@/types/calendar';

/**
 * 사이드바 섹션 내용 (PC 사이드바 · 폴드 오른쪽 패널 공통, D-013)
 * 받은 header(버튼)로 섹션 머리를 그리고 그 아래 내용을 그린다.
 * @example MEMO: ({ header }) => <MemoSection header={header} />
 */
export type SidebarSectionSlot = (props: { header: (actions?: ReactNode) => ReactNode }) => ReactNode;

/** 기능을 만들 때 여기에 한 줄씩 꽂는다 (Todo M2, D-Day·일기·메모 M3) */
export const SIDEBAR_SECTION_SLOTS: Partial<Record<SidebarItemType, SidebarSectionSlot>> = {};
