"use client";

import { useMemo, useState } from 'react';

import type { Category, Id, LocalDate, Schedule } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import DayScheduleList from '@components/calendar/common/DayScheduleList';
import DateSheet from '@components/calendar/mobile/DateSheet';
import CalendarMonthly from '@components/calendar/monthly/CalendarMonthly';
import { fromLocalDate } from '@components/calendar/utils/calendarUtils';
import ScheduleFormDialog from '@components/schedule/form/ScheduleFormDialog';
import type { ScheduleFormTarget } from '@components/schedule/hooks/useScheduleForm';
import {
  openDayView,
  selectSelectedDate,
  selectViewDate,
  selectViewMode,
  setViewMode,
} from '@store/slices/calendarSlice';
import { selectCategories } from '@store/slices/categorySlice';
import { refreshSchedules, selectSchedules } from '@store/slices/scheduleSlice';

import { BREAKPOINT, useMediaQuery } from '@utils/hooks/useMediaQuery';

import type { AddTarget } from './addMenuItems';
import { formatSidebarDate } from './appLayoutUtils';
import CalendarPlaceholder from './CalendarPlaceholder';
import MobileAddMenu from './MobileAddMenu';
import MobileHeader from './MobileHeader';
import PcHeader from './PcHeader';
import SidebarArea from './SidebarArea';
import SidebarSections from './SidebarSections';

/**
 * AppShell - 앱 화면 틀 + 달력 (US-01, US-06, D-018)
 *
 * | 폭 | 구성 |
 * |---|---|
 * | 1920px 이상 | PC 헤더 한 줄 + 월간(막대) + 사이드바 360px |
 * | 1024~1919px | PC 헤더 한 줄 + 월간(막대) + 사이드바 330px (열린 상태로 시작) |
 * | 768~1023px | PC 헤더 한 줄(줄임) + 월간(막대) + 닫힌 사이드바 막대. 열면 달력 위에 겹침 |
 * | 600~767px | 모바일 헤더 + 월간(색 점) + 오른쪽 날짜 패널 + 오른쪽 아래 + 버튼 |
 * | 600px 미만 | 모바일 헤더 + 월간(색 점) + 날짜를 누르면 아래 시트 + 오른쪽 아래 + 버튼 |
 */
export default function AppShell() {
  const dispatch = useAppDispatch();
  const isPc = useMediaQuery(`(min-width: ${BREAKPOINT.pc}px)`, true);
  const isTabletUp = useMediaQuery(`(min-width: ${BREAKPOINT.tablet}px)`, true);
  const isFoldUp = useMediaQuery(`(min-width: ${BREAKPOINT.fold}px)`, true);

  const viewMode = useAppSelector(selectViewMode);
  const viewDate = useAppSelector(selectViewDate);
  const selectedDate = useAppSelector(selectSelectedDate);
  const schedules = useAppSelector(selectSchedules);
  const categories = useAppSelector(selectCategories);
  const categoriesById = useMemo(() => new Map<Id, Category>(categories.map((c) => [c.id, c])), [categories]);

  /** 사용자가 직접 열고 닫기 전에는 폭에 따라 정한다 (PC 열림, 태블릿 닫힘) */
  const [sidebarOpenOverride, setSidebarOpenOverride] = useState<boolean | null>(null);
  const isSidebarOpen = sidebarOpenOverride ?? isPc;
  /** 모바일 날짜 시트에 보이는 날짜 (null = 닫힘) */
  const [sheetDate, setSheetDate] = useState<LocalDate | null>(null);
  /** 열려 있는 일정 입력 창 (US-05) */
  const [scheduleFormTarget, setScheduleFormTarget] = useState<ScheduleFormTarget | null>(null);

  /** 추가 메뉴에서 고른 항목 열기. 기준 날짜 = 고른 날짜 (D-015) */
  const handleSelectAdd = (target: AddTarget) => {
    if (target === 'SCHEDULE') setScheduleFormTarget({ mode: 'create', baseDate: selectedDate });
  };
  const openSchedule = (schedule: Schedule) => setScheduleFormTarget({ mode: 'edit', schedule });
  const closeScheduleForm = (changed: boolean) => {
    setScheduleFormTarget(null);
    if (changed) void dispatch(refreshSchedules());
  };
  const openDayPlan = (date: LocalDate) => {
    setSheetDate(null);
    dispatch(openDayView(date));
  };

  const mainContent =
    viewMode === 'MONTH' ? (
      <CalendarMonthly
        variant={isTabletUp ? 'bars' : 'dots'}
        onOpenSchedule={openSchedule}
        onTapDate={(date) => {
          if (!isFoldUp) setSheetDate(date);
        }}
      />
    ) : (
      <CalendarPlaceholder label={viewMode === 'WEEK' ? '주간 달력 자리 (US-07)' : '일간 달력 자리 (US-08)'} />
    );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-tp-bg text-tp-text">
      <PcHeader
        className="hidden tablet:flex"
        baseDate={fromLocalDate(viewDate)}
        viewMode={viewMode}
        onChangeViewMode={(mode) => dispatch(setViewMode(mode))}
        onSelectAdd={handleSelectAdd}
      />
      <MobileHeader className="flex tablet:hidden" baseDate={fromLocalDate(viewDate)} />

      <div className="relative flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col fold:w-[400px] fold:flex-none tablet:w-auto tablet:flex-1">{mainContent}</main>

        {/* 폴드 펼침(600~767px): 날짜 시트 내용이 오른쪽 패널로 (FOLD-01) */}
        <aside
          aria-label="날짜 패널"
          className="hidden min-w-0 flex-1 flex-col gap-2.5 overflow-y-auto border-l border-tp-line p-3 fold:flex tablet:hidden"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold" suppressHydrationWarning>
              {formatSidebarDate(fromLocalDate(selectedDate))}
            </h2>
            <button type="button" onClick={() => openDayPlan(selectedDate)} className="text-[13px] font-semibold text-tp-primary">
              하루 계획 보기
            </button>
          </div>
          <DayScheduleList date={selectedDate} schedules={schedules} categoriesById={categoriesById} onOpen={openSchedule} />
          <SidebarSections />
        </aside>

        <SidebarArea
          className="hidden tablet:flex"
          selectedDate={fromLocalDate(selectedDate)}
          isOpen={isSidebarOpen}
          isOverlay={!isPc}
          onOpen={() => setSidebarOpenOverride(true)}
          onClose={() => setSidebarOpenOverride(false)}
        />
      </div>

      {/* 모바일(600px 미만): 날짜를 누르면 아래 시트 (MO-01 ③) */}
      {sheetDate && !isFoldUp && viewMode === 'MONTH' && (
        <DateSheet
          date={sheetDate}
          schedules={schedules}
          categoriesById={categoriesById}
          onOpenSchedule={openSchedule}
          onOpenDayPlan={openDayPlan}
          onClose={() => setSheetDate(null)}
        />
      )}

      {/* 모바일·폴드: 오른쪽 아래 + 버튼 → 추가 선택 (MO-07) */}
      <MobileAddMenu className="tablet:hidden" onSelect={handleSelectAdd} />

      {scheduleFormTarget && (
        <ScheduleFormDialog
          target={scheduleFormTarget}
          categories={categories}
          onClose={() => closeScheduleForm(false)}
          onSaved={() => closeScheduleForm(true)}
          onDeleted={() => closeScheduleForm(true)}
        />
      )}
    </div>
  );
}
