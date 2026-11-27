import type { CalendarViewMode } from '@/types/calendar';
import type { Settings } from '@/types/api';

/**
 * '마지막에 본 화면' (US-27, D-029·030 · 08 §9): 서버에 없고 이 브라우저(localStorage)에만 기억한다.
 * 화면 코드에서 localStorage를 쓰는 곳은 이 파일 하나뿐이다 (test/security/staticBans.test.ts 예외, #417).
 * 막힌 브라우저(사생활 보호 등)에서는 읽기·쓰기를 조용히 건너뛴다.
 */
export const LAST_VIEW_KEY = 'jp.lastView';

const VIEW_MODES: readonly CalendarViewMode[] = ['MONTH', 'WEEK', 'THREE_DAY', 'DAY', 'LIST'];

export const saveLastView = (mode: CalendarViewMode) => {
  try {
    window.localStorage.setItem(LAST_VIEW_KEY, mode);
  } catch {
    // 저장소를 못 쓰면 기억하지 않는다
  }
};

export const loadLastView = (): CalendarViewMode | null => {
  try {
    const value = window.localStorage.getItem(LAST_VIEW_KEY);
    return VIEW_MODES.includes(value as CalendarViewMode) ? (value as CalendarViewMode) : null;
  } catch {
    return null;
  }
};

/** 설정의 처음 화면 → 시작할 보기. LAST는 기억한 보기(3일·목록도, D-030), 없으면 월간 */
export const resolveStartView = (startView: Settings['startView'], lastView: CalendarViewMode | null): CalendarViewMode =>
  startView === 'LAST' ? (lastView ?? 'MONTH') : startView;
