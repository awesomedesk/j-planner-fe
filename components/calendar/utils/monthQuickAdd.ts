import { nextTopOfHour } from '@utils/date/dateUtils';

import { clockToMinutes } from './timetableUtils';

/** 23시대 예외의 길이 (분): 고른 날 23:00~23:59 (D-110 · #367 대표님 최종 선택) */
const LATE_NIGHT_DURATION = 59;
const DEFAULT_DURATION = 60;

/**
 * 월간 빈 칸 더블클릭 빠른 추가의 기본 시간 (D-110, #367 3번)
 * - 23시 전: 지금 다음 정각부터 1시간 (D-037과 같은 규칙, 22:59면 23:00~다음 날 00:00)
 * - 23시대(23:00~23:59): 고른 날 23:00~23:59로 고정. 시작·종료 날짜 모두 고른 날
 * - 연 순간의 시각으로 한 번만 정한다 (열린 뒤 자정이 지나도 바꾸지 않음)
 */
export const monthQuickAddTimes = (now: Date): { startTime: string; durationMinutes: number } => {
  if (now.getHours() === 23) return { startTime: '23:00', durationMinutes: LATE_NIGHT_DURATION };
  return { startTime: `${String(nextTopOfHour(now)).padStart(2, '0')}:00`, durationMinutes: DEFAULT_DURATION };
};

/**
 * 월간 칸의 점선 임시 표식 문구 (#367 4번) — `제목 · 시작-종료`, 제목이 없으면 `(제목 없음)`.
 * 빠른 추가는 하루를 넘기지 않으므로 종료가 시작보다 이르거나 같으면 다음 날이다 → '다음 날'을 붙인다 (#367 3번)
 */
export const monthDraftLabel = (title: string, startTime: string, endTime: string): string => {
  const nextDay = endTime && startTime && clockToMinutes(endTime) <= clockToMinutes(startTime);
  return `${title.trim() || '(제목 없음)'} · ${startTime}-${nextDay ? '다음 날 ' : ''}${endTime}`;
};
