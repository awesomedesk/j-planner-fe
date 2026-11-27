import { afterEach, describe, expect, it, vi } from 'vitest';

import { LAST_VIEW_KEY, loadLastView, resolveStartView, saveLastView } from './lastViewStorage';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("'마지막에 본 화면' — 이 브라우저에만 기억 (US-27, D-029·030 · 08 §9)", () => {
  it('보기 다섯 가지를 저장하고 다시 읽는다', () => {
    for (const mode of ['MONTH', 'WEEK', 'THREE_DAY', 'DAY', 'LIST'] as const) {
      saveLastView(mode);
      expect(loadLastView()).toBe(mode);
    }
    expect(localStorage.getItem(LAST_VIEW_KEY)).toBe('LIST');
  });

  it('없거나 모르는 값이면 null', () => {
    expect(loadLastView()).toBeNull();
    localStorage.setItem(LAST_VIEW_KEY, 'YEAR');
    expect(loadLastView()).toBeNull();
  });

  it('저장소를 못 쓰는 브라우저(막힘·사생활 보호)에서도 오류 없이 넘어간다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => saveLastView('WEEK')).not.toThrow();
    expect(loadLastView()).toBeNull();
  });
});

describe('처음 화면 고르기 (US-27, D-029·030)', () => {
  it('월간·주간·일간은 그대로', () => {
    expect(resolveStartView('MONTH', 'LIST')).toBe('MONTH');
    expect(resolveStartView('WEEK', null)).toBe('WEEK');
    expect(resolveStartView('DAY', null)).toBe('DAY');
  });

  it("'마지막에 본 화면'은 기억한 보기(3일·목록도, D-030), 없으면 월간", () => {
    expect(resolveStartView('LAST', 'THREE_DAY')).toBe('THREE_DAY');
    expect(resolveStartView('LAST', 'LIST')).toBe('LIST');
    expect(resolveStartView('LAST', null)).toBe('MONTH');
  });
});
