"use client";

import { useState } from 'react';
import type { ReactNode } from 'react';

import Icon from '@components/icons/LineIcon';

import { BREAKPOINT, useMediaQuery } from '@utils/hooks/useMediaQuery';

import type { CalendarViewMode } from './appLayoutUtils';
import MobileHeader from './MobileHeader';
import PcHeader from './PcHeader';
import SidebarArea from './SidebarArea';
import SidebarSections from './SidebarSections';
import { formatSidebarDate } from './appLayoutUtils';

interface AppShellProps {
  children: ReactNode;
}

/**
 * AppShell - 모든 화면이 쓰는 반응형 틀 (US-01, D-018)
 *
 * | 폭 | 구성 |
 * |---|---|
 * | 1920px 이상 | PC 헤더 한 줄 + 달력 + 사이드바 360px |
 * | 1024~1919px | PC 헤더 한 줄 + 달력 + 사이드바 330px (열린 상태로 시작) |
 * | 768~1023px | PC 헤더 한 줄(줄임) + 달력 + 닫힌 사이드바 막대. 열면 달력 위에 겹침 |
 * | 600~767px | 모바일 헤더 + 달력 + 오른쪽 패널(날짜 시트 자리) + 오른쪽 아래 + 버튼 |
 * | 600px 미만 | 모바일 헤더 + 달력 + 오른쪽 아래 + 버튼 |
 */
export default function AppShell({ children }: AppShellProps) {
  const isPc = useMediaQuery(`(min-width: ${BREAKPOINT.pc}px)`, true);
  const [today] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('MONTH');
  /** 사용자가 직접 열고 닫기 전에는 폭에 따라 정한다 (PC 열림, 태블릿 닫힘) */
  const [sidebarOpenOverride, setSidebarOpenOverride] = useState<boolean | null>(null);
  const isSidebarOpen = sidebarOpenOverride ?? isPc;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-tp-bg text-tp-text">
      <PcHeader className="hidden tablet:flex" baseDate={today} viewMode={viewMode} onChangeViewMode={setViewMode} />
      <MobileHeader className="flex tablet:hidden" baseDate={today} />

      <div className="relative flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col fold:w-[400px] fold:flex-none tablet:w-auto tablet:flex-1">{children}</main>

        {/* 폴드 펼침(600~767px): 날짜 시트가 오른쪽 패널로 (FOLD-01) */}
        <aside
          aria-label="날짜 패널"
          className="hidden min-w-0 flex-1 flex-col gap-2.5 overflow-y-auto border-l border-tp-line p-3 fold:flex tablet:hidden"
        >
          <h2 className="text-base font-bold" suppressHydrationWarning>
            {formatSidebarDate(today)}
          </h2>
          <SidebarSections />
        </aside>

        <SidebarArea
          className="hidden tablet:flex"
          selectedDate={today}
          isOpen={isSidebarOpen}
          isOverlay={!isPc}
          onOpen={() => setSidebarOpenOverride(true)}
          onClose={() => setSidebarOpenOverride(false)}
        />
      </div>

      {/* 모바일·폴드: 오른쪽 아래 + 버튼 자리 (MO-01, 추가 선택 MO-07은 US-05) */}
      <button
        type="button"
        aria-label="추가"
        className="fixed bottom-5 right-4 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full bg-tp-primary text-tp-on-primary shadow-[0_6px_16px_rgba(0,0,0,0.25)] tablet:hidden"
      >
        <Icon name="plus" size={24} strokeWidth={2.4} />
      </button>
    </div>
  );
}
