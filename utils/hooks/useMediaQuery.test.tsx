import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { setViewportWidth } from '@/test/viewport';

import { useMediaQuery } from './useMediaQuery';

describe('화면 폭 확인 (D-018)', () => {
  it('브라우저에서는 첫 그림부터 실제 폭으로 (PC로 한 번 그렸다가 바뀌지 않게, US-07 검수)', () => {
    setViewportWidth(390);
    const seen: boolean[] = [];
    renderHook(() => {
      const value = useMediaQuery('(min-width: 768px)', true);
      seen.push(value);
      return value;
    });
    expect(seen[0]).toBe(false);
    expect(seen.every((v) => v === false)).toBe(true);
  });

  it('폭이 바뀌면 따라 바뀐다', () => {
    setViewportWidth(1440);
    const { result, rerender } = renderHook(() => useMediaQuery('(min-width: 768px)', false));
    expect(result.current).toBe(true);
    rerender();
    expect(result.current).toBe(true);
  });
});
