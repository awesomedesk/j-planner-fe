import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES, todo } from '@/test/fixtures';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setCategoryFilter } from '@store/slices/calendarSlice';
import { fetchCategories } from '@store/slices/categorySlice';
import { makeStore } from '@store/store';

import { TodoActionsContext } from '../TodoActionsContext';
import TodoBox from './TodoBox';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
});
afterEach(() => vi.useRealTimers());

const TODOS = [
  todo({ id: 1, title: '기획서 초안', time: { start: '11:00', durationMinutes: 90 }, categoryId: 3 }),
  todo({ id: 2, title: '장보기' }),
  todo({ id: 3, title: '보고서 작성', type: 'PERIOD', startDate: '2026-09-21', endDate: '2026-09-30', categoryId: 3 }),
  todo({ id: 4, title: '러닝 3회', type: 'WEEK', startDate: '2026-09-20', endDate: '2026-09-26', categoryId: 4 }),
  todo({ id: 5, title: '책 1권 읽기', type: 'MONTH', startDate: '2026-09-01', endDate: '2026-09-30', categoryId: 2 }),
  todo({ id: 6, title: '물 2L', completed: true, completedAt: '2026-09-25T08:00:00' }),
];

const setup = async (routes: Parameters<typeof mockApi>[0] = {}, filter: number[] | null = null) => {
  const api = mockApi({
    'GET /categories': () => json(200, CATEGORIES),
    'GET /todos': () => json(200, TODOS),
    'PUT /todos/:id/position': (req) => json(200, TODOS.find((t) => req.path === `/todos/${t.id}/position`)),
    'PATCH /todos/:id': (req) => json(200, { ...TODOS.find((t) => `/todos/${t.id}` === req.path), ...(req.body as object) }),
    ...routes,
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  if (filter) store.dispatch(setCategoryFilter(filter));
  const openTodo = vi.fn();
  const view = renderWithStore(
    <TodoActionsContext.Provider value={{ openTodo }}>
      <TodoBox date="2026-09-25" />
    </TodoActionsContext.Provider>,
    { store }
  );
  await screen.findByRole('list', { name: '9월 25일 (금) Todo' });
  return { api, openTodo, ...view, store };
};

const list = () => screen.getByRole('list', { name: '9월 25일 (금) Todo' });
const titles = () => within(list()).getAllByRole('listitem').map((li) => within(li).getByRole('button', { name: /수정$/ }).textContent);

describe('그날의 Todo 한 박스 (US-13, D-013)', () => {
  it('그날 박스를 받는다: GET /todos?date=', async () => {
    const { api } = await setup();
    expect(api.calls('GET /todos')[0].query.toString()).toBe('date=2026-09-25');
  });

  it('종류를 나누지 않고 한 박스, 서버가 준 순서(사용자 순서) 그대로. 완료한 것은 숨김 (D-015)', async () => {
    await setup();
    expect(titles()).toEqual(['기획서 초안', '장보기', '보고서 작성', '러닝 3회', '책 1권 읽기']);
  });

  it('종류는 꼬리표로만: 기간 ~마감일, 주간, 월간. 시간이 있으면 시작 시각', async () => {
    await setup();
    const row = (name: string) => within(list()).getByRole('button', { name: `${name} 수정` }).closest('li') as HTMLElement;
    expect(row('기획서 초안')).toHaveTextContent('11:00');
    expect(row('보고서 작성')).toHaveTextContent('기간');
    expect(row('보고서 작성')).toHaveTextContent('~9/30');
    expect(row('러닝 3회')).toHaveTextContent('주간');
    expect(row('책 1권 읽기')).toHaveTextContent('월간');
    expect(row('장보기')).not.toHaveTextContent(/기간|주간|월간/);
  });

  it("머리에 '완료/전체' 수", async () => {
    await setup();
    expect(screen.getByText('1/6')).toBeInTheDocument();
  });

  it("'완료 1개 보기'로 완료한 Todo를 펼친다", async () => {
    const { user } = await setup();
    const toggle = screen.getByRole('button', { name: '완료 1개 보기' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    const done = screen.getByRole('list', { name: '완료한 Todo' });
    expect(within(done).getByRole('checkbox', { name: '물 2L 완료' })).toBeChecked();
    expect(screen.getByRole('button', { name: '완료 1개 접기' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('체크하면 PATCH { completed: true } 하고 박스에서 숨김 (기간·주간도 한 번이면 완료, D-027)', async () => {
    const { api, user } = await setup();
    await user.click(screen.getByRole('checkbox', { name: '러닝 3회 완료' }));
    expect(titles()).not.toContain('러닝 3회');
    expect(screen.getByRole('button', { name: '완료 2개 보기' })).toBeInTheDocument();
    await waitFor(() => expect(api.calls('PATCH /todos/:id')).toHaveLength(1));
    expect(api.calls('PATCH /todos/:id')[0]).toMatchObject({ path: '/todos/4', body: { completed: true } });
  });

  it('완료를 풀면 박스로 돌아온다', async () => {
    const { api, user } = await setup();
    await user.click(screen.getByRole('button', { name: '완료 1개 보기' }));
    await user.click(screen.getByRole('checkbox', { name: '물 2L 완료' }));
    expect(titles()).toContain('물 2L');
    await waitFor(() => expect(api.calls('PATCH /todos/:id')[0]).toMatchObject({ path: '/todos/6', body: { completed: false } }));
  });

  it('저장에 실패하면 되돌리고 짧은 안내', async () => {
    const { store, user } = await setup({ 'PATCH /todos/:id': () => problem(500, 'INTERNAL_ERROR', '서버 오류가 났어요') });
    await user.click(screen.getByRole('checkbox', { name: '장보기 완료' }));
    await waitFor(() => expect(titles()).toContain('장보기'));
    expect(store.getState().notice.items.map((n) => n.message)).toContain('서버 오류가 났어요');
  });

  it('제목을 누르면 Todo 수정 창을 연다 (US-12 Q1)', async () => {
    const { user, openTodo } = await setup();
    await user.click(screen.getByRole('button', { name: '장보기 수정' }));
    expect(openTodo).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
  });

  it('카테고리 필터를 같이 보낸다 (CAT-03)', async () => {
    const { api } = await setup({}, [2, 3]);
    expect(api.calls('GET /todos')[0].query.toString()).toBe('date=2026-09-25&categoryId=2&categoryId=3');
  });

  it('비어 있으면 안내', async () => {
    mockApi({ 'GET /categories': () => json(200, CATEGORIES), 'GET /todos': () => json(200, []) });
    const store = makeStore();
    renderWithStore(<TodoBox date="2026-09-25" />, { store });
    expect(await screen.findByText('Todo가 없어요')).toBeInTheDocument();
  });
});

describe('끌어서 순서 바꾸기 (US-14, TODO-09, D-029 · D-030)', () => {
  beforeEach(() => {
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  });

  /** 줄 높이 36px, 간격 4px로 세운다: 장보기(2번째 줄)는 40~76, 가운데 58 */
  const layout = () =>
    within(list())
      .getAllByRole('listitem')
      .forEach((li, i) => {
        li.getBoundingClientRect = () => ({ top: i * 40, bottom: i * 40 + 36, height: 36, left: 0, right: 300, width: 300, x: 0, y: i * 40, toJSON: () => ({}) });
      });
  const row = (name: string) => screen.getByRole('button', { name: `${name} 수정` }).closest('li') as HTMLElement;
  const drag = (el: HTMLElement, fromY: number, toY: number, pointerType = 'mouse') => {
    fireEvent.pointerDown(el, { pointerId: 1, pointerType, clientY: fromY, button: 0 });
    fireEvent.pointerMove(el, { pointerId: 1, pointerType, clientY: fromY + 2 });
    fireEvent.pointerMove(el, { pointerId: 1, pointerType, clientY: toY });
    fireEvent.pointerUp(el, { pointerId: 1, pointerType, clientY: toY });
  };

  it('PC: 마우스로 끌어 놓으면 그 자리로 옮기고 PUT /todos/{id}/position { afterId: 바로 앞 }', async () => {
    const { api } = await setup();
    layout();
    drag(row('장보기'), 58, 150); // 가운데 150 → 러닝 3회(120~156) 뒤
    expect(titles()).toEqual(['기획서 초안', '보고서 작성', '러닝 3회', '장보기', '책 1권 읽기']);
    await waitFor(() => expect(api.calls('PUT /todos/:id/position')).toHaveLength(1));
    expect(api.calls('PUT /todos/:id/position')[0]).toMatchObject({ path: '/todos/2/position', body: { afterId: 4 } });
  });

  it('맨 위로 옮기면 afterId: null', async () => {
    const { api } = await setup();
    layout();
    drag(row('러닝 3회'), 138, 5);
    expect(titles()[0]).toBe('러닝 3회');
    await waitFor(() => expect(api.calls('PUT /todos/:id/position')[0]).toMatchObject({ path: '/todos/4/position', body: { afterId: null } }));
  });

  it('끄는 동안 놓일 자리를 선으로 보이고, 놓으면 사라진다', async () => {
    await setup();
    layout();
    const el = row('장보기');
    fireEvent.pointerDown(el, { pointerId: 1, clientY: 58, button: 0 });
    fireEvent.pointerMove(el, { pointerId: 1, clientY: 150 });
    expect(list().querySelector('[data-drop-indicator]')).not.toBeNull();
    expect(el).toHaveAttribute('data-dragging');
    fireEvent.pointerUp(el, { pointerId: 1, clientY: 150 });
    expect(list().querySelector('[data-drop-indicator]')).toBeNull();
  });

  it('제자리에 놓으면 요청하지 않는다', async () => {
    const { api } = await setup();
    layout();
    drag(row('장보기'), 58, 62);
    await new Promise((r) => setTimeout(r, 20));
    expect(api.calls('PUT /todos/:id/position')).toHaveLength(0);
  });

  it('끌고 나서 손을 떼도 수정 창은 열리지 않는다. 그냥 누르면 열린다', async () => {
    const { openTodo, user } = await setup();
    layout();
    const el = row('장보기');
    drag(el, 58, 150);
    fireEvent.click(screen.getByRole('button', { name: '장보기 수정' }));
    expect(openTodo).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '장보기 수정' }));
    expect(openTodo).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
  });

  it('체크박스에서 시작하면 끌지 않는다', async () => {
    const { api } = await setup();
    layout();
    drag(screen.getByRole('checkbox', { name: '장보기 완료' }), 58, 150);
    expect(titles()[1]).toBe('장보기');
    expect(api.calls('PUT /todos/:id/position')).toHaveLength(0);
  });

  it('옮기기에 실패하면 원래 순서로 되돌리고 짧은 안내', async () => {
    const { store } = await setup({ 'PUT /todos/:id/position': () => problem(500, 'INTERNAL_ERROR', '서버 오류가 났어요') });
    layout();
    drag(row('장보기'), 58, 150);
    await waitFor(() => expect(titles()).toEqual(['기획서 초안', '장보기', '보고서 작성', '러닝 3회', '책 1권 읽기']));
    expect(store.getState().notice.items.map((n) => n.message)).toContain('서버 오류가 났어요');
  });

  describe('모바일: 길게 눌러 끌기, 짧게 누르면 열기', () => {
    /** 이미 Date만 가짜인 상태에서 다시 부르면 무시되므로 한 번 풀고 건다 */
    const useTimers = () => {
      vi.useRealTimers();
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    };

    it('길게(0.4초) 누른 뒤 끌면 옮긴다', async () => {
      const { api } = await setup();
      layout();
      useTimers();
      const el = row('장보기');
      fireEvent.pointerDown(el, { pointerId: 1, pointerType: 'touch', clientY: 58 });
      act(() => vi.advanceTimersByTime(400));
      expect(el).toHaveAttribute('data-dragging');
      fireEvent.pointerMove(el, { pointerId: 1, pointerType: 'touch', clientY: 150 });
      fireEvent.pointerUp(el, { pointerId: 1, pointerType: 'touch', clientY: 150 });
      vi.useRealTimers();
      expect(titles()).toEqual(['기획서 초안', '보고서 작성', '러닝 3회', '장보기', '책 1권 읽기']);
      await waitFor(() => expect(api.calls('PUT /todos/:id/position')[0]).toMatchObject({ path: '/todos/2/position', body: { afterId: 4 } }));
    });

    it('길게 누르기 전에 움직이면 스크롤로 보고 끌지 않는다', async () => {
      const { api } = await setup();
      layout();
      useTimers();
      const el = row('장보기');
      fireEvent.pointerDown(el, { pointerId: 1, pointerType: 'touch', clientY: 58 });
      fireEvent.pointerMove(el, { pointerId: 1, pointerType: 'touch', clientY: 80 });
      act(() => vi.advanceTimersByTime(500));
      fireEvent.pointerMove(el, { pointerId: 1, pointerType: 'touch', clientY: 150 });
      fireEvent.pointerUp(el, { pointerId: 1, pointerType: 'touch', clientY: 150 });
      vi.useRealTimers();
      expect(el).not.toHaveAttribute('data-dragging');
      expect(titles()[1]).toBe('장보기');
      expect(api.calls('PUT /todos/:id/position')).toHaveLength(0);
    });

    it('길게 눌렀다 그대로 떼면 수정 창을 열지 않는다', async () => {
      const { openTodo } = await setup();
      layout();
      useTimers();
      const el = row('장보기');
      fireEvent.pointerDown(el, { pointerId: 1, pointerType: 'touch', clientY: 58 });
      act(() => vi.advanceTimersByTime(400));
      fireEvent.pointerUp(el, { pointerId: 1, pointerType: 'touch', clientY: 58 });
      fireEvent.click(screen.getByRole('button', { name: '장보기 수정' }));
      vi.useRealTimers();
      expect(openTodo).not.toHaveBeenCalled();
    });

    it('짧게 누르면 수정 창을 연다', async () => {
      const { openTodo } = await setup();
      layout();
      useTimers();
      const el = row('장보기');
      fireEvent.pointerDown(el, { pointerId: 1, pointerType: 'touch', clientY: 58 });
      act(() => vi.advanceTimersByTime(150));
      fireEvent.pointerUp(el, { pointerId: 1, pointerType: 'touch', clientY: 58 });
      fireEvent.click(screen.getByRole('button', { name: '장보기 수정' }));
      vi.useRealTimers();
      expect(openTodo).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
    });
  });

  it('완료한 Todo는 끌지 않는다 (박스 순서는 미완료끼리)', async () => {
    const { api, user } = await setup();
    await user.click(screen.getByRole('button', { name: '완료 1개 보기' }));
    const done = within(screen.getByRole('list', { name: '완료한 Todo' })).getByRole('listitem');
    drag(done, 10, 200);
    expect(done).not.toHaveAttribute('data-dragging');
    expect(api.calls('PUT /todos/:id/position')).toHaveLength(0);
  });

  it('키보드: 제목에서 Alt+↓/↑로 한 칸씩 옮긴다', async () => {
    const { api, user } = await setup();
    screen.getByRole('button', { name: '장보기 수정' }).focus();
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(titles()).toEqual(['기획서 초안', '보고서 작성', '장보기', '러닝 3회', '책 1권 읽기']);
    await waitFor(() => expect(api.calls('PUT /todos/:id/position')[0]).toMatchObject({ path: '/todos/2/position', body: { afterId: 3 } }));
    expect(screen.getByRole('button', { name: '장보기 수정' })).toHaveFocus();
    screen.getByRole('button', { name: '기획서 초안 수정' }).focus();
    await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
    expect(api.calls('PUT /todos/:id/position')).toHaveLength(1);
  });
});
