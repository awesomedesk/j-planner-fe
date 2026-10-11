import { describe, expect, it } from 'vitest';

import { schedule, todo } from '@/test/fixtures';

import { dayAgendaItems } from './dayAgendaUtils';

const DATE = '2026-09-25';
const view = (items: ReturnType<typeof dayAgendaItems>) =>
  items.map((item) => [item.kind, item.kind === 'schedule' ? item.schedule.title : item.todo.title, item.timeTop, item.timeBottom]);

describe('그날 일정 목록 줄 만들기 (US-17, MO-10 ③)', () => {
  it('일정과 시간 지정 Todo를 함께 시간순으로. 시간 칸은 시작·끝', () => {
    const items = dayAgendaItems(
      [
        schedule({ id: 1, title: '팀 미팅', start: '2026-09-25T10:00:00', end: '2026-09-25T11:00:00' }),
        schedule({ id: 2, title: '영어 회화', start: '2026-09-25T19:00:00', end: '2026-09-25T20:00:00' }),
      ],
      [
        todo({ id: 11, title: '기획서 초안', time: { start: '11:00', durationMinutes: 90 } }),
        todo({ id: 12, title: '영어 단어', time: { start: '09:00', durationMinutes: 60 } }),
      ],
      DATE
    );
    expect(view(items)).toEqual([
      ['todo', '영어 단어', '09:00', '10:00'],
      ['schedule', '팀 미팅', '10:00', '11:00'],
      ['todo', '기획서 초안', '11:00', '12:30'],
      ['schedule', '영어 회화', '19:00', '20:00'],
    ]);
  });

  it("종일·여러 날 일정은 맨 위, 시간 칸은 '종일' / '계속' (그날 끝나면 끝 시각)", () => {
    const items = dayAgendaItems(
      [
        schedule({ id: 1, title: '헬스', start: '2026-09-25T07:00:00', end: '2026-09-25T08:00:00' }),
        schedule({ id: 2, title: '가족 여행', allDay: true, start: '2026-09-24T00:00:00', end: '2026-09-26T23:59:59' }),
        schedule({ id: 3, title: '야간 배포', start: '2026-09-24T23:00:00', end: '2026-09-25T01:00:00' }),
      ],
      [],
      DATE
    );
    expect(view(items)).toEqual([
      ['schedule', '가족 여행', '종일', null],
      ['schedule', '야간 배포', '계속', '01:00'],
      ['schedule', '헬스', '07:00', '08:00'],
    ]);
  });

  it('그날에 없는 일정, 시간이 없거나 범위 밖인 Todo는 빼고, 기간·주간 Todo는 범위 안 매일 (D-027)', () => {
    const items = dayAgendaItems(
      [schedule({ id: 1, title: '어제 일정', start: '2026-09-24T10:00:00', end: '2026-09-24T11:00:00' })],
      [
        todo({ id: 11, title: '시간 없음' }),
        todo({ id: 12, title: '다른 날', startDate: '2026-09-26', endDate: '2026-09-26', time: { start: '08:00', durationMinutes: 30 } }),
        todo({ id: 13, title: '아침 독서', type: 'PERIOD', startDate: '2026-09-22', endDate: '2026-09-28', time: { start: '07:00', durationMinutes: 60 } }),
      ],
      DATE
    );
    expect(view(items)).toEqual([['todo', '아침 독서', '07:00', '08:00']]);
  });

  it('같은 시각이면 일정 먼저', () => {
    const items = dayAgendaItems(
      [schedule({ id: 1, title: '회의', start: '2026-09-25T10:00:00', end: '2026-09-25T11:00:00' })],
      [todo({ id: 11, title: '정리', time: { start: '10:00', durationMinutes: 30 } })],
      DATE
    );
    expect(view(items).map((v) => v[1])).toEqual(['회의', '정리']);
  });
});
