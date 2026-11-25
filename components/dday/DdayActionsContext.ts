"use client";

import { createContext, useContext } from 'react';

import type { Dday } from '@/types/api';

/**
 * D-Day 목록이 화면 틀(AppShell)에 부탁하는 일 (US-22)
 * 목록은 사이드바·폴드 패널·모바일 탭 어디서든 그려지므로, 입력 창은 AppShell이 한 곳에서 연다
 */
export interface DdayActions {
  /** 새 D-Day 창 (기준 날짜 = 사이드바 기준 날짜) */
  openNewDday: () => void;
  /** 그 D-Day 수정 창 */
  openDday: (dday: Dday) => void;
}

export const DdayActionsContext = createContext<DdayActions>({ openNewDday: () => undefined, openDday: () => undefined });
export const useDdayActions = () => useContext(DdayActionsContext);
