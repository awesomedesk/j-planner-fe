/**
 * 화면 폭 흉내 (D-018). jsdom에는 matchMedia가 없어서 `(min-width: Npx)`만 계산해 준다.
 * @example setViewportWidth(390) // 모바일
 */
let viewportWidth = 1440;
/** 움직임 줄이기 설정 (prefers-reduced-motion) */
let reducedMotion = false;

const matches = (query: string) => {
  if (/prefers-reduced-motion:\s*reduce/.test(query)) return reducedMotion;
  const minWidth = /min-width:\s*(\d+)px/.exec(query);
  return minWidth ? viewportWidth >= Number(minWidth[1]) : false;
};

const install = () => {
  window.matchMedia = ((query: string) => ({
    matches: matches(query),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
};

export const setViewportWidth = (width: number) => {
  viewportWidth = width;
  install();
};

/** OS의 '동작 줄이기' 켬/끔 흉내 */
export const setReducedMotion = (reduce: boolean) => {
  reducedMotion = reduce;
  install();
};

/** ResizeObserver가 알려 줄 높이 (월간 칸 높이 → '+n 더보기' 계산용) */
export const resizeHeight = { current: 900 };
export const setResizeHeight = (height: number) => {
  resizeHeight.current = height;
};

export const resetViewport = () => {
  reducedMotion = false;
  setViewportWidth(1440);
  resizeHeight.current = 900;
};

install();
