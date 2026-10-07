import { describe, expect, it } from 'vitest';

import { schedule, todo } from '@/test/fixtures';

import {
  DEFAULT_TIMETABLE_HOURS,
  blockDetailText,
  draftBlockLabel,
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
  ALL_DAY_MAX_LANES,
  QUICK_ADD_SNAP_MINUTES,
  layoutAllDayRow,
  dragCreateRange,
  draftRange,
  moveDraftRange,
  rangeToTimes,
  resizeDraftRange,
  slotStartTime,
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

describe('여러 날 종일 일정 (종일 줄, 서버가 end를 끝나는 날 23:59:59로 맞춤)', () => {
  const trip = schedule({ id: 40, title: '출장', allDay: true, start: '2026-09-22T00:00:00', end: '2026-09-24T23:59:59' });
  const vacation = schedule({ id: 41, title: '휴가', allDay: true, start: '2026-09-18T00:00:00', end: '2026-10-02T23:59:59' });
  const days = buildWeekDays('2026-09-24', 'SUN', '2026-09-25').map((d) => d.date);

  it('3일 종일(9/22~24)은 걸친 날마다 한 번씩, 앞뒤 날엔 없음', () => {
    expect(days.map((date) => allDaySchedulesOn([trip], date).length)).toEqual([0, 0, 1, 1, 1, 0, 0]);
  });

  it('주를 통째로 덮는 긴 종일(9/18~10/2)은 이번 주 7일 모두', () => {
    expect(days.map((date) => allDaySchedulesOn([vacation], date).length)).toEqual([1, 1, 1, 1, 1, 1, 1]);
  });

  it('지난주부터 이어지는 종일(9/18~9/21)은 이번 주 일·월만', () => {
    const cont = schedule({ id: 42, allDay: true, start: '2026-09-18T00:00:00', end: '2026-09-21T23:59:59' });
    expect(days.map((date) => allDaySchedulesOn([cont], date).length)).toEqual([1, 1, 0, 0, 0, 0, 0]);
  });

  it('같은 날 여러 개면 먼저 시작한 것부터, 같으면 제목 순', () => {
    const b = schedule({ id: 43, title: '가 행사', allDay: true, start: '2026-09-22T00:00:00', end: '2026-09-22T23:59:59' });
    expect(allDaySchedulesOn([trip, b, vacation], '2026-09-22').map((s) => s.title)).toEqual(['휴가', '가 행사', '출장']);
  });

  it('여러 날 종일은 어느 날에도 시간표 블록이 되지 않는다', () => {
    expect(days.flatMap((date) => layoutDayBlocks([trip, vacation], date, HOURS))).toEqual([]);
  });

  it('처음 보이는 위치 계산에서도 빠진다 (D-046: 종일 제외)', () => {
    const otherWeek = buildWeekDays('2026-09-24', 'SUN', '2026-10-15');
    expect(initialScrollTarget(otherWeek, [trip, vacation], new Date(2026, 9, 15, 9, 0))).toEqual({ minutes: 540, align: 'center' });
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
    const byTitle = Object.fromEntries(blocks.map((x) => [x.schedule?.title, x]));
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

describe('블록 설명 줄 (PC-03)', () => {
  it('하루 안 일정: 일정 · 10:00-11:00 · 장소', () => {
    const s = schedule({ id: 50, start: '2026-09-30T10:00:00', end: '2026-09-30T11:00:00', location: { name: '회의실 A', latitude: null, longitude: null } });
    expect(blockDetailText(s)).toBe('일정 · 10:00-11:00 · 회의실 A');
  });

  it('장소가 없으면 시각까지만', () => {
    expect(blockDetailText(schedule({ id: 50, start: '2026-09-30T10:00:00', end: '2026-09-30T11:00:00', location: null }))).toBe('일정 · 10:00-11:00');
  });

  it('여러 날 일정은 날짜를 붙여 거꾸로 읽히지 않게 (US-08 검수)', () => {
    const s = schedule({ id: 50, start: '2026-09-30T14:00:00', end: '2026-10-02T11:00:00', location: null });
    expect(blockDetailText(s)).toBe('일정 · 9/30 14:00 – 10/2 11:00');
  });

  it('자정을 넘는 일정도 날짜를 붙인다', () => {
    const s = schedule({ id: 50, start: '2026-09-29T23:00:00', end: '2026-09-30T01:00:00', location: null });
    expect(blockDetailText(s)).toBe('일정 · 9/29 23:00 – 9/30 01:00');
  });
});

describe('빈 시간 누르기 → 시작 시각 (US-10, D-053 30분 단위)', () => {
  it('칸 위쪽 절반 → 정각, 아래쪽 절반 → 30분: 14:20 자리 → 14:00, 14:40 자리 → 14:30', () => {
    expect(slotStartTime((14 + 20 / 60) * 48, 48)).toBe('14:00');
    expect(slotStartTime((14 + 40 / 60) * 48, 48)).toBe('14:30');
    expect(slotStartTime(0, 48)).toBe('00:00');
  });
  it('맨 아래를 눌러도 23:30 (그러면 23:30~다음 날 00:30)', () => {
    expect(slotStartTime(24 * 48 + 5, 48)).toBe('23:30');
  });
  it('설정의 칸 간격과 관계없이 항상 30분 단위 (D-053)', () => {
    expect(QUICK_ADD_SNAP_MINUTES).toBe(30);
  });
});

describe('임시 블록 조절 — 손잡이·몸통 끌기, 끌어서 만들기 (D-053)', () => {
  const range = { start: 14 * 60, end: 15 * 60 }; // 14:00~15:00

  it('임시 블록 시각 ↔ 분: 종료가 시작보다 이르면 다음 날', () => {
    expect(draftRange({ startTime: '14:00', endTime: '15:30' })).toEqual({ start: 840, end: 930 });
    expect(draftRange({ startTime: '23:30', endTime: '00:30' })).toEqual({ start: 1410, end: 1470 });
    expect(rangeToTimes('2026-09-25', { start: 1410, end: 1470 })).toEqual({
      startDate: '2026-09-25',
      startTime: '23:30',
      endDate: '2026-09-26',
      endTime: '00:30',
    });
    expect(rangeToTimes('2026-09-30', { start: 600, end: 1440 })).toMatchObject({ endDate: '2026-10-01', endTime: '00:00' });
  });

  it('아래 손잡이: 끝이 가까운 30분으로 (15:20 → 15:30), 시작보다 30분 이상 뒤', () => {
    expect(resizeDraftRange(range, 'end', 15 * 60 + 20)).toEqual({ start: 840, end: 930 });
    expect(resizeDraftRange(range, 'end', 13 * 60)).toEqual({ start: 840, end: 870 });
    expect(resizeDraftRange(range, 'end', 25 * 60)).toEqual({ start: 840, end: 1440 });
  });

  it('위 손잡이: 시작이 가까운 30분으로, 끝보다 30분 이상 앞, 0시 밑으로는 안 감', () => {
    expect(resizeDraftRange(range, 'start', 13 * 60 + 10)).toEqual({ start: 780, end: 900 });
    expect(resizeDraftRange(range, 'start', 16 * 60)).toEqual({ start: 870, end: 900 });
    expect(resizeDraftRange(range, 'start', -30)).toEqual({ start: 0, end: 900 });
  });

  it('몸통 끌기: 길이 그대로 30분 단위로 옮긴다, 하루 밖으로는 안 나감', () => {
    expect(moveDraftRange(range, 50)).toEqual({ start: 900, end: 960 }); // 50분 → 60분
    expect(moveDraftRange(range, 10)).toEqual(range); // 15분 미만은 그대로
    expect(moveDraftRange(range, -20 * 60)).toEqual({ start: 0, end: 60 });
    expect(moveDraftRange(range, 20 * 60)).toEqual({ start: 1380, end: 1440 });
  });

  it('PC 끌어서 만들기: 누른 칸 30분 내림 ~ 놓은 곳 30분 올림, 위로 끌어도 같다', () => {
    expect(dragCreateRange(9 * 60 + 10, 10 * 60 + 40)).toEqual({ start: 540, end: 660 });
    expect(dragCreateRange(10 * 60 + 40, 9 * 60 + 10)).toEqual({ start: 540, end: 660 });
    expect(dragCreateRange(9 * 60 + 10, 9 * 60 + 15)).toEqual({ start: 540, end: 570 }); // 최소 30분
    expect(dragCreateRange(23 * 60, 26 * 60)).toEqual({ start: 1380, end: 1440 });
  });
});

describe('임시 블록 글자 (D-017)', () => {
  it('(제목 없음) · 14:00-15:00, 제목을 쓰면 제목으로', () => {
    expect(draftBlockLabel('', '14:00', '15:00')).toBe('(제목 없음) · 14:00-15:00');
    expect(draftBlockLabel('  팀 회의 ', '14:00', '15:00')).toBe('팀 회의 · 14:00-15:00');
  });
});

describe('종일 줄 배치 — 이어진 막대·3줄·+n (D-052)', () => {
  const WEEK = ['2026-09-20', '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26'];
  const allDay = (id: number, from: string, to: string, title = `종일${id}`) =>
    schedule({ id, title, allDay: true, start: `${from}T00:00:00`, end: `${to}T23:59:59` });
  const brief = (bars: ReturnType<typeof layoutAllDayRow>['bars']) =>
    bars.map(({ schedule: s, lane, startCol, span, continuesBefore, continuesAfter }) => ({ id: s.id, lane, startCol, span, continuesBefore, continuesAfter }));

  it('여러 날 종일 일정은 이어진 막대 하나 (22~24일 → 3칸)', () => {
    const { bars } = layoutAllDayRow([allDay(1, '2026-09-22', '2026-09-24')], WEEK);
    expect(brief(bars)).toEqual([{ id: 1, lane: 0, startCol: 2, span: 3, continuesBefore: false, continuesAfter: false }]);
  });

  it('주를 넘으면: 지난주부터는 일요일부터, 다음 주로 이어지면 토요일까지 (이어짐 표시)', () => {
    const { bars } = layoutAllDayRow([allDay(1, '2026-09-18', '2026-09-21'), allDay(2, '2026-09-25', '2026-09-28')], WEEK);
    expect(brief(bars)).toEqual([
      { id: 1, lane: 0, startCol: 0, span: 2, continuesBefore: true, continuesAfter: false },
      { id: 2, lane: 0, startCol: 5, span: 2, continuesBefore: false, continuesAfter: true },
    ]);
  });

  it('겹치면 아래 줄로, 안 겹치면 같은 줄을 나눠 쓴다. 먼저 시작·긴 것이 위', () => {
    const { bars, laneCount } = layoutAllDayRow(
      [allDay(1, '2026-09-23', '2026-09-23'), allDay(2, '2026-09-22', '2026-09-24'), allDay(3, '2026-09-25', '2026-09-25')],
      WEEK
    );
    expect(brief(bars).map(({ id, lane }) => ({ id, lane }))).toEqual([
      { id: 2, lane: 0 },
      { id: 1, lane: 1 },
      { id: 3, lane: 0 },
    ]);
    expect(laneCount).toBe(2);
  });

  it(`${3}줄까지만 막대, 넘는 것은 날마다 '+n' 개수`, () => {
    expect(ALL_DAY_MAX_LANES).toBe(3);
    const many = [1, 2, 3, 4, 5].map((id) => allDay(id, '2026-09-23', '2026-09-23'));
    const { bars, hidden, laneCount } = layoutAllDayRow([...many, allDay(6, '2026-09-22', '2026-09-24')], WEEK);
    expect(bars).toHaveLength(3);
    expect(laneCount).toBe(3);
    expect(hidden).toEqual([0, 0, 0, 3, 0, 0, 0]); // 23일: 6개 중 3개 숨김
  });

  it('시간 있는 일정·보이는 기간 밖 일정은 넣지 않는다, 일간은 하루짜리 칸', () => {
    const timed = schedule({ id: 9, start: '2026-09-23T10:00:00', end: '2026-09-23T11:00:00' });
    expect(layoutAllDayRow([timed, allDay(8, '2026-09-28', '2026-09-29')], WEEK).bars).toEqual([]);
    const { bars } = layoutAllDayRow([allDay(1, '2026-09-22', '2026-09-26')], ['2026-09-25']);
    expect(brief(bars)).toEqual([{ id: 1, lane: 0, startCol: 0, span: 1, continuesBefore: true, continuesAfter: true }]);
  });
});

describe('시간표의 Todo 블록 배치 (US-15, D-007 · D-027)', () => {
  const at = (start: string, durationMinutes: number) => ({ start, durationMinutes });

  it('시간 지정 하루 Todo는 그날 그 시각에 블록 (위치·높이는 일정과 같은 규칙)', () => {
    const t = todo({ id: 1, startDate: '2026-09-25', endDate: '2026-09-25', time: at('11:00', 90) });
    expect(layoutDayBlocks([], '2026-09-25', HOURS, [t])).toEqual([
      expect.objectContaining({ todo: t, top: 660, height: 90, column: 0, columns: 1 }),
    ]);
    expect(layoutDayBlocks([], '2026-09-24', HOURS, [t])).toEqual([]);
  });

  it('시간이 없는 Todo는 시간표에 두지 않는다 (목록에만, D-007)', () => {
    expect(layoutDayBlocks([], '2026-09-25', HOURS, [todo({ id: 1, time: null })])).toEqual([]);
  });

  it('기간·주간·월간 Todo는 범위 안의 매일 같은 시간에 (D-027)', () => {
    const period = todo({ id: 2, type: 'PERIOD', startDate: '2026-09-21', endDate: '2026-09-23', time: at('07:00', 30) });
    const week = todo({ id: 3, type: 'WEEK', startDate: '2026-09-20', endDate: '2026-09-26', time: at('21:00', 60) });
    ['2026-09-21', '2026-09-22', '2026-09-23'].forEach((date) =>
      expect(layoutDayBlocks([], date, HOURS, [period])[0]).toMatchObject({ todo: period, top: 420, height: 30 })
    );
    expect(layoutDayBlocks([], '2026-09-24', HOURS, [period])).toEqual([]);
    expect(layoutDayBlocks([], '2026-09-20', HOURS, [week])[0]).toMatchObject({ todo: week, top: 1260 });
    expect(layoutDayBlocks([], '2026-09-26', HOURS, [week])[0]).toMatchObject({ todo: week, top: 1260 });
  });

  it('자정을 넘는 Todo(23:00부터 2시간)는 다음 날 00:00~01:00에도 이어서 그린다', () => {
    const t = todo({ id: 4, startDate: '2026-09-25', endDate: '2026-09-25', time: at('23:00', 120) });
    expect(layoutDayBlocks([], '2026-09-25', HOURS, [t])[0]).toMatchObject({ top: 1380, height: 60, continuesAfter: true });
    expect(layoutDayBlocks([], '2026-09-26', HOURS, [t])[0]).toMatchObject({ top: 0, height: 60, continuesBefore: true });
  });

  it('일정과 겹치면 같이 칸을 나눈다 (먼저 시작한 것이 왼쪽)', () => {
    const s = schedule({ id: 1, title: '회의', start: '2026-09-25T10:00:00', end: '2026-09-25T12:00:00' });
    const t = todo({ id: 5, title: '기획서', time: at('11:00', 60) });
    const blocks = layoutDayBlocks([s], '2026-09-25', HOURS, [t]);
    expect(blocks.find((b) => b.schedule)).toMatchObject({ column: 0, columns: 2 });
    expect(blocks.find((b) => b.todo)).toMatchObject({ column: 1, columns: 2 });
  });
});
