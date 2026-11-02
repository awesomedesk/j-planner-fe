"use client";

import { useEffect, useRef, useState } from 'react';

import AppDataLoader from '@components/app/AppDataLoader';
import AppShell from '@components/layouts/app/AppShell';
import { createDemoBackend, installDemoMode } from '@utils/api/demo/demoBackend';
import { buildDemoData } from '@utils/api/demo/demoData';
import { useLatest } from '@utils/hooks/useLatest';

import DemoBanner from './DemoBanner';
import SaveBlockedDialog from './SaveBlockedDialog';

/**
 * DemoPage - 로그인 없이 둘러보기 `/demo` (US-40, D-061·D-093 · 06 SITE-08)
 * 기존 달력·Todo 화면(AppShell)을 그대로 쓰고, 데이터는 오늘 기준 코드 속 예시로 바꾼다:
 * - apiClient 요청 가로채기를 **화면을 그리기 전에** 설치 → 실제 서버(계정 데이터 API)에 아무것도 보내지 않음.
 *   로그인한 브라우저여도 예시만 (RequireLogin·로그인 확인 없음)
 * - 바꾸는 요청은 보내기 전에 '가입하면 저장돼요' — 예시·입력 그대로, 브라우저 저장소에도 남기지 않음
 * - 페이지를 떠나면 가로채기를 걷어 실제 앱에 예시가 섞이지 않게 한다. 새로고침하면 처음 예시로
 */
export default function DemoPage() {
  const [blocked, setBlocked] = useState(false);
  const openBlocked = useLatest(() => setBlocked(true));
  // 자식이 첫 요청을 보내기 전에 설치돼 있어야 해서 처음 그릴 때 만든다 (같은 값을 두 번 만들어도 무해)
  const [backend] = useState(() => {
    const created = createDemoBackend(buildDemoData(new Date()), () => openBlocked.current());
    installDemoMode(created);
    return created;
  });
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    installDemoMode(backend);
    return () => {
      mounted.current = false;
      // StrictMode의 시험 해제(곧바로 다시 붙음) 동안 실제 서버로 새지 않게, 정말 떠날 때만 걷는다
      queueMicrotask(() => {
        if (!mounted.current) installDemoMode(null);
      });
    };
  }, [backend]);

  return (
    <>
      <AppShell topBanner={<DemoBanner />} />
      <AppDataLoader />
      {blocked && <SaveBlockedDialog onClose={() => setBlocked(false)} />}
    </>
  );
}
