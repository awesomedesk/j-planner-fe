import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CATEGORIES } from '@/test/fixtures';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';

import CategoryManagerDialog from './CategoryManagerDialog';

const WITH_STUDY = [...CATEGORIES, { ...CATEGORIES[1], id: 9, name: 'Study', sortOrder: 4 }];

const setup = (routes: Parameters<typeof mockApi>[0] = {}) => {
  const api = mockApi({ 'GET /categories': () => json(200, WITH_STUDY), ...routes });
  const onClose = vi.fn();
  const view = renderWithStore(<CategoryManagerDialog onClose={onClose} />);
  return { api, onClose, ...view };
};

const rowOf = async (name: string) => {
  const list = await screen.findByRole('list', { name: '카테고리 목록' });
  const row = await within(list).findByText(name, { selector: 'span' });
  return row.closest('li') as HTMLElement;
};

describe('카테고리 관리 (US-04)', () => {
  it('창을 열 때마다 목록을 새로 받는다 (연결 개수 최신화)', async () => {
    const { api } = setup();
    await rowOf('공부');
    expect(api.calls('GET /categories')).toHaveLength(1);
  });

  it('미지정은 맨 위, 회색, "기본 · 맨 위 고정" 표시, 수정·삭제·이동 버튼 없음 (D-014, D-037)', async () => {
    setup();
    const rows = within(await screen.findByRole('list', { name: '카테고리 목록' })).getAllByRole('listitem');
    await waitFor(() => expect(rows[0]).toHaveTextContent('미지정'));
    const first = within(screen.getAllByRole('listitem')[0]);
    expect(first.getByText('기본 · 맨 위 고정')).toBeInTheDocument();
    expect(first.queryByRole('button')).not.toBeInTheDocument();
  });

  it('연결된 일정·Todo 수를 보여준다 (D-032)', async () => {
    const row = await (setup(), rowOf('업무'));
    expect(row).toHaveTextContent('일정 3 · Todo 3');
  });

  it('색을 고르지 않고 추가하면 color: null로 보낸다 (D-037)', async () => {
    const { api, user } = setup({ 'POST /categories': (req) => json(201, { id: 20, ...(req.body as object) }) });
    await rowOf('공부');
    await user.type(screen.getByRole('textbox', { name: '새 카테고리 이름' }), '독서');
    await user.click(screen.getByRole('button', { name: '추가' }));
    await waitFor(() => expect(api.calls('POST /categories')).toHaveLength(1));
    expect(api.calls('POST /categories')[0].body).toEqual({ name: '독서', color: null });
    await waitFor(() => expect(api.calls('GET /categories')).toHaveLength(2)); // 추가 뒤 다시 받기
  });

  it('고른 색을 다시 누르면 선택 해제 → 선택 없음(null) (D-039)', async () => {
    const { api, user } = setup({ 'POST /categories': (req) => json(201, { id: 20, ...(req.body as object) }) });
    await rowOf('공부');
    const red = within(screen.getByRole('group', { name: /새 카테고리 색/ })).getByRole('button', { name: '색 #A6323F' });
    await user.click(red);
    expect(red).toHaveAttribute('aria-pressed', 'true');
    await user.click(red);
    expect(red).toHaveAttribute('aria-pressed', 'false');
    await user.type(screen.getByRole('textbox', { name: '새 카테고리 이름' }), '독서');
    await user.click(screen.getByRole('button', { name: '추가' }));
    await waitFor(() => expect(api.calls('POST /categories')[0]?.body).toEqual({ name: '독서', color: null }));
  });

  it('같은 이름(대소문자·악센트·앞뒤 공백 무시)은 요청 없이 안내 (D-035)', async () => {
    const { api, user } = setup();
    await rowOf('Study');
    await user.type(screen.getByRole('textbox', { name: '새 카테고리 이름' }), ' STUDY ');
    await user.click(screen.getByRole('button', { name: '추가' }));
    expect(screen.getByText('이미 있는 이름이에요 (같은 이름 추가·변경 불가)')).toBeInTheDocument();
    expect(api.calls('POST /categories')).toHaveLength(0);
  });

  it('서버가 409 CATEGORY_NAME_DUPLICATED를 주면 같은 안내', async () => {
    const { user } = setup({ 'POST /categories': () => problem(409, 'CATEGORY_NAME_DUPLICATED', '같은 이름의 카테고리가 이미 있습니다: 독서') });
    await rowOf('공부');
    await user.type(screen.getByRole('textbox', { name: '새 카테고리 이름' }), '독서');
    await user.click(screen.getByRole('button', { name: '추가' }));
    expect(await screen.findByText('이미 있는 이름이에요 (같은 이름 추가·변경 불가)')).toBeInTheDocument();
  });

  it('줄에서 바로 이름·색 수정 → 바뀐 것만 PATCH (D-037)', async () => {
    const { api, user } = setup({ 'PATCH /categories/:id': (req) => json(200, { ...CATEGORIES[2], ...(req.body as object) }) });
    await user.click(within(await rowOf('업무')).getByRole('button', { name: '수정' }));
    const input = screen.getByRole('textbox', { name: '카테고리 이름' });
    await user.clear(input);
    await user.type(input, '회사');
    await user.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(api.calls('PATCH /categories/:id')).toHaveLength(1));
    expect(api.calls('PATCH /categories/:id')[0]).toMatchObject({ path: '/categories/3', body: { name: '회사' } });
  });

  it('삭제는 줄에서 "지울까요?" + 확인/취소로 한 번 더 확인 (D-037)', async () => {
    const { api, user } = setup({ 'DELETE /categories/:id': () => json(204) });
    await user.click(within(await rowOf('업무')).getAllByRole('button', { name: '삭제' })[0]);
    expect(screen.getByText(/을\(를\) 지울까요\? 일정 3 · Todo 3은 미지정으로 옮겨져요/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(api.calls('DELETE /categories/:id')).toHaveLength(0);

    await user.click(within(await rowOf('업무')).getAllByRole('button', { name: '삭제' })[0]);
    await user.click(screen.getByRole('button', { name: '확인' }));
    await waitFor(() => expect(api.calls('DELETE /categories/:id')[0]?.path).toBe('/categories/3'));
  });

  it('▲ 두 번째 카테고리를 올리면 afterId: null(미지정 바로 뒤) (D-029)', async () => {
    const { api, user } = setup({ 'PUT /categories/:id/position': () => json(200, CATEGORIES[2]) });
    await user.click(await screen.findByRole('button', { name: '업무 위로' }));
    await waitFor(() => expect(api.calls('PUT /categories/:id/position')[0]).toMatchObject({ path: '/categories/3/position', body: { afterId: null } }));
    expect(screen.getByRole('button', { name: '공부 위로' })).toBeDisabled();
  });

  it('입력 중에 닫으면 "작성을 취소할까요?" (D-037)', async () => {
    const { onClose, user } = setup();
    await rowOf('공부');
    await user.type(screen.getByRole('textbox', { name: '새 카테고리 이름' }), '독');
    await user.click(screen.getAllByRole('button', { name: '닫기' })[0]);
    expect(screen.getByRole('alertdialog', { name: '작성을 취소할까요?' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
