import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Memo } from '@/types/api';
import { BOOKS, MEMOS } from '@/test/memoFixtures';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';

import MemoDialog from './MemoDialog';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 9, 1, 10, 0));
});
afterEach(() => vi.useRealTimers());

const NOW = '2026-10-01T10:00:00';

const open = (startWith: 'list' | 'new', routes: Parameters<typeof mockApi>[0] = {}) => {
  const api = mockApi({
    'GET /memos': () => json(200, MEMOS),
    'POST /memos': (req) => json(201, { id: 10, createdAt: NOW, updatedAt: NOW, ...(req.body as object) }),
    'PATCH /memos/:id': (req) => {
      const base = MEMOS.find((m) => req.path.endsWith(`/${m.id}`)) as Memo;
      return json(200, { ...base, ...(req.body as object), updatedAt: NOW });
    },
    'DELETE /memos/:id': () => json(204),
    ...routes,
  });
  const onClose = vi.fn();
  const onChanged = vi.fn();
  const view = renderWithStore(<MemoDialog startWith={startWith} onClose={onClose} onChanged={onChanged} />);
  return { api, onClose, onChanged, ...view };
};

const memoList = () => screen.getByRole('list', { name: '메모 목록' });
const listTexts = () => within(memoList()).getAllByRole('listitem').map((item) => item.textContent ?? '');
const titleInput = () => screen.getByRole('textbox', { name: '메모 제목' });
const contentInput = () => screen.getByRole('textbox', { name: '메모 내용' });
const saveButton = () => screen.getAllByRole('button', { name: '저장' })[0];

describe('메모 창 OV-06 (US-25)', () => {
  it('목록은 최근 수정 순 (US-25 AC, D-029)', async () => {
    open('list');
    await waitFor(() => expect(listTexts()).toHaveLength(4));
    expect(listTexts()[0]).toContain('읽을 책 목록');
    expect(listTexts()[1]).toContain('여행 준비물');
    expect(listTexts()[2]).toContain('플래너 위젯 아이디어');
    expect(listTexts()[3]).toContain('작년 메모');
  });

  it('제목 없는 메모는 내용 첫 줄을 제목 자리에 (D-055)', async () => {
    open('list');
    await waitFor(() => expect(listTexts()).toHaveLength(4));
    expect(within(memoList()).getByText('플래너 위젯 아이디어')).toBeInTheDocument();
  });

  it("'n개'로 열면 맨 위(최근 수정) 메모를 보여 준다, 날짜 칸 없음 (D-011, 확인 부탁)", async () => {
    open('list');
    await waitFor(() => expect(titleInput()).toHaveValue('읽을 책 목록'));
    expect(contentInput()).toHaveValue('- 데미안\n- 코스모스');
    expect(screen.getByText('9/24 수정')).toBeInTheDocument();
    expect(screen.queryByLabelText(/날짜/)).not.toBeInTheDocument();
  });

  it('검색 칸이 없다 (D-030)', async () => {
    open('list');
    await waitFor(() => expect(listTexts()).toHaveLength(4));
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it("'+'로 열면 새 메모. 제목·내용이 모두 비면 저장 버튼 비활성 (US-25 AC, D-055)", async () => {
    const { user } = open('new');
    await waitFor(() => expect(listTexts()).toHaveLength(4));
    expect(titleInput()).toHaveValue('');
    expect(saveButton()).toBeDisabled();
    await user.type(titleInput(), '   ');
    expect(saveButton()).toBeDisabled();
  });

  it('입력해도 저장 버튼을 누르기 전에는 요청을 보내지 않는다 — 자동 저장 없음 (D-030)', async () => {
    const { api, user } = open('new');
    await waitFor(() => expect(listTexts()).toHaveLength(4));
    await user.type(contentInput(), '장보기');
    expect(api.calls('POST /memos')).toHaveLength(0);
    expect(api.calls('PATCH /memos/:id')).toHaveLength(0);
  });

  it('새 메모 저장: 제목 비면 null로 POST, 목록 맨 위에 생기고 onChanged (US-25, D-047)', async () => {
    const { api, onChanged, user } = open('new');
    await waitFor(() => expect(listTexts()).toHaveLength(4));
    await user.type(contentInput(), '장보기');
    await user.click(saveButton());
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(api.calls('POST /memos')[0].body).toEqual({ title: null, content: '장보기' });
    await waitFor(() => expect(listTexts()).toHaveLength(5));
    expect(listTexts()[0]).toContain('장보기');
  });

  it('수정은 바뀐 칸만 PATCH (날짜 없음, D-011)', async () => {
    const { api, user } = open('list');
    await waitFor(() => expect(titleInput()).toHaveValue('읽을 책 목록'));
    await user.clear(titleInput());
    await user.type(titleInput(), '읽을 책');
    await user.click(saveButton());
    await waitFor(() => expect(api.calls('PATCH /memos/:id')).toHaveLength(1));
    expect(api.calls('PATCH /memos/:id')[0].path).toBe('/memos/1');
    expect(api.calls('PATCH /memos/:id')[0].body).toEqual({ title: '읽을 책' });
  });

  it('바꾼 채 다른 메모를 누르면 "작성을 취소할까요?" (D-037)', async () => {
    const { user } = open('list');
    await waitFor(() => expect(titleInput()).toHaveValue('읽을 책 목록'));
    await user.type(titleInput(), '!');
    await user.click(within(memoList()).getByText('여행 준비물'));
    const confirm = screen.getByRole('alertdialog', { name: '작성을 취소할까요?' });
    await user.click(within(confirm).getByRole('button', { name: '계속 작성' }));
    expect(titleInput()).toHaveValue('읽을 책 목록!');

    await user.click(within(memoList()).getByText('여행 준비물'));
    await user.click(screen.getByRole('button', { name: '작성 취소' }));
    expect(titleInput()).toHaveValue('여행 준비물');
  });

  it('바꾼 채 닫으면 "작성을 취소할까요?" (D-037)', async () => {
    const { onClose, user } = open('list');
    await waitFor(() => expect(titleInput()).toHaveValue('읽을 책 목록'));
    await user.type(contentInput(), '\n- 이기적 유전자');
    await user.click(screen.getAllByRole('button', { name: '닫기' })[0]);
    expect(screen.getByRole('alertdialog', { name: '작성을 취소할까요?' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('새 메모를 비운 채 닫으면 안내 없이 닫고 요청도 안 보낸다 (D-032)', async () => {
    const { api, onClose, user } = open('new');
    await waitFor(() => expect(listTexts()).toHaveLength(4));
    await user.click(screen.getAllByRole('button', { name: '닫기' })[0]);
    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(api.calls('POST /memos')).toHaveLength(0);
  });

  it('삭제는 두 번 눌러 확인 (삭제 → 삭제 확인) (D-055)', async () => {
    const { api, onChanged, user } = open('list');
    await waitFor(() => expect(titleInput()).toHaveValue('읽을 책 목록'));
    await user.click(screen.getByRole('button', { name: '삭제' }));
    expect(api.calls('DELETE /memos/:id')).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: '삭제 확인' }));
    await waitFor(() => expect(api.calls('DELETE /memos/:id')).toHaveLength(1));
    expect(api.calls('DELETE /memos/:id')[0].path).toBe('/memos/1');
    await waitFor(() => expect(listTexts()).toHaveLength(3));
    expect(onChanged).toHaveBeenCalled();
  });

  it('삭제 확인 중 취소하면 지우지 않는다', async () => {
    const { api, user } = open('list');
    await waitFor(() => expect(titleInput()).toHaveValue('읽을 책 목록'));
    await user.click(screen.getByRole('button', { name: '삭제' }));
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
    expect(api.calls('DELETE /memos/:id')).toHaveLength(0);
  });

  it('새 메모에는 삭제 버튼이 없다', async () => {
    open('new');
    await waitFor(() => expect(listTexts()).toHaveLength(4));
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
  });

  it('400이 오면 제목·내용 두 칸 모두 오류 표시 (D-047, 확인 부탁)', async () => {
    const { user } = open('new', {
      'POST /memos': () =>
        problem(400, 'VALIDATION_FAILED', '입력값을 확인하세요', [
          { field: 'title', message: '제목이나 내용을 입력하세요' },
          { field: 'content', message: '제목이나 내용을 입력하세요' },
        ]),
    });
    await waitFor(() => expect(listTexts()).toHaveLength(4));
    await user.type(contentInput(), 'x');
    await user.click(saveButton());
    await waitFor(() => expect(screen.getAllByText('제목이나 내용을 입력하세요')).toHaveLength(2));
    expect(titleInput()).toHaveAttribute('aria-invalid', 'true');
    expect(contentInput()).toHaveAttribute('aria-invalid', 'true');
  });

  it('제목은 255자까지 입력 (08-api-design 8절, 확인 부탁)', async () => {
    open('list');
    await waitFor(() => expect(titleInput()).toHaveValue(BOOKS.title));
    expect(titleInput()).toHaveAttribute('maxLength', '255');
    expect(screen.getByText('7/255')).toBeInTheDocument();
  });
});
