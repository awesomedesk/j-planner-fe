import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SWIPE_MIN_DISTANCE, useSwipe } from './useSwipe';

function Area({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  const swipe = useSwipe({ onPrev, onNext });
  return (
    <div data-testid="area" {...swipe}>
      <div data-testid="inner">달력</div>
      <div data-swipe-ignore data-testid="tabs">탭 줄 (좌우 스크롤)</div>
    </div>
  );
}

const swipe = (el: HTMLElement, dx: number, dy = 0) => {
  fireEvent.touchStart(el, { touches: [{ clientX: 200, clientY: 300 }] });
  fireEvent.touchEnd(el, { changedTouches: [{ clientX: 200 + dx, clientY: 300 + dy }] });
};

const setup = () => {
  const onPrev = vi.fn();
  const onNext = vi.fn();
  render(<Area onPrev={onPrev} onNext={onNext} />);
  return { onPrev, onNext };
};

describe('좌우 스와이프 (D-025)', () => {
  it('왼쪽으로 밀면 다음, 오른쪽으로 밀면 이전', () => {
    const { onPrev, onNext } = setup();
    swipe(screen.getByTestId('inner'), -120);
    expect(onNext).toHaveBeenCalledTimes(1);
    swipe(screen.getByTestId('inner'), 120);
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it(`짧게 밀면(${SWIPE_MIN_DISTANCE}px 미만) 움직이지 않는다`, () => {
    const { onPrev, onNext } = setup();
    swipe(screen.getByTestId('inner'), -(SWIPE_MIN_DISTANCE - 1));
    expect(onNext).not.toHaveBeenCalled();
    expect(onPrev).not.toHaveBeenCalled();
  });

  it('세로로 더 많이 움직이면(시간표 스크롤) 날짜를 넘기지 않는다', () => {
    const { onNext } = setup();
    swipe(screen.getByTestId('inner'), -80, 200);
    expect(onNext).not.toHaveBeenCalled();
  });

  it('좌우 스크롤하는 곳(탭 줄)에서 민 것은 무시', () => {
    const { onNext } = setup();
    swipe(screen.getByTestId('tabs'), -150);
    expect(onNext).not.toHaveBeenCalled();
  });
});
