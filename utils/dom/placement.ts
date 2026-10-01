/** 화면 위 사각형 (getBoundingClientRect와 같은 기준) */
export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const POPOVER_GAP = 8;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/**
 * 떠 있는 창 자리 — 기준(anchor)을 가리지 않게 (D-017 빠른 추가)
 * 오른쪽 → 왼쪽 → 아래 → 위 순서로 들어가는 곳을 고른다. 좌표는 bounds와 같은 기준.
 */
export const placePopover = (anchor: Rect, bounds: Rect, size: { width: number; height: number }) => {
  const sideTop = clamp(anchor.top, bounds.top, bounds.bottom - size.height);
  if (anchor.right + POPOVER_GAP + size.width <= bounds.right) return { left: anchor.right + POPOVER_GAP, top: sideTop };
  if (anchor.left - POPOVER_GAP - size.width >= bounds.left) return { left: anchor.left - POPOVER_GAP - size.width, top: sideTop };

  const left = clamp(anchor.right - size.width, bounds.left, bounds.right - size.width);
  if (anchor.bottom + POPOVER_GAP + size.height <= bounds.bottom) return { left, top: anchor.bottom + POPOVER_GAP };
  return { left, top: Math.max(anchor.top - POPOVER_GAP - size.height, bounds.top) };
};

const REVEAL_MARGIN = 12;
/**
 * 대상(target)이 보이는 영역(visible) 밖에 있으면 스크롤할 양. 양수면 아래로(scrollTop 증가), 음수면 위로.
 * 예: 모바일 빠른 추가 바텀 시트가 임시 블록을 가리지 않게 (MO-12)
 */
export const revealScrollDelta = (target: Pick<Rect, 'top' | 'bottom'>, visible: Pick<Rect, 'top' | 'bottom'>) => {
  if (target.bottom > visible.bottom) return target.bottom - visible.bottom + REVEAL_MARGIN;
  if (target.top < visible.top) return target.top - visible.top - REVEAL_MARGIN;
  return 0;
};
