import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Dday } from '@/types/api';
import { ddayFixture } from '@/test/ddayFixtures';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setViewportWidth } from '@/test/viewport';

import DdayFormDialog from './DdayFormDialog';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 10, 26, 10, 0));
  setViewportWidth(1440);
});
afterEach(() => vi.useRealTimers());

const COUNTUP = ddayFixture({
  id: 5,
  title: '만난 날',
  targetDate: '2026-07-01',
  countType: 'COUNTUP',
  display: { interval: { enabled: true, days: 50 }, lastDays: { enabled: false, days: 7 }, daily: false, yearly: true },
  today: { value: 149, label: 'D+149' },
});

const mount = (target: { mode: 'create'; baseDate: string } | { mode: 'edit'; dday: Dday }, routes = {}) => {
  const api = mockApi({
    'POST /ddays': (req) => json(201, ddayFixture({ id: 30, ...(req.body as object) })),
    'PATCH /ddays/:id': (req) => json(200, { ...(target.mode === 'edit' ? target.dday : {}), ...(req.body as object) }),
    'DELETE /ddays/:id': () => json(204),
    ...routes,
  });
  const onClose = vi.fn();
  const onSaved = vi.fn();
  const onDeleted = vi.fn();
  const view = renderWithStore(<DdayFormDialog target={target} onClose={onClose} onSaved={onSaved} onDeleted={onDeleted} />);
  return { api, onClose, onSaved, onDeleted, ...view };
};

const dialog = () => screen.getByRole('dialog', { name: /D-Day/ });
/** jsdom은 Tailwind를 적용하지 않아 모바일 머리 '저장'과 아래 줄 '저장'이 함께 있다 */
const saveButton = () => within(dialog()).getAllByRole('button', { name: '저장' })[0];

describe('D-Day 입력 창 (US-22, 06 D-Day 입력 창 · D-012 · D-020)', () => {
  it('새로 만들 때: 제목 → 날짜(기준 날짜) → 세는 방법(남은 날 기본) → 달력 표시(목표 날짜만)', () => {
    mount({ mode: 'create', baseDate: '2026-11-20' });
    expect(dialog()).toHaveAccessibleName('D-Day 추가');
    expect(screen.getByRole('textbox', { name: '제목' })).toHaveFocus();
    expect(screen.getByLabelText('날짜')).toHaveValue('2026-11-20');
    expect(screen.getByRole('radio', { name: '남은 날 세기 (당일 D-Day)' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '지난 날 세기 (당일 1일)' })).not.toBeChecked();
    expect(screen.getByText('D-3 → D-Day → D+2')).toBeInTheDocument();
    expect(screen.getByText('1일 → 100일 → 1주년')).toBeInTheDocument();

    const target = screen.getByRole('checkbox', { name: '목표 날짜' });
    expect(target).toBeChecked();
    expect(target).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'N일 단위' })).not.toBeChecked();
    expect(screen.getByRole('spinbutton', { name: 'N일 단위 일 수' })).toBeDisabled();
    expect(screen.getByRole('spinbutton', { name: 'N일 단위 일 수' })).toHaveValue(100);
    expect(screen.getByRole('checkbox', { name: '마지막 N일은 매일' })).not.toBeChecked();
    expect(screen.getByRole('spinbutton', { name: '마지막 N일 일 수' })).toHaveValue(7);
    expect(screen.getByRole('checkbox', { name: '매일' })).not.toBeChecked();
    // 지난 날만의 옵션은 숨긴다
    expect(screen.queryByRole('checkbox', { name: '매년' })).not.toBeInTheDocument();
  });

  it('지난 날로 바꾸면 100일 단위 + 매년이 켜지고, 남은 날 옵션은 숨는다 (D-020)', async () => {
    const { user } = mount({ mode: 'create', baseDate: '2026-11-20' });
    await user.click(screen.getByRole('radio', { name: '지난 날 세기 (당일 1일)' }));
    expect(screen.getByRole('checkbox', { name: 'N일 단위' })).toBeChecked();
    expect(screen.getByRole('spinbutton', { name: 'N일 단위 일 수' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: '매년' })).toBeChecked();
    expect(screen.queryByRole('checkbox', { name: '매일' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: '마지막 N일은 매일' })).not.toBeInTheDocument();
  });

  it('저장: POST /ddays 후 onSaved (그 기준의 옵션만 보냄)', async () => {
    const { user, api, onSaved } = mount({ mode: 'create', baseDate: '2026-11-20' });
    await user.type(screen.getByRole('textbox', { name: '제목' }), ' 기말 시험 ');
    await user.click(screen.getByRole('checkbox', { name: '마지막 N일은 매일' }));
    await user.click(saveButton());
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.calls('POST /ddays')[0].body).toEqual({
      title: '기말 시험',
      targetDate: '2026-11-20',
      countType: 'COUNTDOWN',
      display: { interval: { enabled: false }, lastDays: { enabled: true, days: 7 }, daily: false },
    });
  });

  it('빈 제목·잘못된 N: 저장하지 않고 칸 아래 오류, 첫 오류 칸에 초점', async () => {
    const { user, api } = mount({ mode: 'create', baseDate: '2026-11-20' });
    await user.click(screen.getByRole('checkbox', { name: 'N일 단위' }));
    await user.clear(screen.getByRole('spinbutton', { name: 'N일 단위 일 수' }));
    await user.click(saveButton());
    expect(screen.getByText('제목을 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByText('1 이상의 숫자를 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '제목' })).toHaveFocus();
    expect(api.calls('POST /ddays')).toHaveLength(0);

    await user.type(screen.getByRole('textbox', { name: '제목' }), '시험');
    await user.click(saveButton());
    expect(screen.getByRole('spinbutton', { name: 'N일 단위 일 수' })).toHaveFocus();
  });

  it('저장 실패: 입력을 그대로 두고 창 안에 오류 (D-079)', async () => {
    const { user, onSaved } = mount({ mode: 'create', baseDate: '2026-11-20' }, { 'POST /ddays': () => problem(500, 'INTERNAL_ERROR', '잠시 후 다시 시도해 주세요.') });
    await user.type(screen.getByRole('textbox', { name: '제목' }), '시험');
    await user.click(saveButton());
    expect(await within(dialog()).findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue('시험');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('수정: 제목 "D-Day 수정", 값이 채워지고, 기준을 바꾸면 N일 단위 값은 유지 + 새 옵션은 꺼짐', async () => {
    const { user, api, onSaved } = mount({ mode: 'edit', dday: COUNTUP });
    expect(dialog()).toHaveAccessibleName('D-Day 수정');
    expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue('만난 날');
    expect(screen.getByRole('radio', { name: '지난 날 세기 (당일 1일)' })).toBeChecked();
    expect(screen.getByRole('spinbutton', { name: 'N일 단위 일 수' })).toHaveValue(50);

    await user.click(screen.getByRole('radio', { name: '남은 날 세기 (당일 D-Day)' }));
    expect(screen.getByRole('checkbox', { name: 'N일 단위' })).toBeChecked();
    expect(screen.getByRole('spinbutton', { name: 'N일 단위 일 수' })).toHaveValue(50);
    expect(screen.getByRole('checkbox', { name: '매일' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: '마지막 N일은 매일' })).not.toBeChecked();

    await user.click(saveButton());
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.calls('PATCH /ddays/:id')[0]).toMatchObject({
      path: '/ddays/5',
      body: { countType: 'COUNTDOWN', display: { interval: { enabled: true, days: 50 }, lastDays: { enabled: false }, daily: false, yearly: false } },
    });
  });

  it('삭제: 확인 창(취소에 초점) → 취소하면 그대로, 삭제하면 DELETE 후 onDeleted', async () => {
    const { user, api, onDeleted } = mount({ mode: 'edit', dday: COUNTUP });
    await user.click(within(dialog()).getByRole('button', { name: '삭제' }));
    const confirm = screen.getByRole('alertdialog', { name: '이 D-Day를 지울까요?' });
    expect(confirm).toHaveAccessibleDescription('달력 표시도 함께 사라져요.');
    expect(within(confirm).getByRole('button', { name: '취소' })).toHaveFocus();
    await user.click(within(confirm).getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(api.calls('DELETE /ddays/:id')).toHaveLength(0);

    await user.click(within(dialog()).getByRole('button', { name: '삭제' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(5));
    expect(api.calls('DELETE /ddays/:id')[0].path).toBe('/ddays/5');
  });

  it('삭제 확인 창에서 Esc는 확인만 닫는다 (입력 창은 그대로)', async () => {
    const { user, onClose } = mount({ mode: 'edit', dday: COUNTUP });
    await user.click(within(dialog()).getByRole('button', { name: '삭제' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(dialog()).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('바뀐 내용이 있으면 닫을 때 "작성을 취소할까요?" (D-037)', async () => {
    const { user, onClose } = mount({ mode: 'create', baseDate: '2026-11-20' });
    await user.type(screen.getByRole('textbox', { name: '제목' }), '시험');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('alertdialog', { name: '작성을 취소할까요?' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('바뀐 내용이 없으면 Esc로 바로 닫는다', async () => {
    const { user, onClose } = mount({ mode: 'create', baseDate: '2026-11-20' });
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('창을 닫으면 연 버튼으로 초점을 돌린다', async () => {
    const opener = document.createElement('button');
    opener.textContent = '여는 버튼';
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = mount({ mode: 'create', baseDate: '2026-11-20' });
    expect(screen.getByRole('textbox', { name: '제목' })).toHaveFocus();
    unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });
});

describe('D-Day 입력 창 모바일 (600px 미만, 전체 화면)', () => {
  beforeEach(() => setViewportWidth(390));

  it('수정 모드는 본문 아래 "D-Day 삭제"도 같은 확인을 거친다 (D-030)', async () => {
    const { user } = mount({ mode: 'edit', dday: COUNTUP });
    await user.click(screen.getByRole('button', { name: 'D-Day 삭제' }));
    expect(screen.getByRole('alertdialog', { name: '이 D-Day를 지울까요?' })).toBeInTheDocument();
  });
});
