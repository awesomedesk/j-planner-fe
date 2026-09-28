import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * 스크롤 영역의 세로 스크롤바 폭 (px)
 * 스크롤바가 항상 보이는 환경(마우스를 연결한 Mac, Windows)에서는 그만큼 안쪽이 좁아진다.
 * 시간표처럼 위 머리글과 세로선을 맞춰야 할 때, 머리글에도 이 폭만큼 오른쪽을 비운다 (US-07 검수).
 * 스크롤바가 내용 위에 겹쳐 뜨는 환경(모바일, 트랙패드 Mac)은 0.
 */
export function useScrollbarWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setWidth(Math.max(element.offsetWidth - element.clientWidth, 0));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
