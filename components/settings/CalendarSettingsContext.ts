"use client";

import { createContext, useContext } from 'react';

import type { AccountEntry } from '@components/auth/account/accountReturnFocus';

/**
 * 달력 설정 열기 (US-26, #396 v1.3): 설정 및 계정의 '달력 설정 ›' → AppShell이 패널(PC·태블릿) / 전체 화면(모바일)을 연다.
 * menuReopenKey: 패널의 ‹ 뒤로 → PC ⚙ 메뉴를 다시 열고 '달력 설정'에 초점 (바뀔 때마다 한 번)
 */
export interface CalendarSettingsContextValue {
  open: (entry: AccountEntry) => void;
  menuReopenKey: number;
}

export const CalendarSettingsContext = createContext<CalendarSettingsContextValue | null>(null);

export const useCalendarSettings = () => useContext(CalendarSettingsContext);
