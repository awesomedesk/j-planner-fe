import { act, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setViewportWidth } from '@/test/viewport';
import { selectDate } from '@store/slices/calendarSlice';
import { diaryChanged } from '@store/slices/diarySlice';
import { makeStore } from '@store/store';

import { DiaryActionsContext } from './DiaryActionsContext';
import DiarySection from './DiarySection';
import DiaryTab from './DiaryTab';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
});
afterEach(() => vi.useRealTimers());

const LONG = { date: '2026-09-25', content: '하나\n둘\n셋\n넷', updatedAt: '2026-09-25T22:00:00' };

const setup = (ui: React.ReactElement, routes = {}) => {
  let saved: object | null = null;
  const api = mockApi({
    'GET /diaries/2026-09-25': () => json(200, LONG),
    'GET /diaries/2026-09-24': () => (saved ? json(200, saved) : problem(404, 'NOT_FOUND', '없음')),
    'PUT /diaries/2026-09-24': (req) => {
      saved = { date: '2026-09-24', updatedAt: '2026-09-24T22:00:00', ...(req.body as object) };
      return json(201, saved);
    },
    'GET /todos': () => json(200, []),
    'GET /categories': () => json(200, []),
    'GET /diaries': () => json(200, []),
    ...routes,
  });
  const store = makeStore();
  const actions = { openDiary: vi.fn() };
  const view = renderWithStore(<DiaryActionsContext.Provider value={actions}>{ui}</DiaryActionsContext.Provider>, { store });
  return { api, actions, ...view };
};

describe('PC 사이드바 일기 섹션 (US-24, 06 사이드바 일기)', () => {
  beforeEach(() => setViewportWidth(1440));

  it('기준 날짜 일기: 앞 3줄 + [고치기] → 그날 일기 창', async () => {
    const { user, actions } = setup(<DiarySection />);
    const preview = await screen.findByTestId('diary-preview');
    expect(preview.textContent).toBe('하나\n둘\n셋…');
    await user.click(screen.getByRole('button', { name: '9월 25일 (금) 일기 고치기' }));
    expect(actions.openDiary).toHaveBeenCalledWith('2026-09-25');
  });

  it('없으면 "이날 쓴 일기가 없어요." + [일기 쓰기], 기준 날짜를 바꾸면 따라간다', async () => {
    const { user, actions, store } = setup(<DiarySection />);
    await screen.findByTestId('diary-preview');
    act(() => {
      store.dispatch(selectDate('2026-09-24'));
    });
    expect(await screen.findByText('이날 쓴 일기가 없어요.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '9월 24일 (목) 일기 쓰기' }));
    expect(actions.openDiary).toHaveBeenCalledWith('2026-09-24');
  });

  it('일기를 저장·삭제하면(revision) 다시 받는다', async () => {
    const { api, store } = setup(<DiarySection />);
    await screen.findByTestId('diary-preview');
    act(() => {
      store.dispatch(diaryChanged({ date: '2026-09-25', exists: true }));
    });
    await waitFor(() => expect(api.calls('GET /diaries/2026-09-25')).toHaveLength(2));
  });
});

describe('모바일 일간 일기 탭 (US-24, MO-11 · D-049)', () => {
  beforeEach(() => setViewportWidth(390));

  it('탭 안에서 바로 쓰고 저장하면 머문 채 "저장했어요." (role=status)', async () => {
    const { user, api } = setup(<DiaryTab date="2026-09-24" />);
    await waitFor(() => expect(screen.getByRole('textbox', { name: '일기 내용' })).toBeEnabled());
    await user.type(screen.getByRole('textbox', { name: '일기 내용' }), '오늘');
    await user.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('저장했어요.'));
    expect(api.calls('PUT /diaries/2026-09-24')[0].body).toEqual({ content: '오늘' });
    expect(screen.getByRole('textbox', { name: '일기 내용' })).toHaveValue('오늘');
    expect(within(screen.getByRole('region', { name: '9월 24일 (목) 일기' })).getByRole('button', { name: '삭제' })).toBeInTheDocument();
  });
});
