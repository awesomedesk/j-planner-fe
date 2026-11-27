"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type { Dday, Id, LocalDate, Schedule, Todo } from '@/types/api';
import type { CalendarViewMode, SidebarItemType } from '@/types/calendar';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import DayScheduleList from '@components/calendar/common/DayScheduleList';
import CalendarDaily from '@components/calendar/daily/CalendarDaily';
import CalendarList from '@components/calendar/list/CalendarList';
import UnscheduledTodoNotice from '@components/todo/unscheduled/UnscheduledTodoNotice';
import DateSheet from '@components/calendar/mobile/DateSheet';
import CalendarMonthly from '@components/calendar/monthly/CalendarMonthly';
import CalendarWeekly from '@components/calendar/weekly/CalendarWeekly';
import CategoryManagerDialog from '@components/category/CategoryManagerDialog';
import CategoryFilterDropdown from '@components/category/filter/CategoryFilterDropdown';
import CategoryFilterSheet from '@components/category/filter/CategoryFilterSheet';
import { DdayActionsContext } from '@components/dday/DdayActionsContext';
import { DiaryActionsContext } from '@components/diary/DiaryActionsContext';
import DiaryDialog from '@components/diary/DiaryDialog';
import { LeaveGuardProvider, useLeaveGuard } from '@components/dialog/LeaveGuard';
import DdayFormDialog from '@components/dday/form/DdayFormDialog';
import type { DdayFormTarget } from '@components/dday/hooks/useDdayForm';
import ClientOnly from '@components/common/ClientOnly';
import ScheduleFormDialog from '@components/schedule/form/ScheduleFormDialog';
import { buildMobileMenuTabs, dayTabBehavior } from '@components/sidebar/sidebarItems';
import TodoFormDialog from '@components/todo/form/TodoFormDialog';
import { TodoActionsContext } from '@components/todo/TodoActionsContext';
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
  setMobileDayTab,
  setViewMode,
} from '@store/slices/calendarSlice';
import { selectCategories, selectCategoriesById } from '@store/slices/categorySlice';
import { refreshDdays, selectDdaysById } from '@store/slices/ddaySlice';
import { refreshSchedules, selectSchedules } from '@store/slices/scheduleSlice';
import { refreshTodos } from '@store/slices/todoSlice';

import { ddayApi } from '@utils/api';
import { formatDayTitle, toLocalDate } from '@utils/date/dateUtils';
import { useErrorNotice } from '@utils/hooks/useErrorNotice';
import { BREAKPOINT, useMediaQuery } from '@utils/hooks/useMediaQuery';
import { useSwipe } from '@utils/hooks/useSwipe';

import type { AddTarget } from './addMenuItems';
import { displayedViewMode, formatViewTitle } from './appLayoutUtils';
import MobileAddMenu from './MobileAddMenu';
import AccountMenuButton from '@components/auth/account/AccountMenuButton';
import MobileMenu from '@components/auth/account/MobileMenu';
import SettingsAccountScreen from '@components/auth/account/SettingsAccountScreen';
import { focusAccountEntry, peekAccountReturn, takeAccountReturn, type AccountEntry } from '@components/auth/account/accountReturnFocus';
import MobileHeader from './MobileHeader';
import PcHeader from './PcHeader';
import SidebarArea from './SidebarArea';
import SidebarSections, { type SectionFocusRequest } from './SidebarSections';
import SidebarItemsEditor from '@components/sidebar/SidebarItemsEditor';
import CalendarSettingsPanel from '@components/settings/CalendarSettingsPanel';
import { CalendarSettingsContext } from '@components/settings/CalendarSettingsContext';
import { saveLastView } from '@utils/storage/lastViewStorage';
import { saveSettings, selectSidebarItems, selectSidebarOpenSetting, selectWeekStartDay } from '@store/slices/settingsSlice';
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
export default function AppShell({ topBanner }: { topBanner?: ReactNode } = {}) {
  // 날짜('오늘')에 따라 달라지는 화면이라 브라우저에서만 그린다 (빌드 시각이 남지 않게)
  return (
    <ClientOnly fallback={<div className="h-dvh bg-tp-bg" />}>
      {/* 모바일 일기 탭처럼 화면 안에서 쓰던 것을 떠날 때의 확인 (D-037) */}
      <LeaveGuardProvider>
        <AppShellContent topBanner={topBanner} />
      </LeaveGuardProvider>
    </ClientOnly>
  );
}

/** @param topBanner 헤더 위 띠 (둘러보기 안내, US-40) — 화면 높이 안에 함께 들어간다 */
function AppShellContent({ topBanner }: { topBanner?: ReactNode }) {
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

  /**
   * 사이드바 열림 (US-20, D-021): PC(1024px~)는 저장된 `/settings` sidebarOpen(열고 닫을 때마다 저장),
   * 태블릿(768~1023px)은 늘 닫힌 채 시작하고 저장하지 않는다 (FE 검토 ③)
   */
  const sidebarOpenSetting = useAppSelector(selectSidebarOpenSetting);
  const sidebarItems = useAppSelector(selectSidebarItems);
  const weekStart = useAppSelector(selectWeekStartDay);
  const [tabletSidebarOpen, setTabletSidebarOpen] = useState(false);
  const isSidebarOpen = isPc ? sidebarOpenSetting : tabletSidebarOpen;
  /** 막대의 섹션 버튼으로 연 섹션 → 펼쳐서 제목에 초점 (v1.2) */
  const [sectionFocus, setSectionFocus] = useState<SectionFocusRequest | null>(null);
  const openSidebar = (section?: SidebarItemType) => {
    if (isPc) void dispatch(saveSettings({ sidebarOpen: true }));
    else setTabletSidebarOpen(true);
    setSectionFocus((prev) => (section ? { type: section, key: (prev?.key ?? 0) + 1 } : null));
  };
  const closeSidebar = () => {
    if (isPc) void dispatch(saveSettings({ sidebarOpen: false }));
    else setTabletSidebarOpen(false);
  };
  /** 모바일 날짜 시트에 보이는 날짜 (null = 닫힘) */
  const [sheetDate, setSheetDate] = useState<LocalDate | null>(null);
  /** 열려 있는 일정 입력 창 (US-05) */
  const [scheduleFormTarget, setScheduleFormTarget] = useState<ScheduleFormTarget | null>(null);
  /** 열려 있는 Todo 입력 창 (US-12). 수정은 Todo 박스(US-13)에서 연다 */
  const [todoFormTarget, setTodoFormTarget] = useState<TodoFormTarget | null>(null);
  /** 열려 있는 D-Day 입력 창 (US-22). 목록 행·달력 칩·추가 메뉴에서 연다 */
  const [ddayFormTarget, setDdayFormTarget] = useState<DdayFormTarget | null>(null);
  const ddaysById = useAppSelector(selectDdaysById);
  /** 열려 있는 일기 창의 날짜 (US-24, OV-05). 사이드바 일기 섹션·월간 펜에서 연다 */
  const [diaryDate, setDiaryDate] = useState<LocalDate | null>(null);
  const diaryActions = useMemo(() => ({ openDiary: (date: LocalDate) => setDiaryDate(date) }), []);
  const { guard } = useLeaveGuard();
  const notifyError = useErrorNotice();
  /** 카테고리 관리 창 (필터 드롭다운·시트에서 연다, D-016) */
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  /** 모바일 ≡ 메뉴 (MO-02, US-28) */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  // 모바일 '설정 및 계정' 전체 화면 (D-109) — ≡ 메뉴와 동시에 열지 않는다
  /** 열려 있으면 연 버튼(⚙ / ≡), 닫혀 있으면 null */
  const [settingsEntry, setSettingsEntry] = useState<AccountEntry | null>(null);
  const closeSettings = useCallback(() => setSettingsEntry(null), []);
  const openSettingsFromMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setSettingsEntry('menu');
  }, []);
  /**
   * 내 계정(/me)에서 앱 안 이동으로 돌아오면 들어갔던 버튼에 한 번 초점 (D-117).
   * ≡로 들어갔는데 넓은 폭이라 ≡가 없으면 헤더 ⚙로. 버튼이 아직 없으면 다음 폭 판단 때 다시 본다
   */
  useEffect(() => {
    const entry = peekAccountReturn();
    if (!entry) return;
    if (focusAccountEntry(entry === 'menu' && isTabletUp ? 'gear' : entry)) takeAccountReturn();
  }, [isTabletUp]);
  /**
   * 달력 설정 (US-26, #396 v1.3): 설정 및 계정의 '달력 설정 ›'로 연다. entry = 처음 연 버튼(⚙/≡)
   * PC·태블릿은 사이드바 자리 패널(태블릿은 겹침, 바깥 누름 닫기), 모바일은 전체 화면.
   * × · Esc(PC) → 닫고 ⚙에 초점, ‹ 뒤로 → 설정 및 계정(PC 메뉴 다시 열기 / 모바일 화면)의 '달력 설정'에 초점
   */
  const [calendarSettings, setCalendarSettings] = useState<{ entry: AccountEntry } | null>(null);
  const [menuReopenKey, setMenuReopenKey] = useState(0);
  const [returnToCalendarSettings, setReturnToCalendarSettings] = useState(false);
  const calendarSettingsContext = useMemo(
    () => ({
      open: (entry: AccountEntry) => {
        setSettingsEntry(null);
        setReturnToCalendarSettings(false);
        setCalendarSettings({ entry });
      },
      menuReopenKey,
    }),
    [menuReopenKey]
  );
  const closeCalendarSettings = useCallback(() => {
    setCalendarSettings(null);
    focusAccountEntry('gear');
  }, []);
  const backFromCalendarSettings = useCallback(() => {
    const entry = calendarSettings?.entry ?? 'gear';
    setCalendarSettings(null);
    if (isTabletUp) setMenuReopenKey((key) => key + 1);
    else {
      setReturnToCalendarSettings(true);
      setSettingsEntry(entry);
    }
  }, [calendarSettings, isTabletUp]);

  /** 보기가 바뀔 때마다 이 브라우저에 기억 → 처음 화면 '마지막에 본 화면' (US-27, D-029). 처음 그린 보기는 기록하지 않는다 */
  const previousViewMode = useRef(viewMode);
  useEffect(() => {
    if (previousViewMode.current === viewMode) return;
    previousViewMode.current = viewMode;
    saveLastView(viewMode);
  }, [viewMode]);

  /** 빈 시간을 눌러 연 빠른 추가 (US-10, D-053) */
  const quickAdd = useQuickAddState();
  /** 필터에서 빠진 카테고리로 저장했을 때 알려 주기 (D-056) */
  const hiddenSave = useHiddenSaveNotice(categoryFilter, categories);

  /** 추가 메뉴에서 고른 항목 열기. 기준 날짜 = 고른 날짜 (D-015) */
  const handleSelectAdd = (target: AddTarget) => {
    if (target === 'SCHEDULE') setScheduleFormTarget({ mode: 'create', baseDate: selectedDate });
    if (target === 'TODO') setTodoFormTarget({ mode: 'create', baseDate: selectedDate });
    if (target === 'DDAY') setDdayFormTarget({ mode: 'create', baseDate: selectedDate });
  };
  const openSchedule = (schedule: Schedule) => setScheduleFormTarget({ mode: 'edit', schedule });
  const closeScheduleForm = (changed: boolean) => {
    setScheduleFormTarget(null);
    if (changed) void dispatch(refreshSchedules());
  };
  const closeQuickAdd = quickAdd.close;
  /** Todo 저장·삭제 뒤: 창을 닫고 박스와 시간표 Todo 블록을 다시 받는다 (US-13, US-15) */
  const closeTodoForm = () => {
    setTodoFormTarget(null);
    void dispatch(refreshTodos());
  };
  const todoActions = useMemo(
    () => ({
      openTodo: (todo: Todo) => setTodoFormTarget({ mode: 'edit', todo }),
      scheduleTodo: (todo: Todo) => setTodoFormTarget({ mode: 'edit', todo, withTime: true }),
    }),
    []
  );
  /** D-Day 목록이 부탁하는 일: 새 D-Day(기준 날짜 = 사이드바 기준 날짜) · 수정 (US-22) */
  const ddayActions = useMemo(
    () => ({
      openNewDday: () => setDdayFormTarget({ mode: 'create', baseDate: selectedDate }),
      openDday: (dday: Dday) => setDdayFormTarget({ mode: 'edit', dday }),
    }),
    [selectedDate]
  );
  /** 달력 칩 → 그 D-Day 수정. 목록에 아직 없으면 한 개만 받아 온다 (US-23) */
  const openDdayById = (id: Id) => {
    const known = ddaysById.get(id);
    if (known) {
      ddayActions.openDday(known);
      return;
    }
    ddayApi
      .getById(id)
      .then(ddayActions.openDday)
      .catch(notifyError);
  };
  /** D-Day 저장·삭제 뒤: 창을 닫고 목록과 달력 표시를 다시 받는다 (06 달력 표시) */
  const closeDdayForm = () => {
    setDdayFormTarget(null);
    void dispatch(refreshDdays());
  };
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
  // 날짜·보기를 바꾸기 전에 모바일 일기 탭에서 쓰던 것이 있으면 확인 (06 일기 작성 취소)
  const move = (step: number) =>
    guard(() => {
      setSheetDate(null);
      closeQuickAdd();
      dispatch(moveView(step));
    });
  const backToToday = () =>
    guard(() => {
      setSheetDate(null);
      closeQuickAdd();
      dispatch(goToday(toLocalDate(new Date())));
    });
  const changeViewMode = (mode: CalendarViewMode) =>
    guard(() => {
      closeQuickAdd();
      dispatch(setViewMode(mode));
    });
  /** 모바일은 달력을 좌우로 밀어 넘긴다 (D-025). PC·태블릿은 헤더 ‹ › */
  const swipe = useSwipe({ onPrev: () => move(-1), onNext: () => move(1) });

  /** 모바일 일간 탭 (D-049, US-25 연결 지점): 탭 내용은 dayTabSlots, 탭별 동작은 dayTabBehavior */
  const mobileDayTab = useAppSelector(selectMobileDayTab);
  const dayTabSlots = getDayTabSlots();
  // 설정에서 끈 탭을 고른 채였다면 시간표 (US-21)
  const isTabVisible = mobileDayTab === 'TIMETABLE' || sidebarItems.some((item) => item.type === mobileDayTab && item.visible);
  const activeDayTab =
    !isTabletUp && viewMode === 'DAY' && mobileDayTab !== 'TIMETABLE' && isTabVisible && dayTabSlots[mobileDayTab] ? mobileDayTab : 'TIMETABLE';
  const tabBehavior = dayTabBehavior(activeDayTab);
  const activeSlot = activeDayTab === 'TIMETABLE' ? undefined : dayTabSlots[activeDayTab];
  /** + 를 누를 때마다 1씩 → 탭 내용이 새로 만들기를 연다 (directAddLabel이 있는 탭) */
  const [tabAddRequest, setTabAddRequest] = useState(0);
  const tabContent = Object.fromEntries(
    Object.entries(dayTabSlots).map(([key, slot]) => [key, slot.render({ date: viewDate, addRequestKey: tabAddRequest, openSchedule })])
  );

  /** ≡ 메뉴: 기능 항목은 일간 탭과 같은 순서·켜짐 (US-28) */
  const menuTabs = useMemo(
    () => buildMobileMenuTabs(sidebarItems, new Set(Object.keys(dayTabSlots) as SidebarItemType[])),
    [sidebarItems, dayTabSlots]
  );
  /** ≡ 메뉴 > Todo·D-Day·일기·메모 → 오늘 날짜 일간의 그 탭 (D-049). 쓰던 일기가 있으면 먼저 확인 */
  const openTabFromMenu = (key: SidebarItemType) => {
    setMobileMenuOpen(false);
    guard(() => {
      setSheetDate(null);
      closeQuickAdd();
      dispatch(openDayView(toLocalDate(new Date())));
      dispatch(setMobileDayTab(key));
    });
  };
  /** ≡ 메뉴 > 카테고리 → 카테고리 관리 (모바일은 전체 화면, MO-21) */
  const openCategoriesFromMenu = () => {
    setMobileMenuOpen(false);
    setIsCategoryManagerOpen(true);
  };

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
    onOpenTodo: todoActions.openTodo,
    onOpenDday: openDdayById,
    onAddAt: quickAdd.addAt,
    draft: quickAdd.draft,
    onDraftChange: quickAdd.changeDraftRange,
    coverBottom: isTabletUp ? 0 : QUICK_ADD_SHEET_HEIGHT,
  };

  /** 화면에 그릴 보기: 3일·목록은 모바일 보기라서 태블릿·PC 폭에서는 주간 (US-29) */
  const shownViewMode = displayedViewMode(viewMode, isTabletUp);
  const mainContent =
    shownViewMode === 'MONTH' ? (
      <CalendarMonthly
        variant={isTabletUp ? 'bars' : 'dots'}
        onOpenSchedule={openSchedule}
        onOpenDday={openDdayById}
        onOpenDiary={diaryActions.openDiary}
        // PC·태블릿: 빈 칸 두 번 누름 → 빠른 추가 (D-110). 모바일은 날짜 시트 그대로
        onAddAt={isTabletUp ? quickAdd.addAt : undefined}
        quickAddDate={quickAdd.slot?.date ?? null}
        draft={quickAdd.draft}
        onTapDate={(date) => {
          if (!isFoldUp) setSheetDate(date);
        }}
      />
    ) : shownViewMode === 'WEEK' ? (
      <CalendarWeekly variant={isTabletUp ? 'pc' : 'mobile'} {...timetableProps} />
    ) : shownViewMode === 'THREE_DAY' ? (
      // 모바일 3일 보기: 보는 날이 맨 왼쪽인 3칸 시간표 (US-29, MO-20 · D-025)
      <CalendarWeekly variant="mobile" span="threeDays" {...timetableProps} />
    ) : shownViewMode === 'LIST' ? (
      // 모바일 목록 보기: 한 주를 요일별로 (US-29, MO-19 · D-022)
      <CalendarList onOpenSchedule={openSchedule} onOpenDday={openDdayById} />
    ) : (
      <CalendarDaily
        variant={isTabletUp ? 'pc' : 'mobile'}
        {...timetableProps}
        tabContent={tabContent}
        timetableNotice={<UnscheduledTodoNotice date={viewDate} variant={isTabletUp ? 'pc' : 'mobile'} onPick={todoActions.scheduleTodo} />}
      />
    );

  return (
    <CalendarSettingsContext.Provider value={calendarSettingsContext}>
    <TodoActionsContext.Provider value={todoActions}>
    <DdayActionsContext.Provider value={ddayActions}>
    <DiaryActionsContext.Provider value={diaryActions}>
    <div className="flex h-dvh flex-col overflow-hidden bg-tp-bg text-tp-text">
      {topBanner}
      <PcHeader
        className="hidden tablet:flex"
        title={formatViewTitle(shownViewMode, viewDate, weekStart)}
        viewMode={shownViewMode}
        onChangeViewMode={changeViewMode}
        onMove={move}
        onToday={backToToday}
        onSelectAdd={handleSelectAdd}
        categoryFilter={isTabletUp && <CategoryFilterDropdown {...categoryFilterProps} />}
        account={isTabletUp && <AccountMenuButton />}
      />
      <MobileHeader
        className="flex tablet:hidden"
        title={formatViewTitle(viewMode, viewDate, weekStart)}
        viewMode={viewMode}
        onChangeViewMode={changeViewMode}
        onToday={backToToday}
        onMoveDay={tabBehavior.dateNav === 'arrows' ? move : undefined}
        categoryFilter={!isTabletUp && tabBehavior.categoryFilter && <CategoryFilterSheet {...categoryFilterProps} />}
        onClickMenu={() => setMobileMenuOpen(true)}
        onClickSettings={() => setSettingsEntry('gear')}
      />
      {!isTabletUp && mobileMenuOpen && (
        <MobileMenu
          items={menuTabs}
          onOpenTab={openTabFromMenu}
          onOpenCategories={openCategoriesFromMenu}
          onOpenSettings={openSettingsFromMenu}
          onClose={closeMobileMenu}
        />
      )}
      {!isTabletUp && settingsEntry && (
        <SettingsAccountScreen entry={settingsEntry} onClose={closeSettings} focusCalendarSettings={returnToCalendarSettings} />
      )}
      {!isTabletUp && calendarSettings && (
        <CalendarSettingsPanel
          variant="screen"
          onBack={backFromCalendarSettings}
          onClose={backFromCalendarSettings}
          onOpenCategories={() => setIsCategoryManagerOpen(true)}
        />
      )}

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

        {isTabletUp && calendarSettings ? (
          // 달력 설정 패널이 사이드바 자리를 대신한다 (사이드바가 닫혀 있어도 같은 자리, D-024)
          isPc ? (
            <CalendarSettingsPanel variant="panel" onBack={backFromCalendarSettings} onClose={closeCalendarSettings} onOpenCategories={() => setIsCategoryManagerOpen(true)} />
          ) : (
            <div className="hidden tablet:flex">
              <div className="w-14 shrink-0 border-l border-tp-line bg-tp-bg" aria-hidden="true" />
              {/* 바깥(달력 쪽)을 누르면 닫는 투명한 막 (D-039) */}
              <div data-testid="calendar-settings-backdrop" aria-hidden="true" className="absolute inset-0 z-20" onClick={closeCalendarSettings} />
              <div className="absolute inset-y-0 right-0 z-30 flex shadow-2xl">
                <CalendarSettingsPanel variant="panel" onBack={backFromCalendarSettings} onClose={closeCalendarSettings} onOpenCategories={() => setIsCategoryManagerOpen(true)} />
              </div>
            </div>
          )
        ) : (
          <SidebarArea
            className="hidden tablet:flex"
            selectedDate={selectedDate}
            isOpen={isSidebarOpen}
            isOverlay={!isPc}
            onOpen={openSidebar}
            onClose={closeSidebar}
            focusRequest={sectionFocus}
          />
        )}
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
          sections={<SidebarSections showMiniCalendar={false} />}
          editor={<SidebarItemsEditor items={sidebarItems} onChange={(next) => void dispatch(saveSettings({ sidebarItems: next }))} />}
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
          onSaved={(todo) => {
            hiddenSave.notify(todo);
            closeTodoForm();
          }}
          onDeleted={closeTodoForm}
        />
      )}

      {diaryDate && <DiaryDialog date={diaryDate} onClose={() => setDiaryDate(null)} onSaved={() => setDiaryDate(null)} onDeleted={() => setDiaryDate(null)} />}

      {ddayFormTarget && (
        <DdayFormDialog target={ddayFormTarget} onClose={() => setDdayFormTarget(null)} onSaved={closeDdayForm} onDeleted={closeDdayForm} />
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
    </DiaryActionsContext.Provider>
    </DdayActionsContext.Provider>
    </TodoActionsContext.Provider>
    </CalendarSettingsContext.Provider>
  );
}
