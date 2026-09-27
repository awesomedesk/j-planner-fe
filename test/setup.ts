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
