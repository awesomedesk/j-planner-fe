import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES, schedule } from '@/test/fixtures';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';

import ScheduleFormDialog from './ScheduleFormDialog';

const TEAM = schedule({
  id: 1,
  title: '팀 주간 회의',
  start: '2026-09-21T10:00:00',
  end: '2026-09-21T11:00:00',
  categoryId: 3,
  location: { name: '회의실 A', latitude: 37.5, longitude: 127 },
  url: 'https://meet.example.com/team-weekly',
});

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 24, 14, 17));
});
afterEach(() => vi.useRealTimers());

const openCreate = (routes: Parameters<typeof mockApi>[0] = {}) => {
  const api = mockApi({ 'POST /schedules': (req) => json(201, { id: 50, ...(req.body as object) }), ...routes });
  const onSaved = vi.fn();
  const view = renderWithStore(
    <ScheduleFormDialog target={{ mode: 'create', baseDate: '2026-09-24' }} categories={CATEGORIES} onClose={vi.fn()} onSaved={onSaved} />
  );
  return { api, onSaved, ...view };
};

const saveButton = () => screen.getAllByRole('button', { name: '저장' })[0];

describe('일정 추가 (US-05)', () => {
  it('기본 시각: 지금(14:17) 이후 가장 가까운 정각부터 1시간 (D-037)', () => {
    openCreate();
    expect(screen.getByLabelText('시작 시간')).toHaveValue('15:00');
    expect(screen.getByLabelText('종료 시간')).toHaveValue('16:00');
  });

  it('카테고리 기본값은 미지정 (D-014)', () => {
    openCreate();
    expect(screen.getByRole('combobox', { name: '카테고리' })).toHaveDisplayValue('미지정');
  });

  it('반복·이동시간은 "첫 배포 이후" 자리만 (D-008)', () => {
    openCreate();
    expect(screen.getAllByText('첫 배포 이후')).toHaveLength(2);
  });

  it('저장하면 08-api-design 모양으로 POST', async () => {
    const { api, onSaved, user } = openCreate();
    await user.type(screen.getByRole('textbox', { name: '제목' }), '팀 미팅');
    await user.selectOptions(screen.getByRole('combobox', { name: '카테고리' }), '업무');
    await user.click(screen.getByRole('button', { name: '색 #5B5F97' }));
    await user.type(screen.getByRole('textbox', { name: '장소' }), '회의실 A');
    await user.click(saveButton());
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.calls('POST /schedules')[0].body).toEqual({
      title: '팀 미팅',
      allDay: false,
      start: '2026-09-24T15:00:00',
      end: '2026-09-24T16:00:00',
      categoryId: 3,
      color: '#5B5F97',
      description: null,
      location: { name: '회의실 A', latitude: null, longitude: null },
      url: null,
    });
  });

  it('제목이 비면 요청 없이 칸 아래 안내', async () => {
    const { api, user } = openCreate();
    await user.click(saveButton());
    expect(screen.getByText('제목을 입력하세요')).toBeInTheDocument();
    expect(api.calls('POST /schedules')).toHaveLength(0);
  });

  it('서버 VALIDATION_FAILED는 errors[].field 칸 아래에 (08 2-6)', async () => {
    const { user } = openCreate({
      'POST /schedules': () => problem(400, 'VALIDATION_FAILED', '입력값을 확인하세요.', [{ field: 'end', message: '종료 일시는 시작 일시보다 뒤여야 합니다.' }]),
    });
    await user.type(screen.getByRole('textbox', { name: '제목' }), '팀 미팅');
    await user.click(saveButton());
    expect(await screen.findByText('종료 일시는 시작 일시보다 뒤여야 합니다.')).toBeInTheDocument();
  });

  it('입력 중 Esc → "작성을 취소할까요?" (D-037)', async () => {
    const { user } = openCreate();
    await user.type(screen.getByRole('textbox', { name: '제목' }), '팀');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('alertdialog', { name: '작성을 취소할까요?' })).toBeInTheDocument();
  });
});

describe('일정 수정·삭제 (US-05)', () => {
  const openEdit = (routes: Parameters<typeof mockApi>[0]) => {
    const api = mockApi(routes);
    const handlers = { onSaved: vi.fn(), onDeleted: vi.fn(), onClose: vi.fn() };
    const view = renderWithStore(<ScheduleFormDialog target={{ mode: 'edit', schedule: TEAM }} categories={CATEGORIES} {...handlers} />);
    return { api, ...handlers, ...view };
  };

  it('장소 이름을 바꾸면 그 필드만, 좌표는 null로 함께 (D-037, D-040)', async () => {
    const { api, user } = openEdit({ 'PATCH /schedules/:id': (req) => json(200, { ...TEAM, ...(req.body as object) }) });
    const place = screen.getByRole('textbox', { name: '장소' });
    await user.clear(place);
    await user.type(place, '회의실 B');
    await user.click(saveButton());
    await waitFor(() => expect(api.calls('PATCH /schedules/:id')).toHaveLength(1));
    expect(api.calls('PATCH /schedules/:id')[0]).toMatchObject({
      path: '/schedules/1',
      body: { location: { name: '회의실 B', latitude: null, longitude: null } },
    });
  });

  it('바꾼 것 없이 저장하면 요청 없이 닫힘', async () => {
    const { api, onSaved, user } = openEdit({});
    await user.click(saveButton());
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(TEAM));
    expect(api.all()).toHaveLength(0);
  });

  it('삭제는 두 번 눌러 확인 (삭제 → 삭제 확인)', async () => {
    const { api, onDeleted, user } = openEdit({ 'DELETE /schedules/:id': () => json(204) });
    await user.click(screen.getByRole('button', { name: '삭제' }));
    expect(api.all()).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: '삭제 확인' }));
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(1));
    expect(api.calls('DELETE /schedules/:id')[0].path).toBe('/schedules/1');
  });
});

describe('빠른 추가에서 자세히 입력 (US-10)', () => {
  it('넘겨받은 제목·시간·카테고리로 채워지고, 닫으면 확인부터 (D-037)', async () => {
    const onClose = vi.fn();
    const { user } = renderWithStore(
      <ScheduleFormDialog
        target={{ mode: 'create', baseDate: '2026-09-24', startTime: '14:00', draft: { title: '팀 미팅', endTime: '15:30', categoryId: 3 } }}
        categories={CATEGORIES}
        onClose={onClose}
      />
    );
    expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue('팀 미팅');
    expect(screen.getByLabelText('시작 날짜')).toHaveValue('2026-09-24');
    expect(screen.getByLabelText('시작 시간')).toHaveValue('14:00');
    expect(screen.getByLabelText('종료 시간')).toHaveValue('15:30');
    expect(screen.getByRole('combobox', { name: '카테고리' })).toHaveDisplayValue('업무');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('alertdialog', { name: '작성을 취소할까요?' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
