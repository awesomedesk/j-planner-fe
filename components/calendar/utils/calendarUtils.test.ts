import { describe, expect, it } from 'vitest';

import { CATEGORIES, schedule } from '@/test/fixtures';

import {
  DARK_TEXT,
  LIGHT_TEXT,
  barTimeLabel,
  buildMonthGrid,
  getGridRange,
  getWeekdayLabels,
  listTimeLabel,
  occursOn,
  readableTextColor,
  schedulesOn,
  blockBackground,
  stripeColorOf,
  weekdayTextClass,
} from './calendarUtils';

describe('월간 칸 만들기 (US-06)', () => {
  it('2026년 9월, 일요일 시작: 8/30 ~ 10/3 다섯 줄', () => {
    const weeks = buildMonthGrid('2026-09-24', 'SUN', '2026-09-24');
    expect(weeks).toHaveLength(5);
    expect(getGridRange(weeks)).toEqual({ from: '2026-08-30', to: '2026-10-03' });
  });

  it('주 시작이 월요일이면 첫 칸이 월요일 (CAL-04)', () => {
    const weeks = buildMonthGrid('2026-09-24', 'MON', '2026-09-24');
    expect(weeks[0].days[0]).toMatchObject({ date: '2026-08-31', weekday: 1 });
    expect(getWeekdayLabels('MON').map((w) => w.label).join('')).toBe('월화수목금토일');
  });

  it('달에 따라 4~6줄', () => {
    expect(buildMonthGrid('2026-02-10', 'SUN', 'x')).toHaveLength(4);
    expect(buildMonthGrid('2026-08-10', 'SUN', 'x')).toHaveLength(6);
  });

  it('앞뒤 달 날짜는 inMonth=false, 오늘은 isToday (CAL-06)', () => {
    const weeks = buildMonthGrid('2026-09-24', 'SUN', '2026-09-24');
    expect(weeks[0].days[0].inMonth).toBe(false);
    expect(weeks[3].days.find((d) => d.date === '2026-09-24')?.isToday).toBe(true);
  });
});

describe('주차 = ISO 8601, 그 줄 월요일 기준 (CAL-05, D-041)', () => {
  const weekNumbers = (anchor: string, start: 'SUN' | 'MON') => buildMonthGrid(anchor, start, 'x').map((w) => w.weekNumber);

  it('2026년 9월: 36~40 (일·월 시작 같음)', () => {
    expect(weekNumbers('2026-09-24', 'SUN')).toEqual([36, 37, 38, 39, 40]);
    expect(weekNumbers('2026-09-24', 'MON')).toEqual([36, 37, 38, 39, 40]);
  });

  it('해가 바뀌는 줄: 2026-12-27(일) 줄은 월요일 12/28의 ISO 주차 53', () => {
    expect(weekNumbers('2027-01-10', 'SUN')).toEqual([53, 1, 2, 3, 4, 5]);
  });
});

describe('일정이 보이는 날 (US-06, D-041)', () => {
  const deploy = schedule({ id: 7, title: '새벽 배포', start: '2026-09-29T23:00:00', end: '2026-09-30T01:00:00' });

  it('자정을 넘는 일정은 두 날 모두, 시각은 시작한 날에만', () => {
    expect(occursOn(deploy, '2026-09-29')).toBe(true);
    expect(occursOn(deploy, '2026-09-30')).toBe(true);
    expect(barTimeLabel(deploy, '2026-09-29')).toBe('23:00');
    expect(barTimeLabel(deploy, '2026-09-30')).toBeNull();
    expect(listTimeLabel(deploy, '2026-09-30')).toBe('계속');
  });

  it('다음 날 00:00 정각에 끝나면 다음 날에는 안 보임', () => {
    const late = schedule({ id: 8, start: '2026-09-29T22:00:00', end: '2026-09-30T00:00:00' });
    expect(occursOn(late, '2026-09-30')).toBe(false);
  });

  it('종일 여러 날 일정은 날마다, 시각 없이 "종일"', () => {
    const trip = schedule({ id: 5, allDay: true, start: '2026-09-26T00:00:00', end: '2026-09-27T23:59:59' });
    expect(occursOn(trip, '2026-09-27')).toBe(true);
    expect(barTimeLabel(trip, '2026-09-26')).toBeNull();
    expect(listTimeLabel(trip, '2026-09-26')).toBe('종일');
  });

  it('같은 날 순서: 종일·여러 날 → 시작 시각 → 제목', () => {
    const items = [
      schedule({ id: 1, title: 'b', start: '2026-09-26T10:00:00', end: '2026-09-26T11:00:00' }),
      schedule({ id: 2, title: 'a', start: '2026-09-26T10:00:00', end: '2026-09-26T11:00:00' }),
      schedule({ id: 3, allDay: true, start: '2026-09-26T00:00:00', end: '2026-09-27T23:59:59' }),
      schedule({ id: 4, start: '2026-09-26T09:00:00', end: '2026-09-26T09:30:00' }),
    ];
    expect(schedulesOn(items, '2026-09-26').map((s) => s.id)).toEqual([3, 4, 2, 1]);
  });
});

describe('막대 글자색 자동 (D-019)', () => {
  it('색이 없으면(Theme2) 어두운 글자', () => expect(readableTextColor(null)).toBe(DARK_TEXT));
  it('어두운 몸통은 흰 글자', () => {
    expect(readableTextColor('#5B5F97')).toBe(LIGHT_TEXT);
    expect(readableTextColor('#A6323F')).toBe(LIGHT_TEXT);
  });
  it('밝은 몸통은 어두운 글자', () => expect(readableTextColor('#CCD5AE')).toBe(DARK_TEXT));
});

describe('블록 색 (D-019, D-030, D-037)', () => {
  const [unassigned, study, , exercise] = CATEGORIES;

  it('띠 색: 카테고리 색, 미지정·못 찾은 카테고리는 테마 Theme2, 색 없는 카테고리는 기본색', () => {
    expect(stripeColorOf(study)).toBe('#2F62A8');
    expect(stripeColorOf(unassigned)).toBe('var(--tp-theme2)');
    expect(stripeColorOf(undefined)).toBe('var(--tp-theme2)');
    expect(stripeColorOf(exercise)).toBe('#2F62A8');
  });

  it('배경: 왼쪽 5px 띠 + 몸통(일정 색, 없으면 Theme2)', () => {
    expect(blockBackground(study, '#3F3F3F')).toBe('linear-gradient(to right, #2F62A8 0 5px, #3F3F3F 5px)');
    expect(blockBackground(study, null)).toBe('linear-gradient(to right, #2F62A8 0 5px, var(--tp-theme2) 5px)');
  });
});

describe('요일 글자색 (월간·모바일 주간)', () => {
  it('일요일 빨강, 토요일 파랑, 나머지는 기본', () => {
    expect(weekdayTextClass(0)).toBe('text-sunday');
    expect(weekdayTextClass(6)).toBe('text-saturday');
    expect(weekdayTextClass(3)).toBeNull();
  });
});
