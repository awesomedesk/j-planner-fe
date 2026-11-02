import { addDays, format } from 'date-fns';

import type { Category, Memo, Schedule, Todo } from '@/types/api';

/**
 * 둘러보기 예시 데이터 (US-40, 06 SITE-08) — 코드 속 고정 샘플을 '오늘'에 맞춰 만든다.
 * 합성 예시만: 실제 사람·계정·위치·외부 링크 없음. 서버·브라우저에 저장하지 않는다.
 */
export interface DemoData {
  categories: Category[];
  schedules: Schedule[];
  todos: Todo[];
  memos: Memo[];
}

const day = (today: Date, offset: number) => format(addDays(today, offset), 'yyyy-MM-dd');
const at = (today: Date, offset: number, time: string) => `${day(today, offset)}T${time}:00`;

export function buildDemoData(today: Date): DemoData {
  const categories: Category[] = [
    { id: 1, name: '미지정', color: '#6B6B6B', isDefault: true, sortOrder: 0, scheduleCount: 1, todoCount: 1 },
    { id: 2, name: '업무', color: '#2F62A8', isDefault: false, sortOrder: 1, scheduleCount: 3, todoCount: 1 },
    { id: 3, name: '생활', color: '#3F7D4E', isDefault: false, sortOrder: 2, scheduleCount: 2, todoCount: 2 },
  ];

  const schedule = (id: number, title: string, start: string, end: string, categoryId: number, allDay = false): Schedule => ({
    id,
    title,
    start,
    end,
    allDay,
    categoryId,
    color: null,
    description: null,
    location: null,
    url: null,
  });

  const schedules: Schedule[] = [
    schedule(1, '팀 회의', at(today, 0, '10:00'), at(today, 0, '11:00'), 2),
    schedule(2, '점심 약속', at(today, 0, '12:30'), at(today, 0, '13:30'), 3),
    schedule(3, '프로젝트 마감', at(today, 2, '00:00'), at(today, 2, '23:59'), 2, true),
    schedule(4, '치과', at(today, -3, '15:00'), at(today, -3, '16:00'), 3),
    schedule(5, '주간 회고', at(today, 5, '17:00'), at(today, 5, '18:00'), 2),
    schedule(6, '가족 저녁', at(today, 8, '19:00'), at(today, 8, '21:00'), 1),
  ];

  const todo = (id: number, title: string, offset: number, extra: Partial<Todo> = {}): Todo => ({
    id,
    title,
    type: 'DAY',
    startDate: day(today, offset),
    endDate: day(today, offset),
    time: null,
    categoryId: 1,
    color: null,
    completed: false,
    completedAt: null,
    sortOrder: id,
    overdue: false,
    ...extra,
  });

  const todos: Todo[] = [
    todo(1, '주간 계획 세우기', 0, { categoryId: 2, time: { start: '09:00', durationMinutes: 30 } }),
    todo(2, '책 읽기', 0, { categoryId: 3, time: { start: '21:00', durationMinutes: 60 } }),
    todo(3, '운동하기', 0, { categoryId: 3 }),
    todo(4, '장보기 목록 정리', 1),
  ];

  const memos: Memo[] = [
    { id: 1, title: '읽을 책', content: '이번 달에 읽을 책 두 권 고르기', createdAt: at(today, -2, '20:00'), updatedAt: at(today, -1, '21:00') },
  ];

  return { categories, schedules, todos, memos };
}
