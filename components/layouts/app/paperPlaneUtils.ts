/** 종이비행기 (D-056, 시안 'J-planner 필터 숨김 종이비행기 시안'의 경로·시간 그대로) */
export const PAPER_PLANE_SIZE = 45;
export const PAPER_PLANE_DURATION_MS = 700;
export const PAPER_PLANE_EASING = 'cubic-bezier(.45,.05,.55,.95)';
const STEPS = 24;

export interface Point {
  x: number;
  y: number;
}

const round = (value: number) => Number(value.toFixed(2));

/**
 * 저장 버튼 → 필터 버튼으로 나는 2차 베지어 곡선 keyframe (24단계)
 * - 위로 솟았다가 내려간다 (제어점: 가운데에서 왼쪽 위)
 * - 진행 방향으로 기울고, 1.1배에서 0.65배로 작아지며, 마지막 10%에서 사라진다
 */
export const paperPlaneFrames = (start: Point, end: Point, variant: 'pc' | 'mobile') => {
  const control = {
    x: (start.x + end.x) / 2 + (variant === 'pc' ? -60 : -70),
    y: Math.min(start.y, end.y) - (variant === 'pc' ? 40 : 120),
  };
  const at = (t: number): Point => ({
    x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t * t * end.x,
    y: (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t * t * end.y,
  });
  const half = PAPER_PLANE_SIZE / 2;

  return Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = i / STEPS;
    const here = at(t);
    const ahead = at(Math.min(1, t + 0.02));
    const angle = (Math.atan2(ahead.y - here.y, ahead.x - here.x) * 180) / Math.PI + 45;
    return {
      transform: `translate(${round(here.x - half)}px,${round(here.y - half)}px) rotate(${round(angle)}deg) scale(${round(1.1 - 0.45 * t)})`,
      opacity: t > 0.9 ? 1 - (t - 0.9) * 8 : 1,
    };
  });
};
