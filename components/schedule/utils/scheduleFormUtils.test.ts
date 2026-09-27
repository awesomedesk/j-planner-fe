import { describe, expect, it } from 'vitest';

import { schedule } from '@/test/fixtures';

import {
  createEmptyFormValues,
  isFormChanged,
  scheduleToFormValues,
  shiftEndWithStart,
  toCreateRequest,
  toUpdateRequest,
  validateScheduleForm,
} from './scheduleFormUtils';

const at = (h: number, m: number, s = 0) => new Date(2026, 8, 24, h, m, s);

describe('새 일정 기본 시각 (D-037)', () => {
  it('추가 버튼: 지금 이후 가장 가까운 정각부터 1시간 (14:17 → 15:00~16:00)', () => {
    const v = createEmptyFormValues('2026-09-24', undefined, at(14, 17));
    expect([v.startDate, v.startTime, v.endDate, v.endTime]).toEqual(['2026-09-24', '15:00', '2026-09-24', '16:00']);
  });
  it('다른 날을 골라도 같은 규칙 (09:00이 아님)', () => {
    const v = createEmptyFormValues('2026-10-01', undefined, at(14, 17));
    expect([v.startDate, v.startTime, v.endTime]).toEqual(['2026-10-01', '15:00', '16:00']);
  });
  it('밤 11시대면 다음 날 00:00~01:00', () => {
    const v = createEmptyFormValues('2026-09-24', undefined, at(23, 17));
    expect([v.startDate, v.startTime, v.endDate, v.endTime]).toEqual(['2026-09-25', '00:00', '2026-09-25', '01:00']);
  });
  it('정각이면 그 시각부터', () => expect(createEmptyFormValues('2026-09-24', undefined, at(14, 0)).startTime).toBe('14:00'));
  it('시간표에서 누른 시각이 있으면 그 시각부터 1시간', () => {
    const v = createEmptyFormValues('2026-09-24', '10:00', at(14, 17));
    expect([v.startTime, v.endTime]).toEqual(['10:00', '11:00']);
  });
  it('카테고리 기본 미지정(null), 색 없음(Theme2) (D-014, D-030)', () => {
    const v = createEmptyFormValues('2026-09-24', '10:00');
    expect(v.categoryId).toBeNull();
    expect(v.color).toBeNull();
  });
});

describe('시작을 바꾸면 종료도 같은 길이만큼 (D-037)', () => {
  it('길이 유지, 달을 넘어가도', () => {
    const prev = { ...createEmptyFormValues('2026-09-30', '23:30'), endDate: '2026-10-01', endTime: '01:00' };
    expect(shiftEndWithStart(prev, '2026-10-31', '23:00')).toEqual({ endDate: '2026-11-01', endTime: '00:30' });
  });
});

describe('입력 검사 (US-05)', () => {
  const base = { ...createEmptyFormValues('2026-09-24', '10:00'), title: '팀 미팅' };
  it('제목 필수', () => expect(validateScheduleForm({ ...base, title: '  ' }).title).toBe('제목을 입력하세요'));
  it('종료가 시작보다 늦어야 함', () => expect(validateScheduleForm({ ...base, endTime: '10:00' }).endTime).toBeDefined());
  it('종일이면 날짜만 비교 (같은 날 가능)', () => expect(validateScheduleForm({ ...base, allDay: true })).toEqual({}));
  it('URL은 http:// 또는 https:// (SCH-13)', () => {
    expect(validateScheduleForm({ ...base, url: 'meet.com' }).url).toBeDefined();
    expect(validateScheduleForm({ ...base, url: 'https://meet.com' }).url).toBeUndefined();
  });
});

describe('요청 만들기 (08-api-design 4절)', () => {
  it('추가: 종일이면 00:00:00~23:59:59, 빈 칸은 null, 카테고리 없으면 보내지 않음', () => {
    const values = { ...createEmptyFormValues('2026-09-30', '10:00'), title: ' 여행 ', allDay: true, endDate: '2026-10-01' };
    expect(toCreateRequest(values)).toEqual({
      title: '여행',
      allDay: true,
      start: '2026-09-30T00:00:00',
      end: '2026-10-01T23:59:59',
      color: null,
      description: null,
      location: null,
      url: null,
    });
  });

  const original = schedule({
    id: 1,
    title: '팀 미팅',
    start: '2026-09-24T10:00:00',
    end: '2026-09-24T11:00:00',
    categoryId: 2,
    color: '#5B5F97',
    description: 'x',
    location: { name: '회의실 A', latitude: 37.5, longitude: 127 },
  });

  it('수정: 바뀐 것이 없으면 빈 요청', () => expect(toUpdateRequest(original, scheduleToFormValues(original))).toEqual({}));

  it('수정: 바뀐 필드만 (Merge Patch), 색 해제는 null', () => {
    const values = { ...scheduleToFormValues(original), endTime: '12:00', color: null };
    expect(toUpdateRequest(original, values)).toEqual({ end: '2026-09-24T12:00:00', color: null });
  });

  it('장소 이름을 바꾸면 좌표를 null로 함께 보낸다 (D-037, D-040)', () => {
    const values = { ...scheduleToFormValues(original), locationName: '회의실 B' };
    expect(toUpdateRequest(original, values)).toEqual({ location: { name: '회의실 B', latitude: null, longitude: null } });
  });

  it('장소 이름을 지우면 location: null', () => {
    expect(toUpdateRequest(original, { ...scheduleToFormValues(original), locationName: '' })).toEqual({ location: null });
  });

  it('종일 일정을 그대로 두면 요청 없음', () => {
    const allDay = { ...original, allDay: true, start: '2026-09-24T00:00:00', end: '2026-09-25T23:59:59' };
    expect(toUpdateRequest(allDay, scheduleToFormValues(allDay))).toEqual({});
  });
});

describe('작성 취소 확인이 필요한가 (D-037)', () => {
  it('처음 값 그대로면 아님, 하나라도 바뀌면 맞음', () => {
    const initial = createEmptyFormValues('2026-09-24', '10:00');
    expect(isFormChanged(initial, { ...initial })).toBe(false);
    expect(isFormChanged(initial, { ...initial, title: 'a' })).toBe(true);
  });
});
