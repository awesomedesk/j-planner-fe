"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';

interface ResponsiveCalendarConfig {
  /** 캘린더 컨테이너의 선택자 */
  containerSelector?: string;
  /** 일정 아이템의 기본 높이 (px) */
  scheduleItemHeight?: number;
  /** 셀 내부 패딩 (px) */
  cellPadding?: number;
  /** 날짜 숫자 영역 높이 (px) */
  dateNumberHeight?: number;
  /** 최소 여백 (px) */
  minSpacing?: number;
  /** 최소 셀 높이 (px) */
  minCellHeight?: number;
  /** 최대 표시 가능한 일정 수 */
  maxScheduleLimit?: number;
  /** 디바운스 지연시간 (ms) */
  debounceMs?: number;
}

const defaultConfig: Required<ResponsiveCalendarConfig> = {
  containerSelector: '[data-calendar-container="true"]',
  scheduleItemHeight: 16,
  cellPadding: 16,
  dateNumberHeight: 20,
  minSpacing: 8,
  minCellHeight: 50,
  maxScheduleLimit: 6,
  debounceMs: 100,
};

export function useResponsiveCalendar(config: ResponsiveCalendarConfig = {}, weekCount?: number) {
  const finalConfig = useMemo(() => ({ ...defaultConfig, ...config }), [config]);
  
  const [cellHeight, setCellHeight] = useState(80);
  const [maxDisplayableSchedules, setMaxDisplayableSchedules] = useState(2);

  // 디바운스 함수
  const debounce = useCallback((func: () => void, wait: number) => {
    let timeout: NodeJS.Timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(func, wait);
    };
  }, []);

  const calculateDimensions = useCallback(() => {
    const container = document.querySelector(finalConfig.containerSelector);
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const availableHeight = containerRect.height;
    
    // 헤더 높이 계산 (요일 헤더)
    const dayHeaderHeight = 42;
    
    // 실제 주 개수 사용 (전달받은 weekCount 또는 기본값 6)
    const actualWeekCount = weekCount || 6;
    
    // 주당 높이 계산
    const calculatedHeight = Math.floor((availableHeight - dayHeaderHeight) / actualWeekCount);
    
    // 최소 높이 적용
    const finalCellHeight = Math.max(finalConfig.minCellHeight, calculatedHeight);
    setCellHeight(finalCellHeight);
    
    // 표시 가능한 일정 개수 계산
    const availableSpace = finalCellHeight 
      - finalConfig.cellPadding 
      - finalConfig.dateNumberHeight 
      - finalConfig.minSpacing;
    
    const maxSchedules = Math.floor(availableSpace / finalConfig.scheduleItemHeight);
    
    // 계산된 개수에서 1개 빼서 여유 공간 확보
    const adjustedMaxSchedules = Math.max(0, maxSchedules - 1);
    
    // 최소 1개, 최대 제한까지
    const finalMaxSchedules = Math.max(1, Math.min(finalConfig.maxScheduleLimit, adjustedMaxSchedules));
    setMaxDisplayableSchedules(finalMaxSchedules);
  }, [finalConfig, weekCount]);

  // 디바운스된 계산 함수
  const debouncedCalculate = useMemo(
    () => debounce(calculateDimensions, finalConfig.debounceMs),
    [calculateDimensions, finalConfig.debounceMs, debounce]
  );

  useEffect(() => {
    // 초기 계산
    const timer = setTimeout(calculateDimensions, 0);
    
    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', debouncedCalculate);
    
    // MutationObserver로 DOM 변경 감지 (동적 콘텐츠 추가 시)
    const observer = new MutationObserver(debouncedCalculate);
    const container = document.querySelector(finalConfig.containerSelector);
    
    if (container) {
      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', debouncedCalculate);
      observer.disconnect();
    };
  }, [calculateDimensions, debouncedCalculate, finalConfig.containerSelector]);

  return {
    cellHeight,
    maxDisplayableSchedules,
    // 스타일 헬퍼 함수들
    getCellStyle: () => ({ height: `${cellHeight}px` }),
    getWeekStyle: () => ({ height: `${cellHeight}px` }),
    // 설정 정보
    config: finalConfig,
  };
}
