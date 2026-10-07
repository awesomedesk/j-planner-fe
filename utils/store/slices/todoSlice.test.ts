import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { todo } from '@/test/fixtures';
import { json, mockApi, problem } from '@/test/mockApi';
import { makeStore } from '@store/store';

import {
  fetchDayTodos,
  fetchScheduledTodos,
  refreshTodos,
  selectDayTodos,
  selectScheduledTodos,
  setTodoCompleted,
} from './todoSlice';

const TIMED = todo({ id: 1, title: '기획서', time: { start: '11:00', durationMinutes: 60 } });

describe('시간표 Todo 상태 (US-15)', () => {
  it('fetchScheduledTodos: from·to·scheduled=true(+카테고리)로 받는다', async () => {
    const api = mockApi({ 'GET /todos': () => json(200, [TIMED]) });
    const store = makeStore();
    await store.dispatch(fetchScheduledTodos({ from: '2026-09-20', to: '2026-09-26', categoryId: [3] }));
    expect(api.calls('GET /todos')[0].query.toString()).toBe('from=2026-09-20&to=2026-09-26&scheduled=true&categoryId=3');
    expect(selectScheduledTodos(store.getState())).toEqual([TIMED]);
  });

  it('카테고리를 하나도 안 고르면 요청 없이 빈 목록 (US-11)', async () => {
    const api = mockApi({});
    const store = makeStore();
    await store.dispatch(fetchScheduledTodos({ from: '2026-09-20', to: '2026-09-26', categoryId: [] }));
    expect(api.calls('GET /todos')).toHaveLength(0);
    expect(selectScheduledTodos(store.getState())).toEqual([]);
  });

  it('완료 체크는 박스와 시간표에 같이 반영, 실패하면 둘 다 되돌린다', async () => {
    let fail = false;
    mockApi({
      'GET /todos': () => json(200, [TIMED]),
      'PATCH /todos/:id': () => (fail ? problem(500, 'INTERNAL_ERROR', '서버 오류') : json(200, { ...TIMED, completed: true })),
    });
    const store = makeStore();
    await store.dispatch(fetchDayTodos({ date: '2026-09-25' }));
    await store.dispatch(fetchScheduledTodos({ from: '2026-09-25', to: '2026-09-25' }));

    const pending = store.dispatch(setTodoCompleted({ id: 1, completed: true }));
    expect(selectScheduledTodos(store.getState())[0].completed).toBe(true);
    expect(selectDayTodos(store.getState())[0].completed).toBe(true);
    await pending;

    fail = true;
    await store.dispatch(setTodoCompleted({ id: 1, completed: false }));
    expect(selectScheduledTodos(store.getState())[0].completed).toBe(true);
    expect(selectDayTodos(store.getState())[0].completed).toBe(true);
  });

  it('refreshTodos: Todo를 저장·삭제한 뒤 박스와 시간표를 둘 다 다시 받는다', async () => {
    const api = mockApi({ 'GET /todos': () => json(200, [TIMED]) });
    const store = makeStore();
    await store.dispatch(fetchDayTodos({ date: '2026-09-25' }));
    await store.dispatch(fetchScheduledTodos({ from: '2026-09-20', to: '2026-09-26' }));
    await store.dispatch(refreshTodos());
    await waitFor(() => expect(api.calls('GET /todos')).toHaveLength(4));
    expect(api.calls('GET /todos').slice(2).map((c) => c.query.toString()).sort()).toEqual([
      'date=2026-09-25',
      'from=2026-09-20&to=2026-09-26&scheduled=true',
    ]);
  });
});
