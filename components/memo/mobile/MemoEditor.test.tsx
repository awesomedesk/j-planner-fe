import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Memo } from '@/types/api';
import { BOOKS } from '@/test/memoFixtures';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setViewportWidth } from '@/test/viewport';

import MemoEditor from './MemoEditor';

const NOW = '2026-10-01T10:00:00';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 9, 1, 10, 0));
  setViewportWidth(390);
});
afterEach(() => vi.useRealTimers());

const open = (memo: Memo | null, routes: Parameters<typeof mockApi>[0] = {}) => {
  const api = mockApi({
    'POST /memos': (req) => json(201, { id: 10, createdAt: NOW, updatedAt: NOW, ...(req.body as object) }),
    'PATCH /memos/:id': (req) => json(200, { ...BOOKS, ...(req.body as object), updatedAt: NOW }),
    'DELETE /memos/:id': () => json(204),
    ...routes,
  });
  const onClose = vi.fn();
  const onSaved = vi.fn();
  const onDeleted = vi.fn();
  const view = renderWithStore(<MemoEditor memo={memo} onClose={onClose} onSaved={onSaved} onDeleted={onDeleted} />);
  return { api, onClose, onSaved, onDeleted, ...view };
};

const titleInput = () => screen.getByRole('textbox', { name: '메모 제목' });
const contentInput = () => screen.getByRole('textbox', { name: '메모 내용' });
const saveButton = () => screen.getAllByRole('button', { name: '저장' })[0];

describe('모바일 메모 편집 MO-15 (US-25)', () => {
  it("머리: '<' 뒤로 · 메모 · 저장 (D-049, D-030)", () => {
    open(null);
    expect(screen.getByRole('dialog', { name: '메모' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '뒤로' })).toBeInTheDocument();
    expect(saveButton()).toBeInTheDocument();
  });

  it('제목·내용이 모두 비면 저장 버튼 비활성 (US-25 AC)', async () => {
    const { user } = open(null);
    expect(saveButton()).toBeDisabled();
    await user.type(contentInput(), ' \n ');
    expect(saveButton()).toBeDisabled();
    await user.type(titleInput(), '장보기');
    expect(saveButton()).toBeEnabled();
  });

  it('새 메모를 비운 채 뒤로 가면 안내 없이 버리고 요청도 안 보낸다 (D-032)', async () => {
    const { api, onClose, user } = open(null);
    await user.click(screen.getByRole('button', { name: '뒤로' }));
    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(api.all()).toHaveLength(0);
  });

  it('입력한 채 뒤로 가면 "작성을 취소할까요?" (D-037)', async () => {
    const { onClose, user } = open(null);
    await user.type(titleInput(), '장보기');
    await user.click(screen.getByRole('button', { name: '뒤로' }));
    expect(screen.getByRole('alertdialog', { name: '작성을 취소할까요?' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('저장 버튼으로 POST, 저장되면 onSaved (탭으로 돌아감, D-057)', async () => {
    const { api, onSaved, user } = open(null);
    await user.type(titleInput(), '  장보기 ');
    await user.type(contentInput(), '우유');
    await user.click(saveButton());
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.calls('POST /memos')[0].body).toEqual({ title: '장보기', content: '우유' });
    expect(onSaved.mock.calls[0][0]).toMatchObject({ id: 10, title: '장보기' });
  });

  it("기존 메모: 값과 'M/D 수정' 표시, 바뀐 칸만 PATCH (D-057)", async () => {
    const { api, onSaved, user } = open(BOOKS);
    expect(titleInput()).toHaveValue('읽을 책 목록');
    expect(screen.getByText('9/24 수정')).toBeInTheDocument();
    await user.type(contentInput(), '\n- 이기적 유전자');
    await user.click(saveButton());
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.calls('PATCH /memos/:id')[0].body).toEqual({ content: '- 데미안\n- 코스모스\n- 이기적 유전자' });
  });

  it('삭제는 두 번 눌러 확인 (D-055)', async () => {
    const { api, onDeleted, user } = open(BOOKS);
    await user.click(screen.getByRole('button', { name: '메모 삭제' }));
    expect(api.calls('DELETE /memos/:id')).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: '메모 삭제 확인' }));
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(1));
    expect(api.calls('DELETE /memos/:id')[0].path).toBe('/memos/1');
  });

  it('입력해도 저장 버튼 전에는 요청 없음 — MO-15는 자동 저장 없음 (D-030, D-057)', async () => {
    const { api, user } = open(BOOKS);
    await user.type(contentInput(), '!');
    await new Promise((resolve) => setTimeout(resolve, 1300));
    expect(api.all()).toHaveLength(0);
  });

  it('새 메모에는 삭제 버튼이 없다 (US-25)', () => {
    open(null);
    expect(screen.queryByRole('button', { name: '메모 삭제' })).not.toBeInTheDocument();
  });

  it('400이 오면 두 칸 모두 오류 표시 (D-047)', async () => {
    const { user } = open(null, {
      'POST /memos': () =>
        problem(400, 'VALIDATION_FAILED', '입력값을 확인하세요', [
          { field: 'title', message: '제목이나 내용을 입력하세요' },
          { field: 'content', message: '제목이나 내용을 입력하세요' },
        ]),
    });
    await user.type(contentInput(), 'x');
    await user.click(saveButton());
    await waitFor(() => expect(screen.getAllByText('제목이나 내용을 입력하세요')).toHaveLength(2));
  });
});
