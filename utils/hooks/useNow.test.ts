import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NOW_REFRESH_MS, useNow } from './useNow';

afterEach(() => vi.useRealTimers());

describe('지금 시각', () => {
  it('1분마다 새로 읽는다', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(new Date(2026, 8, 25, 23, 59));
    const { result } = renderHook(() => useNow());
    expect(result.current.getDate()).toBe(25);
    act(() => { vi.advanceTimersByTime(NOW_REFRESH_MS); });
    expect(result.current.getDate()).toBe(26);
  });

  it('화면이 사라지면 시계를 멈춘다', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    const { unmount } = renderHook(() => useNow());
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
