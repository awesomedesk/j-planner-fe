"use client";

import { useEffect, useState } from 'react';

/**
 * 미디어 쿼리가 맞는지 알려 준다.
 * 브라우저에서는 첫 그림부터 실제 값이다 — PC로 한 번 그렸다가 모바일로 바뀌면
 * 한 번만 정하는 값(시간표 처음 위치 D-046 등)이 PC 크기로 굳는다 (US-07 검수).
 * 서버 렌더링(window 없음)에서만 `initialValue`. 이 훅을 쓰는 화면은 ClientOnly 안에 둔다.
 * @example const isPc = useMediaQuery('(min-width: 1024px)');
 */
export const useMediaQuery = (query: string, initialValue = false) => {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' || !window.matchMedia ? initialValue : window.matchMedia(query).matches
  );

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const handleChange = () => setMatches(mediaQueryList.matches);
    handleChange();
    mediaQueryList.addEventListener('change', handleChange);
    return () => mediaQueryList.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
};

/** 화면 폭 구분 (D-018). tailwind.config.ts의 screens와 같은 값 */
export const BREAKPOINT = {
  fold: 600,
  tablet: 768,
  pc: 1024,
  wide: 1920,
} as const;
