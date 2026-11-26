"use client";

import { useEffect } from 'react';

import { useAppDispatch } from '@/app/hooks';
import { fetchCategories } from '@store/slices/categorySlice';
import { fetchSettings } from '@store/slices/settingsSlice';
import { showNotice } from '@store/slices/noticeSlice';

/**
 * AppDataLoader - 앱을 열 때 공통으로 쓰는 데이터를 받는다 (08-api-design 11절)
 * 카테고리와 설정(`/settings`, 사이드바 순서·표시·열림 US-19~21). 설정을 못 받으면 기본값으로 쓴다
 */
export default function AppDataLoader() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchCategories())
      .unwrap()
      .catch((message: string) => dispatch(showNotice(message, 'error')));
    void dispatch(fetchSettings());
  }, [dispatch]);

  return null;
}
