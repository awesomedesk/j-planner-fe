"use client";

import { useState } from 'react';

import type { LocalDate, Schedule } from '@/types/api';
import type { CalendarViewMode } from '@/types/calendar';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import DayScheduleList from '@components/calendar/common/DayScheduleList';
import CalendarDaily from '@components/calendar/daily/CalendarDaily';
import DateSheet from '@components/calendar/mobile/DateSheet';
import CalendarMonthly from '@components/calendar/monthly/CalendarMonthly';
import CalendarWeekly from '@components/calendar/weekly/CalendarWeekly';
import CategoryManagerDialog from '@components/category/CategoryManagerDialog';
import CategoryFilterDropdown from '@components/category/filter/CategoryFilterDropdown';
import CategoryFilterSheet from '@components/category/filter/CategoryFilterSheet';
import ClientOnly from '@components/common/ClientOnly';
import ScheduleFormDialog from '@components/schedule/form/ScheduleFormDialog';
import { dayTabBehavior } from '@components/sidebar/sidebarItems';
import TodoFormDialog from '@components/todo/form/TodoFormDialog';
import type { TodoFormTarget } from '@components/todo/hooks/useTodoForm';
import type { ScheduleFormTarget } from '@components/schedule/hooks/useScheduleForm';
import DiscardConfirm from '@components/dialog/DiscardConfirm';
import QuickAddSchedule, { QUICK_ADD_SHEET_HEIGHT } from '@components/schedule/quick/QuickAddSchedule';
import type { ScheduleFormValues } from '@components/schedule/utils/scheduleFormUtils';
import {
  goToday,
  moveView,
  openDayView,
  selectCategoryFilter,
  selectMobileDayTab,
  selectSelectedDate,
  selectViewDate,
  selectViewMode,
  setCategoryFilter,
  setViewMode,
} from '@store/slices/calendarSlice';
import { selectCategories, selectCategoriesById } from '@store/slices/categorySlice';
import { refreshSchedules, selectSchedules } from '@store/slices/scheduleSlice';

import { formatDayTitle, toLocalDate } from '@utils/date/dateUtils';
import { BREAKPOINT, useMediaQuery } from '@utils/hooks/useMediaQuery';
import { useSwipe } from '@utils/hooks/useSwipe';

import type { AddTarget } from './addMenuItems';
import { formatViewTitle } from './appLayoutUtils';
import MobileAddMenu from './MobileAddMenu';
import MobileHeader from './MobileHeader';
import PcHeader from './PcHeader';
import SidebarArea from './SidebarArea';
import SidebarSections from './SidebarSections';
import PaperPlane from './PaperPlane';
import { useHiddenSaveNotice } from './useHiddenSaveNotice';
import { useQuickAddState } from './useQuickAddState';
import { getDayTabSlots } from './dayTabSlots';

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
  // 날짜('오늘')에 따라 달라지는 화면이라 브라우저에서만 그린다 (빌드 시각이 남지 않게)
  return (
    <ClientOnly fallback={<div className="h-dvh bg-tp-bg" />}>
      <AppShellContent />
    </ClientOnly>
  );
}

function AppShellContent() {
  const dispatch = useAppDispatch();
  const isPc = useMediaQuery(`(min-width: ${BREAKPOINT.pc}px)`, true);
  const isTabletUp = useMediaQuery(`(min-width: ${BREAKPOINT.tablet}px)`, true);
  const isFoldUp = useMediaQuery(`(min-width: ${BREAKPOINT.fold}px)`, true);

  const viewMode = useAppSelector(selectViewMode);
  const viewDate = useAppSelector(selectViewDate);
  const selectedDate = useAppSelector(selectSelectedDate);
  const schedules = useAppSelector(selectSchedules);
  const categories = useAppSelector(selectCategories);
  const categoriesById = useAppSelector(selectCategoriesById);
  const categoryFilter = useAppSelector(selectCategoryFilter);

  /** 사용자가 직접 열고 닫기 전에는 폭에 따라 정한다 (PC 열림, 태블릿 닫힘) */
  const [sidebarOpenOverride, setSidebarOpenOverride] = useState<boolean | null>(null);
  const isSidebarOpen = sidebarOpenOverride ?? isPc;
  /** 모바일 날짜 시트에 보이는 날짜 (null = 닫힘) */
  const [sheetDate, setSheetDate] = useState<LocalDate | null>(null);
  /** 열려 있는 일정 입력 창 (US-05) */
  const [scheduleFormTarget, setScheduleFormTarget] = useState<ScheduleFormTarget | null>(null);
  /** 열려 있는 Todo 입력 창 (US-12). 수정은 Todo 박스(US-13)에서 연다 */
  const [todoFormTarget, setTodoFormTarget] = useState<TodoFormTarget | null>(null);
  /** 카테고리 관리 창 (필터 드롭다운·시트에서 연다, D-016) */
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  /** 빈 시간을 눌러 연 빠른 추가 (US-10, D-053) */
  const quickAdd = useQuickAddState();
  /** 필터에서 빠진 카테고리로 저장했을 때 알려 주기 (D-056) */
  const hiddenSave = useHiddenSaveNotice(categoryFilter, categories);

  /** 추가 메뉴에서 고른 항목 열기. 기준 날짜 = 고른 날짜 (D-015) */
  const handleSelectAdd = (target: AddTarget) => {
    if (target === 'SCHEDULE') setScheduleFormTarget({ mode: 'create', baseDate: selectedDate });
    if (target === 'TODO') setTodoFormTarget({ mode: 'create', baseDate: selectedDate });
  };
  const openSchedule = (schedule: Schedule) => setScheduleFormTarget({ mode: 'edit', schedule });
  const closeScheduleForm = (changed: boolean) => {
    setScheduleFormTarget(null);
    if (changed) void dispatch(refreshSchedules());
  };
  const closeQuickAdd = quickAdd.close;
  const saveQuickAdd = (schedule: Schedule) => {
    hiddenSave.notify(schedule);
    closeQuickAdd();
    void dispatch(refreshSchedules());
  };
  /** '자세히 입력' → 쓴 값을 그대로 일정 추가 창으로 */
  const openQuickAddDetail = (values: ScheduleFormValues) => {
    if (!quickAdd.slot) return;
    const { date } = quickAdd.slot;
    closeQuickAdd();
    setScheduleFormTarget({ mode: 'create', baseDate: date, startTime: values.startTime, draft: values });
  };
  /** 날짜 이동 (US-09): ‹ ›·스와이프는 보기 단위만큼, '오늘'은 오늘로. 열린 날짜 시트는 닫는다 */
  const move = (step: number) => {
    setSheetDate(null);
    closeQuickAdd();
    dispatch(moveView(step));
  };
  const backToToday = () => {
    setSheetDate(null);
    closeQuickAdd();
    dispatch(goToday(toLocalDate(new Date())));
  };
  const changeViewMode = (mode: CalendarViewMode) => {
    closeQuickAdd();
    dispatch(setViewMode(mode));
  };
  /** 모바일은 달력을 좌우로 밀어 넘긴다 (D-025). PC·태블릿은 헤더 ‹ › */
  const swipe = useSwipe({ onPrev: () => move(-1), onNext: () => move(1) });

  /** 모바일 일간 탭 (D-049, US-25 연결 지점): 탭 내용은 dayTabSlots, 탭별 동작은 dayTabBehavior */
  const mobileDayTab = useAppSelector(selectMobileDayTab);
  const dayTabSlots = getDayTabSlots();
  const activeDayTab = !isTabletUp && viewMode === 'DAY' && mobileDayTab !== 'TIMETABLE' && dayTabSlots[mobileDayTab] ? mobileDayTab : 'TIMETABLE';
  const tabBehavior = dayTabBehavior(activeDayTab);
  const activeSlot = activeDayTab === 'TIMETABLE' ? undefined : dayTabSlots[activeDayTab];
  /** + 를 누를 때마다 1씩 → 탭 내용이 새로 만들기를 연다 (directAddLabel이 있는 탭) */
  const [tabAddRequest, setTabAddRequest] = useState(0);
  const tabContent = Object.fromEntries(
    Object.entries(dayTabSlots).map(([key, slot]) => [key, slot.render({ date: viewDate, addRequestKey: tabAddRequest })])
  );

  const openDayPlan = (date: LocalDate) => {
    setSheetDate(null);
    dispatch(openDayView(date));
  };

  /** 관리 창에서 지운 카테고리의 일정은 미지정으로 옮겨지므로 다시 받는다 (D-014) */
  const closeCategoryManager = () => {
    setIsCategoryManagerOpen(false);
    void dispatch(refreshSchedules());
  };
  /** 카테고리 필터 (US-11): PC·태블릿은 드롭다운, 모바일은 아래 시트 */
  const categoryFilterProps = {
    categories,
    filter: categoryFilter,
    onChange: (filter: typeof categoryFilter) => dispatch(setCategoryFilter(filter)),
    onOpenManager: () => setIsCategoryManagerOpen(true),
    reveal: hiddenSave.reveal,
    onRevealDone: hiddenSave.clearReveal,
  };

  /** 시간표(주간·일간) 공통: 블록 → 수정, 빈 시간 → 빠른 추가 (US-10) */
  const timetableProps = {
    onOpenSchedule: openSchedule,
    onAddAt: quickAdd.addAt,
    draft: quickAdd.draft,
    onDraftChange: quickAdd.changeDraftRange,
    coverBottom: isTabletUp ? 0 : QUICK_ADD_SHEET_HEIGHT,
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
    ) : viewMode === 'WEEK' ? (
      <CalendarWeekly variant={isTabletUp ? 'pc' : 'mobile'} {...timetableProps} />
    ) : (
      <CalendarDaily variant={isTabletUp ? 'pc' : 'mobile'} {...timetableProps} tabContent={tabContent} />
    );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-tp-bg text-tp-text">
      <PcHeader
        className="hidden tablet:flex"
        title={formatViewTitle(viewMode, viewDate)}
        viewMode={viewMode}
        onChangeViewMode={changeViewMode}
        onMove={move}
        onToday={backToToday}
        onSelectAdd={handleSelectAdd}
        categoryFilter={isTabletUp && <CategoryFilterDropdown {...categoryFilterProps} />}
      />
      <MobileHeader
        className="flex tablet:hidden"
        title={formatViewTitle(viewMode, viewDate)}
        viewMode={viewMode}
        onChangeViewMode={changeViewMode}
        onToday={backToToday}
        onMoveDay={tabBehavior.dateNav === 'arrows' ? move : undefined}
        categoryFilter={!isTabletUp && tabBehavior.categoryFilter && <CategoryFilterSheet {...categoryFilterProps} />}
      />

      <div className="relative flex min-h-0 flex-1">
        <main
          className="flex min-w-0 flex-1 flex-col fold:w-[400px] fold:flex-none tablet:w-auto tablet:flex-1"
          {...(isTabletUp || !tabBehavior.swipe ? {} : swipe.handlers)}
        >
          {/* 모바일 스와이프: 손가락을 따라 움직이는 층 (D-051) */}
          <div className="flex min-h-0 flex-1 flex-col" style={swipe.style} onTransitionEnd={swipe.onTransitionEnd}>
            {mainContent}
          </div>
        </main>

        {/* 폴드 펼침(600~767px): 날짜 시트 내용이 오른쪽 패널로 (FOLD-01) */}
        <aside
          aria-label="날짜 패널"
          className="hidden min-w-0 flex-1 flex-col gap-2.5 overflow-y-auto border-l border-tp-line p-3 fold:flex tablet:hidden"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">
              {formatDayTitle(selectedDate)}
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
          selectedDate={selectedDate}
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
      <MobileAddMenu
        className="tablet:hidden"
        onSelect={handleSelectAdd}
        directAdd={activeSlot?.directAddLabel ? { label: activeSlot.directAddLabel, onAdd: () => setTabAddRequest((n) => n + 1) } : null}
      />

      {hiddenSave.flight && (
        <PaperPlane
          from={hiddenSave.flight.from}
          to={hiddenSave.flight.to}
          variant={isTabletUp ? 'pc' : 'mobile'}
          onDone={hiddenSave.finishFlight}
        />
      )}
      {/* 화면에는 띄우지 않고 화면 읽기로만 (D-056) */}
      <div role="status" aria-live="polite" className="sr-only">
        {hiddenSave.liveMessage}
      </div>

      {isCategoryManagerOpen && <CategoryManagerDialog onClose={closeCategoryManager} />}

      {quickAdd.slot && (
        <QuickAddSchedule
          key={quickAdd.key}
          variant={isTabletUp ? 'popover' : 'sheet'}
          date={quickAdd.slot.date}
          startTime={quickAdd.slot.startTime}
          durationMinutes={quickAdd.slot.durationMinutes}
          times={quickAdd.times}
          anchor={quickAdd.slot.anchor}
          categories={categories}
          onClose={closeQuickAdd}
          onSaved={saveQuickAdd}
          onOpenDetail={openQuickAddDetail}
          onPreviewChange={quickAdd.setPreview}
          onDirtyChange={quickAdd.setDirty}
        />
      )}
      {/* 입력 중에 다른 빈 시간을 눌렀을 때 (D-053 Q7) */}
      {quickAdd.pendingSlot && <DiscardConfirm onKeepEditing={quickAdd.keepEditing} onDiscard={quickAdd.discardAndMove} />}

      {todoFormTarget && (
        <TodoFormDialog
          target={todoFormTarget}
          categories={categories}
          onClose={() => setTodoFormTarget(null)}
          onSaved={() => setTodoFormTarget(null)}
          onDeleted={() => setTodoFormTarget(null)}
        />
      )}

      {scheduleFormTarget && (
        <ScheduleFormDialog
          target={scheduleFormTarget}
          categories={categories}
          onClose={() => closeScheduleForm(false)}
          onSaved={(schedule) => {
            // 새 일정이든 수정이든, 필터에서 빠진 카테고리로 저장하면 알린다 (D-056 보완)
            hiddenSave.notify(schedule);
            closeScheduleForm(true);
          }}
          onDeleted={() => closeScheduleForm(true)}
        />
      )}
    </div>
  );
}
