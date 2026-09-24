"use client";

import { useEffect } from 'react';

import { useAppDispatch } from '@/app/hooks';
import { fetchCategories } from '@store/slices/categorySlice';
import { showNotice } from '@store/slices/noticeSlice';

/**
 * AppDataLoader - 앱을 열 때 공통으로 쓰는 데이터를 받는다 (08-api-design 11절)
 * 지금은 카테고리. 설정(`/settings`)은 US-26에서 붙인다.
 */
export default function AppDataLoader() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchCategories())
      .unwrap()
      .catch((message: string) => dispatch(showNotice(message, 'error')));
  }, [dispatch]);

  return null;
}
