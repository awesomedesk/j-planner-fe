import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useLatest } from './useLatest';

describe('useLatest - 이벤트·타이머에서 읽는 최신 값 (US-31: React 19 렌더 중 ref 쓰기 금지)', () => {
  it('처음 값을 담고, 다시 그리면 화면에 반영된 뒤 새 값으로 바뀐다', () => {
    const { result, rerender } = renderHook(({ value }) => useLatest(value), { initialProps: { value: 1 } });
    expect(result.current.current).toBe(1);
    rerender({ value: 2 });
    expect(result.current.current).toBe(2);
  });

  it('같은 ref 객체를 계속 준다 (effect 의존성에 넣어도 다시 돌지 않게)', () => {
    const { result, rerender } = renderHook(({ value }) => useLatest(value), { initialProps: { value: 'a' } });
    const first = result.current;
    rerender({ value: 'b' });
    expect(result.current).toBe(first);
  });
});
