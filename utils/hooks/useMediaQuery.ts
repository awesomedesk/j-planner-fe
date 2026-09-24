"use client";

import { useEffect, useState } from 'react';

/**
 * 미디어 쿼리가 맞는지 알려 준다. 서버 렌더링과 첫 화면에서는 `initialValue`.
 * @example const isPc = useMediaQuery('(min-width: 1024px)');
 */
export const useMediaQuery = (query: string, initialValue = false) => {
  const [matches, setMatches] = useState(initialValue);

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
