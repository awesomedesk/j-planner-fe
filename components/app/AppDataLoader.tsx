"use client";

import { useEffect } from 'react';

import { useAppDispatch } from '@/app/hooks';
import { fetchCategories } from '@store/slices/categorySlice';
import { setViewMode } from '@store/slices/calendarSlice';
import { fetchSettings } from '@store/slices/settingsSlice';
import { loadLastView, resolveStartView } from '@utils/storage/lastViewStorage';
import { showNotice } from '@store/slices/noticeSlice';

/**
 * AppDataLoader - 앱을 열 때 공통으로 쓰는 데이터를 받는다 (08-api-design 11절)
 * 카테고리와 설정(`/settings`, 사이드바 US-19~21·달력 설정 US-26). 설정을 받으면 처음 화면(US-27)으로, 못 받으면 기본값
 */
export default function AppDataLoader() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchCategories())
      .unwrap()
      .catch((message: string) => dispatch(showNotice(message, 'error')));
    // 설정을 받으면 처음 화면으로 (US-27, D-029·030). 못 받으면 기본(월간) 그대로
    void dispatch(fetchSettings())
      .unwrap()
      .then((settings) => dispatch(setViewMode(resolveStartView(settings.startView, loadLastView()))))
      .catch(() => undefined);
  }, [dispatch]);

  return null;
}
