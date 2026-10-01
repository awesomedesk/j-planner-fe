import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetViewport, setReducedMotion } from '@/test/viewport';

import { SWIPE_MIN_DISTANCE, useSwipe } from './useSwipe';

function Area({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  const swipe = useSwipe({ onPrev, onNext });
  return (
    <div data-testid="area" {...swipe.handlers}>
      <div data-testid="track" style={swipe.style}>
        <div data-testid="inner">달력</div>
        <div data-swipe-ignore data-testid="tabs">탭 줄 (좌우 스크롤)</div>
      </div>
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

describe('스와이프 따라 움직이기 (D-051 Q4)', () => {
  afterEach(() => {
    resetViewport();
    vi.restoreAllMocks();
  });
  const track = () => screen.getByTestId('track');
  const start = (el: HTMLElement) => fireEvent.touchStart(el, { touches: [{ clientX: 200, clientY: 300 }] });
  const move = (el: HTMLElement, dx: number, dy = 0) => fireEvent.touchMove(el, { touches: [{ clientX: 200 + dx, clientY: 300 + dy }] });
  const end = (el: HTMLElement, dx: number, dy = 0) => fireEvent.touchEnd(el, { changedTouches: [{ clientX: 200 + dx, clientY: 300 + dy }] });

  it('가로로 미는 동안 화면이 손가락을 따라 움직인다', () => {
    setup();
    start(screen.getByTestId('inner'));
    move(screen.getByTestId('inner'), -60);
    expect(track().style.transform).toBe('translateX(-60px)');
    expect(track().style.transition).toBe('');
  });

  it('세로로 움직이면(시간표 스크롤) 따라가지 않는다', () => {
    setup();
    start(screen.getByTestId('inner'));
    move(screen.getByTestId('inner'), -20, 80);
    move(screen.getByTestId('inner'), -60, 120);
    expect(track().style.transform).toBe('');
  });

  it('조금만 밀고 놓으면 제자리로 돌아온다', () => {
    const { onNext } = setup();
    start(screen.getByTestId('inner'));
    move(screen.getByTestId('inner'), -30);
    end(screen.getByTestId('inner'), -30);
    expect(onNext).not.toHaveBeenCalled();
    expect(track().style.transform).toBe('translateX(0px)');
    expect(track().style.transition).toContain('transform');
  });

  it('넘기면 다음 화면이 민 쪽에서 이어서 들어온다', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(390);
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => frames.push(cb));
    const { onNext } = setup();
    start(screen.getByTestId('inner'));
    move(screen.getByTestId('inner'), -120);
    end(screen.getByTestId('inner'), -120);
    expect(onNext).toHaveBeenCalledTimes(1);
    // 새 화면은 오른쪽 (390 - 120)px에서 시작해
    expect(track().style.transform).toBe('translateX(270px)');
    act(() => frames.forEach((cb) => cb(0)));
    // 제자리로 미끄러져 들어온다
    expect(track().style.transform).toBe('translateX(0px)');
    expect(track().style.transition).toContain('transform');
  });

  it('움직임 줄이기 설정이면 따라가지 않고 바로 바뀐다', () => {
    setReducedMotion(true);
    const { onNext } = setup();
    start(screen.getByTestId('inner'));
    move(screen.getByTestId('inner'), -120);
    expect(track().style.transform).toBe('');
    end(screen.getByTestId('inner'), -120);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(track().style.transform).toBe('');
    expect(track().style.transition).toBe('');
  });
});
