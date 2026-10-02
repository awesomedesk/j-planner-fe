import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Todo } from '@/types/api';
import { CATEGORIES } from '@/test/fixtures';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';

import TodoFormDialog from './TodoFormDialog';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 24, 14, 17)); // 9/24(목) 14:17
});
afterEach(() => vi.useRealTimers());

const TODO: Todo = {
  id: 15,
  title: '기획서 초안',
  type: 'WEEK',
  startDate: '2026-09-20',
  endDate: '2026-09-26',
  time: { start: '11:00', durationMinutes: 90 },
  categoryId: 3,
  color: null,
  completed: false,
  completedAt: null,
  sortOrder: 7,
  overdue: false,
};

const openCreate = (routes: Parameters<typeof mockApi>[0] = {}) => {
  const api = mockApi({ 'POST /todos': (req) => json(201, { id: 50, ...(req.body as object) }), ...routes });
  const handlers = { onSaved: vi.fn(), onDeleted: vi.fn(), onClose: vi.fn() };
  const view = renderWithStore(<TodoFormDialog target={{ mode: 'create', baseDate: '2026-09-24' }} categories={CATEGORIES} {...handlers} />);
  return { api, ...handlers, ...view };
};
const openEdit = (routes: Parameters<typeof mockApi>[0] = {}) => {
  const api = mockApi(routes);
  const handlers = { onSaved: vi.fn(), onDeleted: vi.fn(), onClose: vi.fn() };
  const view = renderWithStore(<TodoFormDialog target={{ mode: 'edit', todo: TODO }} categories={CATEGORIES} {...handlers} />);
  return { api, ...handlers, ...view };
};

const saveButton = () => screen.getAllByRole('button', { name: '저장' })[0];
const typeRadio = (name: string) => within(screen.getByRole('radiogroup', { name: '종류' })).getByRole('radio', { name });

describe('Todo 추가 (US-12, OV-02 · MO-09)', () => {
  it('처음: 하루, 고른 날짜, 시간 지정 꺼짐, 카테고리 미지정, 색 없음', () => {
    openCreate();
    expect(screen.getByRole('dialog', { name: 'Todo 추가' })).toBeInTheDocument();
    expect(typeRadio('하루')).toBeChecked();
    expect(screen.getByLabelText('날짜')).toHaveValue('2026-09-24');
    expect(screen.getByRole('switch', { name: '시간 지정' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByLabelText('시작 시간')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '카테고리' })).toHaveDisplayValue('미지정');
    expect(screen.getByRole('button', { name: '색 선택 안 함 (테마 기본색)' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('즐겨찾기·완성도는 "첫 배포 이후" 자리만 (D-008·D-021)', () => {
    openCreate();
    expect(screen.getByText('즐겨찾기').closest('[aria-disabled]')).toHaveTextContent('첫 배포 이후');
    expect(screen.getByText('완성도 (% / 분수)').closest('[aria-disabled]')).toHaveTextContent('첫 배포 이후');
  });

  it('하루 + 시간 지정 → 08-api-design 모양으로 POST', async () => {
    const { api, user, onSaved } = openCreate();
    await user.type(screen.getByRole('textbox', { name: '제목' }), '기획서 초안');
    await user.click(screen.getByRole('switch', { name: '시간 지정' }));
    expect(screen.getByLabelText('시작 시간')).toHaveValue('15:00');
    fireEvent.change(screen.getByLabelText('종료 시간'), { target: { value: '16:30' } });
    await user.selectOptions(screen.getByRole('combobox', { name: '카테고리' }), '업무');
    await user.click(screen.getByRole('button', { name: '색 #5B5F97' }));
    await user.click(saveButton());
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.calls('POST /todos')[0].body).toEqual({
      title: '기획서 초안',
      type: 'DAY',
      startDate: '2026-09-24',
      endDate: '2026-09-24',
      time: { start: '15:00', durationMinutes: 90 },
      categoryId: 3,
      color: '#5B5F97',
    });
  });

  it('기간: 시작일 ~ 마감일 (기간 동안 매일 박스에, TODO-05)', async () => {
    const { api, user } = openCreate();
    await user.type(screen.getByRole('textbox', { name: '제목' }), '여행 준비');
    await user.click(typeRadio('기간'));
    fireEvent.change(screen.getByLabelText('마감일'), { target: { value: '2026-09-27' } });
    await user.click(saveButton());
    await waitFor(() => expect(api.calls('POST /todos')).toHaveLength(1));
    expect(api.calls('POST /todos')[0].body).toMatchObject({ type: 'PERIOD', startDate: '2026-09-24', endDate: '2026-09-27' });
  });

  it('주간 목표: 그 주로 맞추고 기간을 보여 준다 (주 시작 일요일, D-041)', async () => {
    const { api, user } = openCreate();
    await user.type(screen.getByRole('textbox', { name: '제목' }), '운동 3번');
    await user.click(typeRadio('주간 목표'));
    expect(screen.getByText('9/20 (일) ~ 9/26 (토)')).toBeInTheDocument();
    await user.click(saveButton());
    await waitFor(() => expect(api.calls('POST /todos')).toHaveLength(1));
    expect(api.calls('POST /todos')[0].body).toMatchObject({ type: 'WEEK', startDate: '2026-09-20', endDate: '2026-09-26' });
  });

  it('월간 목표: 달을 고른다', async () => {
    const { api, user } = openCreate();
    await user.type(screen.getByRole('textbox', { name: '제목' }), '책 2권');
    await user.click(typeRadio('월간 목표'));
    fireEvent.change(screen.getByLabelText('달'), { target: { value: '2026-10' } });
    await user.click(saveButton());
    await waitFor(() => expect(api.calls('POST /todos')).toHaveLength(1));
    expect(api.calls('POST /todos')[0].body).toMatchObject({ type: 'MONTH', startDate: '2026-10-01', endDate: '2026-10-31' });
  });

  it('제목이 비면 요청 없이 안내', async () => {
    const { api, user } = openCreate();
    await user.click(saveButton());
    expect(screen.getByText('제목을 입력하세요')).toBeInTheDocument();
    expect(api.calls('POST /todos')).toHaveLength(0);
  });

  it('서버 VALIDATION_FAILED는 칸 아래에', async () => {
    const { user } = openCreate({
      'POST /todos': () => problem(400, 'VALIDATION_FAILED', '입력값을 확인하세요.', [{ field: 'endDate', message: '마감일을 확인하세요.' }]),
    });
    await user.type(screen.getByRole('textbox', { name: '제목' }), 'a');
    await user.click(saveButton());
    expect(await screen.findByText('마감일을 확인하세요.')).toBeInTheDocument();
  });

  it('입력 중 Esc → "작성을 취소할까요?" (D-037)', async () => {
    const { user } = openCreate();
    await user.type(screen.getByRole('textbox', { name: '제목' }), '보');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('alertdialog', { name: '작성을 취소할까요?' })).toBeInTheDocument();
  });
});

describe('Todo 수정·삭제 (US-12)', () => {
  it('값이 채워진다: 주간 목표, 시간 11:00~12:30, 업무', () => {
    openEdit();
    expect(screen.getByRole('dialog', { name: 'Todo 수정' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue('기획서 초안');
    expect(typeRadio('주간 목표')).toBeChecked();
    expect(screen.getByLabelText('시작 시간')).toHaveValue('11:00');
    expect(screen.getByLabelText('종료 시간')).toHaveValue('12:30');
    expect(screen.getByRole('combobox', { name: '카테고리' })).toHaveDisplayValue('업무');
  });

  it('제목만 바꾸면 제목만 PATCH (D-042: 예전 주간 Todo도 날짜는 안 보냄)', async () => {
    const { api, user, onSaved } = openEdit({ 'PATCH /todos/:id': (req) => json(200, { ...TODO, ...(req.body as object) }) });
    const title = screen.getByRole('textbox', { name: '제목' });
    await user.clear(title);
    await user.type(title, '기획서 2차');
    await user.click(saveButton());
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.calls('PATCH /todos/:id')[0]).toMatchObject({ path: '/todos/15', body: { title: '기획서 2차' } });
  });

  it('바꾼 것이 없으면 요청 없이 닫힘', async () => {
    const { api, user, onSaved } = openEdit({ 'PATCH /todos/:id': () => json(200, TODO) });
    await user.click(saveButton());
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.calls('PATCH /todos/:id')).toHaveLength(0);
  });

  it('삭제는 두 번 눌러 확인 → DELETE (PC 아래 줄 · 모바일 아래 "Todo 삭제", D-030)', async () => {
    const { api, user, onDeleted } = openEdit({ 'DELETE /todos/:id': () => json(204) });
    expect(screen.getByRole('button', { name: 'Todo 삭제' })).toBeInTheDocument(); // 모바일 본문 아래
    await user.click(screen.getByRole('button', { name: '삭제' }));
    await user.click(screen.getByRole('button', { name: '삭제 확인' }));
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(15));
    expect(api.calls('DELETE /todos/:id')).toHaveLength(1);
  });
});
