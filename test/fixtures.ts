import type { Category, Schedule, Todo } from '@/types/api';

/** BE 로컬 테스트 데이터(local-reset.sql)와 같은 모양 */
export const CATEGORIES: Category[] = [
  { id: 1, name: '미지정', color: '#6B6B6B', isDefault: true, sortOrder: 0, scheduleCount: 1, todoCount: 1 },
  { id: 2, name: '공부', color: '#2F62A8', isDefault: false, sortOrder: 1, scheduleCount: 2, todoCount: 3 },
  { id: 3, name: '업무', color: '#A6323F', isDefault: false, sortOrder: 2, scheduleCount: 3, todoCount: 3 },
  { id: 4, name: '운동', color: null, isDefault: false, sortOrder: 3, scheduleCount: 2, todoCount: 1 },
];

export const schedule = (overrides: Partial<Schedule> & Pick<Schedule, 'id' | 'start' | 'end'>): Schedule => ({
  title: '일정',
  allDay: false,
  categoryId: 1,
  color: null,
  description: null,
  location: null,
  url: null,
  ...overrides,
});

export const todo = (overrides: Partial<Todo> & Pick<Todo, 'id'>): Todo => ({
  title: 'Todo',
  type: 'DAY',
  startDate: '2026-09-25',
  endDate: '2026-09-25',
  time: null,
  categoryId: 1,
  color: null,
  completed: false,
  completedAt: null,
  sortOrder: overrides.id,
  overdue: false,
  ...overrides,
});
