import { schedule } from './fixtures';

/** BE local-reset.sql 일정 일부 + 25일에 많이 몰린 경우 */
export const SEED_SCHEDULES = [
  schedule({ id: 1, title: '팀 주간 회의', start: '2026-09-21T10:00:00', end: '2026-09-21T11:00:00', categoryId: 3, url: 'https://meet.example.com/team-weekly' }),
  schedule({ id: 3, title: '헬스장', start: '2026-09-25T07:00:00', end: '2026-09-25T08:00:00', categoryId: 4 }),
  schedule({ id: 4, title: '치과', start: '2026-09-25T14:30:00', end: '2026-09-25T15:00:00', categoryId: 2, color: '#3F3F3F' }),
  schedule({ id: 12, title: '영어 회화', start: '2026-09-25T19:00:00', end: '2026-09-25T20:00:00', categoryId: 2 }),
  schedule({ id: 13, title: '저녁 약속', start: '2026-09-25T20:30:00', end: '2026-09-25T22:00:00', categoryId: 3 }),
  schedule({ id: 5, title: '가족 여행', allDay: true, start: '2026-09-26T00:00:00', end: '2026-09-27T23:59:59', categoryId: 1, color: '#2F7A4B' }),
  schedule({ id: 7, title: '새벽 배포', start: '2026-09-29T23:00:00', end: '2026-09-30T01:00:00', categoryId: 3, color: '#A6323F' }),
];
