import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

import { resetViewport, resizeHeight } from './viewport';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  resetViewport();
});

// jsdom에 없는 브라우저 기능
class ResizeObserverStub {
  private readonly callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    ResizeObserverStub.instances.push(this);
  }
  observe(target: Element) {
    const height = resizeHeight.current;
    this.callback([{ target, contentRect: { height, width: 800 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
  unobserve() {}
  disconnect() {}
  static instances: ResizeObserverStub[] = [];
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

// jsdom의 PointerEvent는 clientY·pointerId를 받지 않는다 → MouseEvent 기반으로 대신한다 (끌기 테스트용)
class TestPointerEvent extends MouseEvent {
  pointerId: number;
  pointerType: string;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
    this.pointerType = init.pointerType ?? 'mouse';
  }
}
window.PointerEvent = TestPointerEvent as unknown as typeof PointerEvent;
