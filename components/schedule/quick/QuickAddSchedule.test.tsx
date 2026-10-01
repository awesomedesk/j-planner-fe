import type { ComponentProps } from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES } from '@/test/fixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setViewportWidth } from '@/test/viewport';

import QuickAddSchedule from './QuickAddSchedule';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 24, 10, 0));
});
afterEach(() => vi.useRealTimers());

const ANCHOR = { left: 200, top: 300, right: 340, bottom: 346 };

const open = (props: Partial<ComponentProps<typeof QuickAddSchedule>> = {}) => {
  setViewportWidth(1440);
  const api = mockApi({ 'POST /schedules': (req) => json(201, { id: 50, ...(req.body as object) }) });
  const handlers = { onClose: vi.fn(), onSaved: vi.fn(), onOpenDetail: vi.fn(), onPreviewChange: vi.fn() };
  const view = renderWithStore(
    <QuickAddSchedule variant="popover" date="2026-09-24" startTime="14:00" anchor={ANCHOR} categories={CATEGORIES} {...handlers} {...props} />
  );
  return { api, ...handlers, ...view };
};

const dialog = () => screen.getByRole('dialog', { name: '빠른 추가' });
const titleInput = () => screen.getByRole('textbox', { name: '제목' });

describe('빠른 추가 팝업 (US-10, D-017, PC-03)', () => {
  it('누른 칸 시각부터 1시간, 날짜는 누른 날', () => {
    open();
    expect(within(dialog()).getByText('9/24 (목)')).toBeInTheDocument();
    expect(screen.getByLabelText('시작 시간')).toHaveValue('14:00');
    expect(screen.getByLabelText('종료 시간')).toHaveValue('15:00');
    expect(titleInput()).toHaveFocus();
  });

  it('일정/Todo 고르기: Todo는 M2 전까지 막아 둔다', () => {
    open();
    expect(screen.getByRole('button', { name: '일정' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Todo' })).toBeDisabled();
  });

  it('카테고리 기본은 미지정, 고를 수 있다', async () => {
    const { user } = open();
    const select = screen.getByRole('combobox', { name: '카테고리' });
    expect(select).toHaveDisplayValue('미지정');
    await user.selectOptions(select, '업무');
    expect(select).toHaveDisplayValue('업무');
  });

  it('제목·시간을 바꾸면 임시 블록 미리보기도 바뀐다', async () => {
    const { user, onPreviewChange } = open();
    expect(onPreviewChange).toHaveBeenLastCalledWith({ title: '', startTime: '14:00', endTime: '15:00' });
    await user.type(titleInput(), '팀 미팅');
    expect(onPreviewChange).toHaveBeenLastCalledWith({ title: '팀 미팅', startTime: '14:00', endTime: '15:00' });
  });

  it('시작 시간을 바꾸면 종료도 같은 길이만큼 옮겨진다', async () => {
    open();
    // time 칸은 브라우저가 한 번에 값을 바꾼다 (글자 단위 입력이 아님)
    fireEvent.change(screen.getByLabelText('시작 시간'), { target: { value: '16:30' } });
    expect(screen.getByLabelText('종료 시간')).toHaveValue('17:30');
  });

  it('저장 → 08-api-design 모양으로 POST 하고 onSaved', async () => {
    const { api, user, onSaved } = open();
    await user.type(titleInput(), '팀 미팅');
    await user.selectOptions(screen.getByRole('combobox', { name: '카테고리' }), '업무');
    await user.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.calls('POST /schedules')[0].body).toEqual({
      title: '팀 미팅',
      allDay: false,
      start: '2026-09-24T14:00:00',
      end: '2026-09-24T15:00:00',
      categoryId: 3,
      color: null,
      description: null,
      location: null,
      url: null,
    });
  });

  it('제목 칸에서 Enter로도 저장', async () => {
    const { api, user } = open();
    await user.type(titleInput(), '운동{Enter}');
    await waitFor(() => expect(api.calls('POST /schedules')).toHaveLength(1));
  });

  it('제목이 비면 요청 없이 안내', async () => {
    const { api, user } = open();
    await user.click(screen.getByRole('button', { name: '저장' }));
    expect(screen.getByText('제목을 입력하세요')).toBeInTheDocument();
    expect(api.calls('POST /schedules')).toHaveLength(0);
  });

  it('23:00을 누르면 종료는 다음 날 00:00 (자정까지)', async () => {
    const { api, user, onSaved } = open({ startTime: '23:00' });
    expect(screen.getByLabelText('종료 시간')).toHaveValue('00:00');
    await user.type(titleInput(), '야간 작업{Enter}');
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.calls('POST /schedules')[0].body).toMatchObject({ start: '2026-09-24T23:00:00', end: '2026-09-25T00:00:00' });
  });

  it.each(['취소', '닫기'])('입력한 것이 없으면 %s → 바로 닫힘 (임시 블록도 사라짐)', async (name) => {
    const { user, onClose } = open();
    await user.click(screen.getByRole('button', { name }));
    expect(onClose).toHaveBeenCalled();
  });

  it('입력한 것이 없으면 Esc·바깥 누르기 → 바로 닫힘', async () => {
    const { user, onClose } = open();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.click(screen.getByTestId('quick-add-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('입력 중 바깥을 누르면 "작성을 취소할까요?" (D-037)', async () => {
    const { user, onClose } = open();
    await user.type(titleInput(), '팀');
    await user.click(screen.getByTestId('quick-add-backdrop'));
    const confirm = screen.getByRole('alertdialog', { name: '작성을 취소할까요?' });
    await user.click(within(confirm).getByRole('button', { name: '계속 작성' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(titleInput()).toHaveValue('팀');

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: '작성 취소' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('자세히 입력 → 쓴 값을 그대로 넘긴다', async () => {
    const { user, onOpenDetail } = open();
    await user.type(titleInput(), '팀 미팅');
    await user.selectOptions(screen.getByRole('combobox', { name: '카테고리' }), '공부');
    await user.click(screen.getByRole('button', { name: '자세히 입력' }));
    expect(onOpenDetail).toHaveBeenCalledWith(
      expect.objectContaining({ title: '팀 미팅', startDate: '2026-09-24', startTime: '14:00', endTime: '15:00', categoryId: 2 })
    );
  });

  it('PC 팝업은 누른 시간 옆에 (가리지 않게)', () => {
    open();
    expect(dialog()).toHaveStyle({ left: `${ANCHOR.right + 8}px`, top: `${ANCHOR.top}px` });
  });
});

describe('모바일 빠른 추가 바텀 시트 (US-10, MO-12)', () => {
  it('아래 시트: 자세히 입력 + 저장 (취소 버튼 없음)', () => {
    open({ variant: 'sheet', anchor: undefined });
    expect(dialog()).toHaveAttribute('data-variant', 'sheet');
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '자세히 입력' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '취소' })).not.toBeInTheDocument();
  });
});

describe('빠른 추가 시간 조절 (D-053)', () => {
  it('끌어서 만든 길이로 시작 (09:00부터 2시간), 아직 입력한 것은 없음', async () => {
    const { user, onClose } = open({ startTime: '09:00', durationMinutes: 120 });
    expect(screen.getByLabelText('시작 시간')).toHaveValue('09:00');
    expect(screen.getByLabelText('종료 시간')).toHaveValue('11:00');
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled(); // 확인 없이 닫힘
  });

  it('임시 블록 손잡이로 바꾼 시간이 시간 칸에 들어온다', () => {
    const view = open();
    view.rerender(
      <QuickAddSchedule
        variant="popover"
        date="2026-09-24"
        startTime="14:00"
        anchor={ANCHOR}
        categories={CATEGORIES}
        onClose={view.onClose}
        onSaved={view.onSaved}
        onOpenDetail={view.onOpenDetail}
        onPreviewChange={view.onPreviewChange}
        times={{ startDate: '2026-09-24', startTime: '14:30', endDate: '2026-09-24', endTime: '16:00' }}
      />
    );
    expect(screen.getByLabelText('시작 시간')).toHaveValue('14:30');
    expect(screen.getByLabelText('종료 시간')).toHaveValue('16:00');
    expect(view.onPreviewChange).toHaveBeenLastCalledWith({ title: '', startTime: '14:30', endTime: '16:00' });
  });

  it('시간 칸에서는 분을 자유롭게 (14:10)', () => {
    open();
    fireEvent.change(screen.getByLabelText('시작 시간'), { target: { value: '14:10' } });
    expect(screen.getByLabelText('시작 시간')).toHaveValue('14:10');
    expect(screen.getByLabelText('종료 시간')).toHaveValue('15:10');
  });

  it('입력했는지를 바깥(AppShell)에 알린다 — 다른 빈 시간을 누를 때 확인용 (Q7)', async () => {
    const onDirtyChange = vi.fn();
    const { user } = open({ onDirtyChange });
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    await user.type(titleInput(), '팀');
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
  });

  it('바깥을 눌렀는데 그 아래가 시간표 빈 칸이면 그 칸을 누른 것으로 넘긴다 (Q7)', async () => {
    const column = document.createElement('div');
    column.setAttribute('data-quick-add-slot', '');
    const onColumnClick = vi.fn();
    column.addEventListener('click', (event) => onColumnClick((event as MouseEvent).clientY));
    document.body.appendChild(column);
    const elementFromPoint = vi.fn((): Element => column);
    Object.defineProperty(document, 'elementFromPoint', { value: elementFromPoint, configurable: true });

    const { onClose } = open();
    fireEvent.click(screen.getByTestId('quick-add-backdrop'), { clientX: 120, clientY: 400 });
    expect(onColumnClick).toHaveBeenCalledWith(400);
    expect(onClose).not.toHaveBeenCalled();

    elementFromPoint.mockReturnValue(document.body);
    fireEvent.click(screen.getByTestId('quick-add-backdrop'), { clientX: 5, clientY: 5 });
    expect(onClose).toHaveBeenCalled();
    column.remove();
    Reflect.deleteProperty(document, 'elementFromPoint');
  });
});
