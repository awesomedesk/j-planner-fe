import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useCountdown } from './useCountdown';

describe('남은 초 (US-33·35, D-079 다시 보내기 60초·429)', () => {
  it('시작하면 그 초부터, 시간이 지나면 줄고 0에서 멈춘다', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountdown());
    expect(result.current[0]).toBe(0);
    act(() => result.current[1](3));
    expect(result.current[0]).toBe(3);
    await act(async () => vi.advanceTimersByTime(1000));
    expect(result.current[0]).toBe(2);
    await act(async () => vi.advanceTimersByTime(5000));
    expect(result.current[0]).toBe(0);
  });

  it('타이머가 늦게 돌아도(뒤에 있는 탭) 끝나는 시각 기준으로 맞다', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountdown());
    act(() => result.current[1](60));
    vi.setSystemTime(Date.now() + 45_000);
    await act(async () => vi.advanceTimersByTime(250));
    expect(result.current[0]).toBe(15);
  });
});
