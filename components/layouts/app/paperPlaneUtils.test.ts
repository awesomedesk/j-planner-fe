import { describe, expect, it } from 'vitest';

import { PAPER_PLANE_SIZE, paperPlaneFrames } from './paperPlaneUtils';

describe('종이비행기 비행 경로 (D-056, 시안 그대로)', () => {
  const from = { x: 100, y: 600 };
  const to = { x: 900, y: 30 };

  it('2차 베지어 곡선 24단계 → keyframe 25개, 저장 버튼에서 출발해 필터 버튼에 도착', () => {
    const frames = paperPlaneFrames(from, to, 'pc');
    expect(frames).toHaveLength(25);
    const half = PAPER_PLANE_SIZE / 2;
    expect(frames[0].transform).toContain(`translate(${from.x - half}px,${from.y - half}px)`);
    expect(frames[24].transform).toContain(`translate(${to.x - half}px,${to.y - half}px)`);
  });

  it('가면서 작아지고(1.1 → 0.65), 끝에서만 사라진다', () => {
    const frames = paperPlaneFrames(from, to, 'pc');
    expect(frames[0].transform).toContain('scale(1.1)');
    expect(frames[24].transform).toContain('scale(0.65)');
    expect(frames[0].opacity).toBe(1);
    expect(frames[21].opacity).toBe(1);
    expect(frames[24].opacity).toBeCloseTo(0.2);
  });

  it('곡선은 위로 솟았다가 내려간다 (가운데가 시작·끝을 이은 직선보다 위)', () => {
    const frames = paperPlaneFrames(from, to, 'mobile');
    const y = (i: number) => Number(/translate\([^,]+,(-?[\d.]+)px\)/.exec(frames[i].transform)![1]);
    expect(y(12)).toBeLessThan((y(0) + y(24)) / 2);
  });
});
