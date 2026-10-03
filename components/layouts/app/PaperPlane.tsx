"use client";

import { useLayoutEffect, useRef } from 'react';

import { PAPER_PLANE_DURATION_MS, PAPER_PLANE_EASING, PAPER_PLANE_SIZE, paperPlaneFrames, type Point } from './paperPlaneUtils';
import { useLatest } from '@utils/hooks/useLatest';

interface PaperPlaneProps {
  from: Point;
  to: Point;
  variant: 'pc' | 'mobile';
  onDone: () => void;
}

/**
 * PaperPlane - 저장 버튼에서 카테고리 필터 버튼 '뒤로' 날아가 숨는 종이비행기 (D-056)
 * 층: 시간표·헤더 바탕 위(z-46), 필터 버튼 아래(z-47)
 */
export default function PaperPlane({ from, to, variant, onDone }: PaperPlaneProps) {
  const ref = useRef<SVGSVGElement>(null);
  const onDoneRef = useLatest(onDone);

  useLayoutEffect(() => {
    const plane = ref.current;
    // Web Animations가 없는 환경이면 바로 다음 단계로
    if (!plane?.animate) {
      onDoneRef.current();
      return undefined;
    }
    const animation = plane.animate(paperPlaneFrames(from, to, variant), {
      duration: PAPER_PLANE_DURATION_MS,
      easing: PAPER_PLANE_EASING,
      fill: 'forwards',
    });
    animation.onfinish = () => onDoneRef.current();
    return () => animation.cancel();
  }, [from, to, variant, onDoneRef]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[46]" aria-hidden="true">
      <svg
        ref={ref}
        data-testid="paper-plane"
        width={PAPER_PLANE_SIZE}
        height={PAPER_PLANE_SIZE}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        className="absolute left-0 top-0 text-tp-dark drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]"
        style={{ opacity: 0 }}
      >
        <path d="M22 2L2 10.5l7.5 3L12 21l3.2-6.2L22 2z" className="fill-tp-light" />
        <path d="M9.5 13.5L22 2" />
      </svg>
    </div>
  );
}
