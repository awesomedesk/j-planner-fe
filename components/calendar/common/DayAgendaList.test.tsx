import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES, schedule, todo } from '@/test/fixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { fetchCategories } from '@store/slices/categorySlice';
import { fetchSchedules } from '@store/slices/scheduleSlice';
import { fetchScheduledTodos } from '@store/slices/todoSlice';
import { makeStore } from '@store/store';

import { TodoActionsContext } from '@components/todo/TodoActionsContext';
import DayAgendaList from './DayAgendaList';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
});
afterEach(() => vi.useRealTimers());

const SCHEDULES = [
  schedule({ id: 1, title: '팀 미팅', start: '2026-09-25T10:00:00', end: '2026-09-25T11:00:00', categoryId: 3, location: { name: '회의실 A' } }),
  schedule({ id: 2, title: '영어 회화', start: '2026-09-25T19:00:00', end: '2026-09-25T20:00:00', url: 'https://meet.example.com/en' }),
];
const TODOS = [
  todo({ id: 11, title: '기획서 초안', time: { start: '11:00', durationMinutes: 90 }, categoryId: 3 }),
  todo({ id: 12, title: '물 마시기', time: { start: '09:00', durationMinutes: 10 }, completed: true }),
];

const setup = async (date = '2026-09-25', schedules = SCHEDULES, todos = TODOS) => {
  mockApi({
    'GET /categories': () => json(200, CATEGORIES),
    'GET /schedules': () => json(200, schedules),
    'GET /todos': () => json(200, todos),
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  await store.dispatch(fetchSchedules({ from: date, to: date }));
  await store.dispatch(fetchScheduledTodos({ from: date, to: date }));
  const onOpenSchedule = vi.fn();
  const openTodo = vi.fn();
  const view = renderWithStore(
    <TodoActionsContext.Provider value={{ openTodo }}>
      <DayAgendaList date={date} onOpenSchedule={onOpenSchedule} />
    </TodoActionsContext.Provider>,
    { store }
  );
  return { ...view, onOpenSchedule, openTodo };
};

describe('일간 Todo 탭 아래 그날 일정 목록 (US-17, D-022 · MO-10 ③)', () => {
  it("오늘이면 머리 '오늘 일정', 일정과 시간 지정 Todo를 시간순으로", async () => {
    await setup();
    const list = screen.getByRole('list', { name: '오늘 일정' });
    const rows = within(list).getAllByRole('listitem').map((li) => li.textContent);
    expect(rows).toEqual([
      expect.stringMatching(/09:00.*09:10.*물 마시기.*Todo/),
      expect.stringMatching(/10:00.*11:00.*팀 미팅.*회의실 A/),
      expect.stringMatching(/11:00.*12:30.*기획서 초안.*Todo/),
      expect.stringMatching(/19:00.*20:00.*영어 회화/),
    ]);
  });

  it("다른 날이면 '이날 일정'", async () => {
    await setup('2026-09-26', [], [todo({ id: 21, title: '산책', startDate: '2026-09-26', endDate: '2026-09-26', time: { start: '08:00', durationMinutes: 30 } })]);
    expect(screen.getByRole('list', { name: '이날 일정' })).toHaveTextContent('산책');
  });

  it('일정을 누르면 일정 수정 창, Todo를 누르면 Todo 수정 창', async () => {
    const { user, onOpenSchedule, openTodo } = await setup();
    await user.click(screen.getByRole('button', { name: /팀 미팅/ }));
    expect(onOpenSchedule).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    await user.click(screen.getByRole('button', { name: /기획서 초안/ }));
    expect(openTodo).toHaveBeenCalledWith(expect.objectContaining({ id: 11 }));
  });

  it('URL이 있는 일정은 링크 아이콘 (D-021)', async () => {
    await setup();
    expect(screen.getByRole('link', { name: '영어 회화 링크 열기' })).toHaveAttribute('href', 'https://meet.example.com/en');
  });

  it('완료한 Todo도 남고 줄 긋기 (US-15 Q1과 같게)', async () => {
    await setup();
    expect(screen.getByText('물 마시기')).toHaveClass('line-through');
  });

  it('없으면 안내', async () => {
    await setup('2026-09-25', [], []);
    expect(screen.getByText('이날 일정이 없어요')).toBeInTheDocument();
  });
});
