import { describe, expect, it } from 'vitest';

import type { Dday } from '@/types/api';

import {
  changeDdayCountType,
  createEmptyDdayValues,
  ddayToFormValues,
  isDdayFormChanged,
  toDdayCreateRequest,
  toDdayUpdateRequest,
  validateDdayForm,
} from './ddayFormUtils';

const countdown = (overrides: Partial<Dday> = {}): Dday => ({
  id: 4,
  title: '시험',
  targetDate: '2026-12-31',
  countType: 'COUNTDOWN',
  display: { interval: { enabled: false, days: 100 }, lastDays: { enabled: false, days: 7 }, daily: false, yearly: false },
  sortOrder: 0,
  today: { value: -3, label: 'D-3' },
  ...overrides,
});

const countup = (overrides: Partial<Dday> = {}): Dday => ({
  id: 5,
  title: '만난 날',
  targetDate: '2026-07-01',
  countType: 'COUNTUP',
  display: { interval: { enabled: true, days: 50 }, lastDays: { enabled: false, days: 7 }, daily: false, yearly: true },
  sortOrder: 1,
  today: { value: 30, label: 'D+30' },
  ...overrides,
});

describe('D-Day 입력 값 (US-22, D-012 · D-020)', () => {
  it('새로 만들 때: 기준 날짜, 남은 날 세기, 목표 날짜만 (D-012, D-020)', () => {
    const values = createEmptyDdayValues('2026-11-26');
    expect(values).toEqual({
      title: '',
      targetDate: '2026-11-26',
      countType: 'COUNTDOWN',
      interval: { enabled: false, days: '100' },
      lastDays: { enabled: false, days: '7' },
      daily: false,
      yearly: false,
    });
  });

  it('새로 만드는 중 지난 날로 바꾸면 100일 단위 + 매년, 다시 남은 날이면 목표 날짜만 (D-020)', () => {
    const created = createEmptyDdayValues('2026-11-26');
    const up = changeDdayCountType({ ...created, title: '입사', daily: true }, 'COUNTUP', 'create');
    expect(up).toMatchObject({ title: '입사', countType: 'COUNTUP', interval: { enabled: true, days: '100' }, daily: false, yearly: true });
    const down = changeDdayCountType(up, 'COUNTDOWN', 'create');
    expect(down).toMatchObject({ countType: 'COUNTDOWN', interval: { enabled: false, days: '100' }, lastDays: { enabled: false }, daily: false, yearly: false });
  });

  it('수정 중 기준을 바꾸면 N일 단위는 그대로, 새 기준에만 있는 옵션은 꺼진 채 (06 D-Day 입력 창)', () => {
    const values = ddayToFormValues(countup());
    const down = changeDdayCountType(values, 'COUNTDOWN', 'edit');
    expect(down).toMatchObject({ countType: 'COUNTDOWN', interval: { enabled: true, days: '50' }, lastDays: { enabled: false }, daily: false, yearly: false });
    const back = changeDdayCountType({ ...down, daily: true, lastDays: { enabled: true, days: '5' } }, 'COUNTUP', 'edit');
    expect(back).toMatchObject({ countType: 'COUNTUP', interval: { enabled: true, days: '50' }, yearly: false });
  });

  it('서버 D-Day → 입력 값 (일 수는 글자로, 없으면 기본 100·7)', () => {
    expect(ddayToFormValues(countdown({ display: { daily: true } }))).toMatchObject({
      interval: { enabled: false, days: '100' },
      lastDays: { enabled: false, days: '7' },
      daily: true,
    });
  });
});

describe('D-Day 입력 검사 (06 D-Day 입력 창)', () => {
  const valid = { ...createEmptyDdayValues('2026-11-26'), title: '시험' };

  it('제목: 앞뒤 공백 정리 후 비면 "제목을 입력해 주세요."', () => {
    expect(validateDdayForm({ ...valid, title: '   ' }).title).toBe('제목을 입력해 주세요.');
    expect(validateDdayForm(valid)).toEqual({});
  });

  it('제목 255자 넘으면 오류', () => {
    expect(validateDdayForm({ ...valid, title: 'a'.repeat(256) }).title).toBeTruthy();
    expect(validateDdayForm({ ...valid, title: 'a'.repeat(255) }).title).toBeUndefined();
  });

  it('날짜가 비면 오류', () => {
    expect(validateDdayForm({ ...valid, targetDate: '' }).targetDate).toBeTruthy();
  });

  it('켠 옵션의 N이 빈 값·0·소수면 "1 이상의 숫자를 입력해 주세요." — 끈 옵션은 검사하지 않음', () => {
    for (const days of ['', '0', '1.5', '-3', 'abc']) {
      expect(validateDdayForm({ ...valid, interval: { enabled: true, days } }).intervalDays).toBe('1 이상의 숫자를 입력해 주세요.');
      expect(validateDdayForm({ ...valid, lastDays: { enabled: true, days } }).lastDaysDays).toBe('1 이상의 숫자를 입력해 주세요.');
    }
    expect(validateDdayForm({ ...valid, interval: { enabled: false, days: '' } })).toEqual({});
  });

  it('지난 날 기준에서는 마지막 N일을 검사하지 않는다 (COUNTDOWN만)', () => {
    expect(validateDdayForm({ ...valid, countType: 'COUNTUP', lastDays: { enabled: true, days: '' } })).toEqual({});
  });
});

describe('D-Day 저장 요청 (08 6절 /ddays)', () => {
  it('추가: 제목 정리 + 그 기준의 옵션만, 끈 옵션은 일 수를 보내지 않는다', () => {
    const values = { ...createEmptyDdayValues('2026-12-31'), title: '  시험 ', lastDays: { enabled: true, days: '7' } };
    expect(toDdayCreateRequest(values)).toEqual({
      title: '시험',
      targetDate: '2026-12-31',
      countType: 'COUNTDOWN',
      display: { interval: { enabled: false }, lastDays: { enabled: true, days: 7 }, daily: false },
    });
  });

  it('추가(지난 날): interval + yearly만', () => {
    const values = changeDdayCountType({ ...createEmptyDdayValues('2026-07-01'), title: '입사' }, 'COUNTUP', 'create');
    expect(toDdayCreateRequest(values).display).toEqual({ interval: { enabled: true, days: 100 }, yearly: true });
  });

  it('수정: 바뀐 것만. 아무것도 안 바뀌면 빈 요청', () => {
    const dday = countdown();
    const values = ddayToFormValues(dday);
    expect(toDdayUpdateRequest(dday, values)).toEqual({});
    expect(toDdayUpdateRequest(dday, { ...values, title: '기말 시험 ' })).toEqual({ title: '기말 시험' });
    expect(toDdayUpdateRequest(dday, { ...values, targetDate: '2027-01-02' })).toEqual({ targetDate: '2027-01-02' });
  });

  it('수정: 옵션을 바꾸면 그 기준의 display 전체', () => {
    const dday = countdown();
    const values = ddayToFormValues(dday);
    expect(toDdayUpdateRequest(dday, { ...values, daily: true })).toEqual({
      display: { interval: { enabled: false }, lastDays: { enabled: false }, daily: true },
    });
  });

  it('수정: 기준을 바꾸면 새 기준에 없는 옵션을 꺼서 함께 보낸다 (08 구현 세부: 400 방지)', () => {
    const up = countup();
    const down = changeDdayCountType(ddayToFormValues(up), 'COUNTDOWN', 'edit');
    expect(toDdayUpdateRequest(up, down)).toEqual({
      countType: 'COUNTDOWN',
      display: { interval: { enabled: true, days: 50 }, lastDays: { enabled: false }, daily: false, yearly: false },
    });
    const dn = countdown();
    const toUp = changeDdayCountType(ddayToFormValues(dn), 'COUNTUP', 'edit');
    expect(toDdayUpdateRequest(dn, toUp)).toEqual({
      countType: 'COUNTUP',
      display: { interval: { enabled: false }, yearly: false, lastDays: { enabled: false }, daily: false },
    });
  });

  it('바뀐 내용이 있는지 (작성 취소 확인, D-037)', () => {
    const values = createEmptyDdayValues('2026-11-26');
    expect(isDdayFormChanged(values, values)).toBe(false);
    expect(isDdayFormChanged(values, { ...values, title: 'a' })).toBe(true);
    expect(isDdayFormChanged(values, { ...values, interval: { enabled: true, days: '100' } })).toBe(true);
  });
});
