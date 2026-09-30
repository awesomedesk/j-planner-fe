"use client";

import { useEffect, useState } from 'react';

/** 현재 시각을 다시 읽는 간격 (현재 시각 선이 분 단위라 1분) */
export const NOW_REFRESH_MS = 60_000;

/**
 * 지금 시각 — 1분마다 바뀐다
 * 달력 화면은 모두 이 값으로 '오늘'과 현재 시각 선을 정한다.
 * 앱을 켜 둔 채 자정을 넘겨도 오늘 강조가 다음 날로 옮겨 간다 (CAL-06).
 */
export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), NOW_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}
