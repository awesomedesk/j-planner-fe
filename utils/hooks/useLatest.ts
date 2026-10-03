"use client";

import { useLayoutEffect, useRef } from 'react';

/**
 * useLatest - 이벤트 처리기·타이머·effect 안에서 읽을 "가장 최근 값" (US-31)
 * React 19 규칙(react-hooks/refs)상 렌더 도중 `ref.current = 값`을 쓰지 않는다 → 화면 반영 직후(layout effect)에 넣는다.
 * 같은 컴포넌트에서 이 훅보다 뒤에 선언한 effect는 이미 바뀐 값을 읽는다.
 * @example const onDoneRef = useLatest(onDone); useEffect(() => { … onDoneRef.current(); }, []);
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
