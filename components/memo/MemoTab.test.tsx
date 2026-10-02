import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Memo } from '@/types/api';
import { MEMOS } from '@/test/memoFixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setViewportWidth } from '@/test/viewport';

import MemoTab from './MemoTab';

const NOW = '2026-10-01T10:00:00';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 9, 1, 10, 0));
  setViewportWidth(390);
});
afterEach(() => vi.useRealTimers());

const mountTab = (newMemoRequestKey?: number, initialMemos: Memo[] = MEMOS) => {
  const api = mockApi({
    'GET /memos': () => json(200, initialMemos),
    'POST /memos': (req) => json(201, { id: 10, createdAt: NOW, updatedAt: NOW, ...(req.body as object) }),
    'PATCH /memos/:id': (req) => {
      const base = MEMOS.find((m) => req.path.endsWith(`/${m.id}`)) as Memo;
      return json(200, { ...base, ...(req.body as object), updatedAt: NOW });
    },
    'DELETE /memos/:id': () => json(204),
  });
  const view = renderWithStore(<MemoTab newMemoRequestKey={newMemoRequestKey} />);
  return { api, ...view };
};

const cardList = () => screen.getByRole('list', { name: '메모 목록' });
const cards = () => within(cardList()).queryAllByRole('listitem');
const cardTexts = () => cards().map((card) => card.textContent ?? '');

const swipe = (el: HTMLElement, dx: number) => {
  fireEvent.touchStart(el, { touches: [{ clientX: 300, clientY: 300 }] });
  fireEvent.touchMove(el, { touches: [{ clientX: 300 + dx, clientY: 300 }] });
  fireEvent.touchEnd(el, { changedTouches: [{ clientX: 300 + dx, clientY: 300 }] });
};

describe('모바일 일간 메모 탭 MO-14 (US-25)', () => {
  it('카드 목록은 최근 수정 순, 카드에는 날짜만 (D-029, D-057)', async () => {
    mountTab();
    await waitFor(() => expect(cards()).toHaveLength(4));
    expect(cardTexts()[0]).toContain('읽을 책 목록');
    expect(cardTexts()[0]).toContain('9/24');
    expect(cardTexts()[3]).toContain('작년 메모');
    expect(cardTexts()[3]).toContain('2025. 12/31');
  });

  it('제목 없는 메모는 내용 첫 줄을 제목 자리에 (D-055)', async () => {
    mountTab();
    await waitFor(() => expect(cards()).toHaveLength(4));
    expect(cardTexts()[2]).toContain('플래너 위젯 아이디어');
  });

  it('검색 칸이 없다 (D-030)', async () => {
    mountTab();
    await waitFor(() => expect(cards()).toHaveLength(4));
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('카드를 누르면 메모 편집(MO-15), 저장하면 탭으로 돌아와 맨 위로 (D-029, D-057)', async () => {
    const { api, user } = mountTab();
    await waitFor(() => expect(cards()).toHaveLength(4));
    await user.click(within(cardList()).getByRole('button', { name: /여행 준비물/ }));
    expect(screen.getByRole('dialog', { name: '메모' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '메모 제목' })).toHaveValue('여행 준비물');
    await user.type(screen.getByRole('textbox', { name: '메모 내용' }), ', 어댑터');
    await user.click(screen.getAllByRole('button', { name: '저장' })[0]);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.calls('PATCH /memos/:id')[0].path).toBe('/memos/2');
    expect(cardTexts()[0]).toContain('여행 준비물');
  });

  it("바깥(+ 버튼)에서 새 메모를 부르면 바로 새 메모 편집 (D-055)", async () => {
    const { rerender, store } = mountTab();
    await waitFor(() => expect(cards()).toHaveLength(4));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const { Provider } = await import('react-redux');
    rerender(
      <Provider store={store}>
        <MemoTab newMemoRequestKey={1} />
      </Provider>
    );
    expect(screen.getByRole('dialog', { name: '메모' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '메모 제목' })).toHaveValue('');
  });

  it('새 메모를 비운 채 뒤로 가면 요청 없이 버린다 (D-032)', async () => {
    const { api, user } = mountTab(1);
    await waitFor(() => expect(cards()).toHaveLength(4));
    await user.click(screen.getByRole('button', { name: '뒤로' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(api.calls('POST /memos')).toHaveLength(0);
    expect(cards()).toHaveLength(4);
  });

  it('새 메모를 저장하면 목록 맨 위에 생긴다', async () => {
    const { user } = mountTab(1);
    await waitFor(() => expect(cards()).toHaveLength(4));
    await user.type(screen.getByRole('textbox', { name: '메모 제목' }), '장보기');
    await user.click(screen.getAllByRole('button', { name: '저장' })[0]);
    await waitFor(() => expect(cards()).toHaveLength(5));
    expect(cardTexts()[0]).toContain('장보기');
  });

  it('밀어서 나온 삭제 버튼은 확인·실행 취소 없이 바로 삭제 (D-057)', async () => {
    const { api, user } = mountTab();
    await waitFor(() => expect(cards()).toHaveLength(4));
    swipe(cards()[0], -120);
    await user.click(screen.getByRole('button', { name: '삭제' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await waitFor(() => expect(api.calls('DELETE /memos/:id')).toHaveLength(1));
    await waitFor(() => expect(cards()).toHaveLength(3));
    expect(screen.queryByRole('button', { name: /실행 취소|되돌리기/ })).not.toBeInTheDocument();
  });

  it('메모가 없으면 "아직 메모가 없어요" (D-057)', async () => {
    mountTab(undefined, []);
    expect(await screen.findByText('아직 메모가 없어요')).toBeInTheDocument();
  });

  it('카드를 왼쪽으로 밀면 삭제 버튼, 누르면 삭제 (D-055, D-030)', async () => {
    const { api, user } = mountTab();
    await waitFor(() => expect(cards()).toHaveLength(4));
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
    swipe(cards()[1], -120);
    await user.click(screen.getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(cards()).toHaveLength(3));
    expect(api.calls('DELETE /memos/:id')[0].path).toBe('/memos/2');
    expect(cardTexts().join()).not.toContain('여행 준비물');
  });

  it('조금만 밀거나 오른쪽으로 밀면 삭제 버튼이 나오지 않는다', async () => {
    mountTab();
    await waitFor(() => expect(cards()).toHaveLength(4));
    swipe(cards()[1], -20);
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
    swipe(cards()[1], 120);
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
  });

  it('밀어서 나온 삭제 버튼은 다시 오른쪽으로 밀면 들어간다', async () => {
    mountTab();
    await waitFor(() => expect(cards()).toHaveLength(4));
    swipe(cards()[1], -120);
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
    swipe(cards()[1], 120);
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
  });
});
