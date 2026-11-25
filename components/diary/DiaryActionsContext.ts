"use client";

import { createContext, useContext } from 'react';

import type { LocalDate } from '@/types/api';

/** 사이드바 일기 섹션이 화면 틀(AppShell)에 부탁하는 일: 그날 일기 창 열기 (US-24, OV-05) */
export interface DiaryActions {
  openDiary: (date: LocalDate) => void;
}

export const DiaryActionsContext = createContext<DiaryActions>({ openDiary: () => undefined });
export const useDiaryActions = () => useContext(DiaryActionsContext);
