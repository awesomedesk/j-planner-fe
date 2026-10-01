import { describe, expect, it } from 'vitest';

import { placePopover, revealScrollDelta } from './placement';

describe('빠른 추가 팝업 자리 — 누른 시간을 가리지 않게 (D-017)', () => {
  const bounds = { left: 0, top: 0, right: 1000, bottom: 1160 };
  const size = { width: 340, height: 300 };

  it('오른쪽에 자리가 있으면 오른쪽 (주간 칸)', () => {
    const anchor = { left: 200, top: 600, right: 340, bottom: 648 };
    expect(placePopover(anchor, bounds, size)).toEqual({ left: 348, top: 600 });
  });
  it('오른쪽이 모자라면 왼쪽 (주간 금·토 칸)', () => {
    const anchor = { left: 800, top: 600, right: 940, bottom: 648 };
    expect(placePopover(anchor, bounds, size)).toEqual({ left: 452, top: 600 });
  });
  it('옆에 자리가 없으면(일간처럼 폭 전체) 아래, 오른쪽 끝에 맞춤', () => {
    const anchor = { left: 60, top: 600, right: 1000, bottom: 648 };
    expect(placePopover(anchor, bounds, size)).toEqual({ left: 660, top: 656 });
  });
  it('아래도 모자라면 위', () => {
    const anchor = { left: 60, top: 1000, right: 1000, bottom: 1048 };
    expect(placePopover(anchor, bounds, size)).toEqual({ left: 660, top: 692 });
  });
  it('옆에 둘 때 아래로 넘치면 위로 당긴다', () => {
    const anchor = { left: 200, top: 1100, right: 340, bottom: 1148 };
    expect(placePopover(anchor, bounds, size).top).toBe(860);
  });
});

describe('모바일 시트가 임시 블록을 가리지 않게 스크롤 (MO-12)', () => {
  it('블록이 시트 뒤로 가려지면 그만큼 + 여유 12px 올린다', () => {
    expect(revealScrollDelta({ top: 600, bottom: 646 }, { top: 170, bottom: 544 })).toBe(646 - 544 + 12);
  });
  it('이미 보이면 그대로', () => {
    expect(revealScrollDelta({ top: 300, bottom: 346 }, { top: 170, bottom: 544 })).toBe(0);
  });
  it('위로 가려져 있으면 내린다', () => {
    expect(revealScrollDelta({ top: 100, bottom: 146 }, { top: 170, bottom: 544 })).toBe(100 - 170 - 12);
  });
});
