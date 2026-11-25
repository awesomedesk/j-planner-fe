import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES, todo } from '@/test/fixtures';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setViewportWidth } from '@/test/viewport';
import { fetchCategories } from '@store/slices/categorySlice';
import { selectDiaryDates } from '@store/slices/diarySlice';
import { makeStore } from '@store/store';

import DiaryDialog from './DiaryDialog';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
  setViewportWidth(1440);
});
afterEach(() => vi.useRealTimers());

const DATE = '2026-09-25';
const SAVED = { date: DATE, content: '  오늘은\n기획서를 썼다.\n', updatedAt: '2026-09-25T22:00:00' };
const DONE = [todo({ id: 7, title: '운동하기', categoryId: 2, completed: true, completedAt: '2026-09-25T08:00:00' })];

const mount = async (routes: Record<string, Parameters<typeof mockApi>[0][string]> = {}) => {
  const api = mockApi({
    'GET /categories': () => json(200, CATEGORIES),
    [`GET /diaries/${DATE}`]: () => problem(404, 'NOT_FOUND', '일기가 없어요'),
    'GET /todos': () => json(200, []),
    [`PUT /diaries/${DATE}`]: (req) => json(201, { date: DATE, updatedAt: '2026-09-25T22:00:00', ...(req.body as object) }),
    [`DELETE /diaries/${DATE}`]: () => json(204),
    ...routes,
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  const onClose = vi.fn();
  const onSaved = vi.fn();
  const onDeleted = vi.fn();
  const view = renderWithStore(<DiaryDialog date={DATE} onClose={onClose} onSaved={onSaved} onDeleted={onDeleted} />, { store });
  return { api, store, onClose, onSaved, onDeleted, ...view };
};

const dialog = () => screen.getByRole('dialog', { name: '9월 25일 (금) 일기' });
const content = () => screen.getByRole('textbox', { name: '일기 내용' });
const saveButton = () => within(dialog()).getAllByRole('button', { name: '저장' })[0];

describe('일기 창 (US-24, OV-05 · DIARY-04 · D-011)', () => {
  it('머리는 날짜, 404면 빈 일기(오류 없음), 삭제 버튼 없음', async () => {
    const { store } = await mount();
    await waitFor(() => expect(content()).toBeEnabled());
    expect(content()).toHaveValue('');
    expect(within(dialog()).queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
    expect(store.getState().notice.items).toHaveLength(0);
  });

  it('쓴 일기는 내용 그대로 채우고 [삭제]가 있다', async () => {
    await mount({ [`GET /diaries/${DATE}`]: () => json(200, SAVED) });
    await waitFor(() => expect(content()).toHaveValue(SAVED.content));
    expect(within(dialog()).getByRole('button', { name: '삭제' })).toBeInTheDocument();
  });

  it('이날 완료한 Todo: completedOn으로 받아 읽기 전용 목록, 없으면 안내 (DIARY-04)', async () => {
    const { api } = await mount({ 'GET /todos': () => json(200, DONE) });
    const list = await screen.findByRole('list', { name: '이날 완료한 Todo' });
    expect(within(list).getByText('운동하기')).toBeInTheDocument();
    expect(within(list).queryByRole('button')).not.toBeInTheDocument();
    expect(api.calls('GET /todos')[0].query.get('completedOn')).toBe(DATE);
  });

  it('완료한 Todo가 없으면 "이날 완료한 Todo가 없어요."', async () => {
    await mount();
    expect(await screen.findByText('이날 완료한 Todo가 없어요.')).toBeInTheDocument();
  });

  it('공백·줄바꿈만이면 저장하지 않고 "내용을 입력해 주세요.", 내용 칸에 초점', async () => {
    const { user, api } = await mount();
    await waitFor(() => expect(content()).toBeEnabled());
    await user.type(content(), '   {Enter}  ');
    await user.click(saveButton());
    expect(screen.getByText('내용을 입력해 주세요.')).toBeInTheDocument();
    expect(content()).toHaveFocus();
    expect(api.calls(`PUT /diaries/${DATE}`)).toHaveLength(0);
  });

  it('저장: 앞뒤 공백·줄바꿈 그대로 PUT, 펜 표시 반영 후 onSaved (D-032)', async () => {
    const { user, api, store, onSaved } = await mount();
    await waitFor(() => expect(content()).toBeEnabled());
    await user.type(content(), '  첫 줄{Enter}둘째 줄{Enter}');
    await user.click(saveButton());
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.calls(`PUT /diaries/${DATE}`)[0].body).toEqual({ content: '  첫 줄\n둘째 줄\n' });
    expect(selectDiaryDates(store.getState()).has(DATE)).toBe(true);
  });

  it('413: "일기가 너무 길어요…" 창 안 오류, 내용 그대로 (D-079)', async () => {
    const { user, onSaved } = await mount({ [`PUT /diaries/${DATE}`]: () => problem(413, 'PAYLOAD_TOO_LARGE', 'too large') });
    await waitFor(() => expect(content()).toBeEnabled());
    await user.type(content(), '긴 일기');
    await user.click(saveButton());
    expect(await within(dialog()).findByRole('alert')).toHaveTextContent('일기가 너무 길어요. 조금 줄여서 저장해 주세요.');
    expect(content()).toHaveValue('긴 일기');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('삭제: 확인 창(취소 초점) → 삭제하면 DELETE, 펜 표시 지우고 onDeleted', async () => {
    const { user, api, store, onDeleted } = await mount({ [`GET /diaries/${DATE}`]: () => json(200, SAVED) });
    await waitFor(() => expect(content()).toHaveValue(SAVED.content));
    await user.click(within(dialog()).getByRole('button', { name: '삭제' }));
    const confirm = screen.getByRole('alertdialog', { name: '이날 일기를 지울까요?' });
    expect(confirm).toHaveAccessibleDescription('되돌릴 수 없어요.');
    expect(within(confirm).getByRole('button', { name: '취소' })).toHaveFocus();
    await user.click(within(confirm).getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(api.calls(`DELETE /diaries/${DATE}`)).toHaveLength(1);
    expect(selectDiaryDates(store.getState()).has(DATE)).toBe(false);
  });

  it('바뀐 내용이 있으면 Esc에 "작성을 취소할까요?", 새 일기를 비운 채면 바로 닫힘 (D-037)', async () => {
    const { user, onClose } = await mount();
    await waitFor(() => expect(content()).toBeEnabled());
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('고친 뒤 Esc → 작성 취소 확인', async () => {
    const { user, onClose } = await mount();
    await waitFor(() => expect(content()).toBeEnabled());
    await user.type(content(), '메모');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('alertdialog', { name: '작성을 취소할까요?' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
