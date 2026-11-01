"use client";

import type { ReactNode } from 'react';

import { useSession } from '@components/auth/useSession';

import LandingPage from './LandingPage';

/**
 * 첫 화면 `/` (US-39 AC1, 06 SITE-01) — 로그인 안 했으면 메인(소개), 했으면 children(달력).
 * 확인하는 동안은 아무것도 그리지 않는다. 서버에 닿지 않을 때(error)는 children(RequireLogin)이 안내한다.
 */
export default function HomeGate({ children }: { children: ReactNode }) {
  const { status } = useSession();
  if (status === 'idle' || status === 'checking') return null;
  if (status === 'signedOut') return <LandingPage />;
  return <>{children}</>;
}
