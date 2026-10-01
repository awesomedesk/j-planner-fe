"use client";

import { useMediaQuery } from './useMediaQuery';

/**
 * 움직임을 줄여야 하는가 (기기 설정 prefers-reduced-motion)
 * 움직임 효과(스와이프 따라가기 D-051, 종이비행기 D-056 등)는 모두 이것으로 판단한다.
 * 앱 설정의 '동작 줄이기' 토글(첫 배포 이후)이 생기면 여기서 함께 본다.
 */
export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
