import { describe, expect, it } from 'vitest';

import { schedule } from '@/test/fixtures';

import {
  DEFAULT_TIMETABLE_HOURS,
  initialScrollTarget,
  MIN_BLOCK_MINUTES,
  allDaySchedulesOn,
  buildWeekDays,
  formatWeekTitle,
  getHourLabels,
  getWeekRange,
  layoutDayBlocks,
  lineClampFor,
  nowLineMinutes,
} from './timetableUtils';

const HOURS = DEFAULT_TIMETABLE_HOURS; // 항상 00:00 ~ 24:00 (D-046)

describe('주간 범위 (CAL-02, 주 시작 요일 D-024)', () => {
  it('일요일 시작: 2026-09-24(목) → 9/20(일) ~ 9/26(토)', () => {
    expect(getWeekRange('2026-09-24', 'SUN')).toEqual({ from: '2026-09-20', to: '2026-09-26' });
  });

  it('월요일 시작: 2026-09-20(일) → 9/14(월) ~ 9/20(일)', () => {
    expect(getWeekRange('2026-09-20', 'MON')).toEqual({ from: '2026-09-14', to: '2026-09-20' });
  });

  it('7일 칸: 요일·날짜·오늘 표시', () => {
    const days = buildWeekDays('2026-09-24', 'SUN', '2026-09-25');
    expect(days.map((d) => d.dayOfMonth)).toEqual([20, 21, 22, 23, 24, 25, 26]);
    expect(days.map((d) => d.weekday)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(days.filter((d) => d.isToday).map((d) => d.date)).toEqual(['2026-09-25']);
  });
});

describe('주간 제목 (PC-02·MO-05 헤더)', () => {
  it('같은 달: 9월 20일 – 26일', () => {
    expect(formatWeekTitle({ from: '2026-09-20', to: '2026-09-26' })).toBe('9월 20일 – 26일');
  });
  it('달이 바뀌면: 9월 27일 – 10월 3일', () => {
    expect(formatWeekTitle({ from: '2026-09-27', to: '2026-10-03' })).toBe('9월 27일 – 10월 3일');
  });
  it('해가 바뀌면: 2026년 12월 27일 – 2027년 1월 2일', () => {
    expect(formatWeekTitle({ from: '2026-12-27', to: '2027-01-02' })).toBe('2026년 12월 27일 – 2027년 1월 2일');
  });
});

describe('시간 눈금 (D-046: 항상 00~24시, 1시간 간격)', () => {
  it('00:00 ~ 23:00 눈금 24개', () => {
    const labels = getHourLabels(HOURS);
    expect(labels).toHaveLength(24);
    expect(labels[0]).toBe('00:00');
    expect(labels[23]).toBe('23:00');
  });
});

describe('종일 줄 (PC-02 ⑤)', () => {
  it('종일 일정만, 여러 날이면 걸친 날마다', () => {
    const trip = schedule({ id: 5, title: '가족 여행', allDay: true, start: '2026-09-26T00:00:00', end: '2026-09-27T23:59:59' });
    const meeting = schedule({ id: 1, title: '회의', start: '2026-09-26T10:00:00', end: '2026-09-26T11:00:00' });
    expect(allDaySchedulesOn([trip, meeting], '2026-09-26')).toEqual([trip]);
    expect(allDaySchedulesOn([trip, meeting], '2026-09-27')).toEqual([trip]);
    expect(allDaySchedulesOn([trip, meeting], '2026-09-28')).toEqual([]);
  });
});

describe('시간표 블록 배치 (PC-02 ⑥)', () => {
  it('위치·높이는 00:00부터의 분', () => {
    const s = schedule({ id: 1, start: '2026-09-21T10:00:00', end: '2026-09-21T11:30:00' });
    expect(layoutDayBlocks([s], '2026-09-21', HOURS)).toEqual([
      expect.objectContaining({ schedule: s, top: 600, height: 90, column: 0, columns: 1 }),
    ]);
  });

  it('종일 일정은 시간표에 두지 않는다', () => {
    const s = schedule({ id: 1, allDay: true, start: '2026-09-21T00:00:00', end: '2026-09-21T23:59:59' });
    expect(layoutDayBlocks([s], '2026-09-21', HOURS)).toEqual([]);
  });

  it('자정을 넘는 일정은 날마다 나눠 그린다 (23:00~01:00)', () => {
    const s = schedule({ id: 7, start: '2026-09-29T23:00:00', end: '2026-09-30T01:00:00' });
    expect(layoutDayBlocks([s], '2026-09-29', HOURS)[0]).toMatchObject({ top: 1380, height: 60, continuesAfter: true });
    expect(layoutDayBlocks([s], '2026-09-30', HOURS)[0]).toMatchObject({ top: 0, height: 60, continuesBefore: true });
  });

  it('시각이 있는 여러 날 일정: 월 10~24시, 화 하루 전체, 수 00~18시 (D-045)', () => {
    const s = schedule({ id: 9, start: '2026-09-21T10:00:00', end: '2026-09-23T18:00:00' });
    expect(layoutDayBlocks([s], '2026-09-21', HOURS)[0]).toMatchObject({ top: 600, height: 840 });
    expect(layoutDayBlocks([s], '2026-09-22', HOURS)[0]).toMatchObject({ top: 0, height: 1440 });
    expect(layoutDayBlocks([s], '2026-09-23', HOURS)[0]).toMatchObject({ top: 0, height: 1080 });
  });

  it('아주 짧은 일정도 최소 높이 (10분 → 20분 높이)', () => {
    const s = schedule({ id: 1, start: '2026-09-21T09:00:00', end: '2026-09-21T09:10:00' });
    expect(layoutDayBlocks([s], '2026-09-21', HOURS)[0]).toMatchObject({ top: 540, height: MIN_BLOCK_MINUTES });
  });

  it('23:55에 시작하는 짧은 일정도 칸 안에 (끝에 맞춤)', () => {
    const s = schedule({ id: 1, start: '2026-09-21T23:55:00', end: '2026-09-21T23:59:00' });
    expect(layoutDayBlocks([s], '2026-09-21', HOURS)[0]).toMatchObject({ top: 1440 - MIN_BLOCK_MINUTES, height: MIN_BLOCK_MINUTES });
  });

  it('겹치는 일정은 칸을 나눠 나란히, 안 겹치면 한 칸 전체', () => {
    const a = schedule({ id: 1, title: 'A', start: '2026-09-25T19:00:00', end: '2026-09-25T20:00:00' });
    const b = schedule({ id: 2, title: 'B', start: '2026-09-25T19:30:00', end: '2026-09-25T21:00:00' });
    const c = schedule({ id: 3, title: 'C', start: '2026-09-25T20:30:00', end: '2026-09-25T22:00:00' });
    const d = schedule({ id: 4, title: 'D', start: '2026-09-25T07:00:00', end: '2026-09-25T08:00:00' });
    const blocks = layoutDayBlocks([c, b, a, d], '2026-09-25', HOURS);
    const byTitle = Object.fromEntries(blocks.map((x) => [x.schedule.title, x]));
    expect(byTitle.D).toMatchObject({ column: 0, columns: 1 });
    expect(byTitle.A).toMatchObject({ column: 0, columns: 2 });
    expect(byTitle.B).toMatchObject({ column: 1, columns: 2 });
    expect(byTitle.C).toMatchObject({ column: 0, columns: 2 }); // A가 끝난 자리를 다시 쓴다
  });

  it('끝이 다른 일정의 시작과 같으면 겹치지 않는다 (10~11, 11~12)', () => {
    const a = schedule({ id: 1, start: '2026-09-21T10:00:00', end: '2026-09-21T11:00:00' });
    const b = schedule({ id: 2, start: '2026-09-21T11:00:00', end: '2026-09-21T12:00:00' });
    expect(layoutDayBlocks([a, b], '2026-09-21', HOURS).map((x) => x.columns)).toEqual([1, 1]);
  });
});

describe('현재 시각 선 (CAL-06)', () => {
  it('00:00부터의 분 (새벽에도 보인다, D-046)', () => {
    expect(nowLineMinutes(new Date(2026, 8, 25, 14, 30), HOURS)).toBe(870);
    expect(nowLineMinutes(new Date(2026, 8, 25, 3, 0), HOURS)).toBe(180);
  });
});

describe('처음 보이는 위치 (D-046)', () => {
  const week = buildWeekDays('2026-10-06', 'SUN', '2026-09-25'); // 10/4~10/10, 오늘 없음
  const now = new Date(2026, 8, 25, 14, 30);

  it('1. 보이는 날짜에 오늘이 있으면 현재 시각이 가운데', () => {
    const thisWeek = buildWeekDays('2026-09-25', 'SUN', '2026-09-25');
    expect(initialScrollTarget(thisWeek, [], now)).toEqual({ minutes: 870, align: 'center' });
  });

  it('2. 오늘이 없으면 가장 이른 시각 일정이 위쪽에 1시간 여유 (화 09시·목 19시 → 08시)', () => {
    const tue = schedule({ id: 1, start: '2026-10-06T09:00:00', end: '2026-10-06T10:00:00' });
    const thu = schedule({ id: 2, start: '2026-10-08T19:00:00', end: '2026-10-08T20:00:00' });
    expect(initialScrollTarget(week, [thu, tue], now)).toEqual({ minutes: 480, align: 'top' });
  });

  it('종일 일정과 다른 주 일정은 세지 않는다', () => {
    const allDay = schedule({ id: 1, allDay: true, start: '2026-10-06T00:00:00', end: '2026-10-06T23:59:59' });
    const otherWeek = schedule({ id: 2, start: '2026-10-12T07:00:00', end: '2026-10-12T08:00:00' });
    expect(initialScrollTarget(week, [allDay, otherWeek], now)).toEqual({ minutes: 870, align: 'center' });
  });

  it('00:30 일정이면 맨 위(0)까지만', () => {
    const early = schedule({ id: 1, start: '2026-10-07T00:30:00', end: '2026-10-07T01:00:00' });
    expect(initialScrollTarget(week, [early], now)).toEqual({ minutes: 0, align: 'top' });
  });

  it('3. 일정도 없으면 현재 시각이 가운데', () => {
    expect(initialScrollTarget(week, [], now)).toEqual({ minutes: 870, align: 'center' });
  });
});

describe('긴 제목 (D-023)', () => {
  it('블록 높이에 들어가는 줄 수만큼 줄바꿈하고 나머지는 …', () => {
    // 줄 높이 = 글자 크기 × 1.25, 위아래 여백 4px
    expect(lineClampFor(88, 11)).toBe(6);
    expect(lineClampFor(42, 11)).toBe(2);
    expect(lineClampFor(10, 11)).toBe(1);
  });
});
