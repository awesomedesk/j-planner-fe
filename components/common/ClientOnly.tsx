"use client";

import { useSyncExternalStore, type ReactNode } from 'react';

const subscribe = () => () => {};

/**
 * ClientOnly - 브라우저에서만 그린다
 * 정적 빌드(output: export)는 빌드한 순간의 '오늘'로 HTML을 만든다. React 18은 붙일 때(hydration)
 * 속성만 다른 곳(aria-current, style)을 고치지 않아서, 빌드한 날이 오늘로 강조될 수 있다.
 * '오늘'에 따라 달라지는 화면은 이 안에 넣어 브라우저의 시각으로만 그린다.
 */
export default function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  return <>{isClient ? children : fallback}</>;
}
