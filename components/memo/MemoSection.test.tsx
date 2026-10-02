import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Memo } from '@/types/api';
import { MEMOS } from '@/test/memoFixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';

import MemoSection from './MemoSection';

const NOW = '2026-10-01T10:00:00';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 9, 1, 10, 0));
});
afterEach(() => vi.useRealTimers());

const mountSection = (initialMemos: Memo[] = MEMOS) => {
  let serverMemos: Memo[] = [...initialMemos];
  const idOf = (path: string) => Number(path.split('/').pop());
  const api = mockApi({
    'GET /memos': () => json(200, serverMemos),
    'PATCH /memos/:id': (req) => {
      const base = serverMemos.find((m) => m.id === idOf(req.path)) as Memo;
      const updated = { ...base, ...(req.body as object), updatedAt: NOW };
      serverMemos = serverMemos.map((m) => (m.id === updated.id ? updated : m));
      return json(200, updated);
    },
    'DELETE /memos/:id': (req) => {
      serverMemos = serverMemos.filter((m) => m.id !== idOf(req.path));
      return json(204);
    },
    'POST /memos': (req) => {
      const created = { id: 10, createdAt: NOW, updatedAt: NOW, ...(req.body as object) } as Memo;
      serverMemos = [created, ...serverMemos];
      return json(201, created);
    },
  });
  const view = renderWithStore(<MemoSection />);
  return { api, ...view };
};

const sectionList = () => screen.getByRole('list', { name: '사이드바 메모' });
const items = () => within(sectionList()).getAllByRole('button');

describe('PC 사이드바 메모 섹션 (US-25, D-055)', () => {
  it("머리 오른쪽에 'n개'(전체 개수)와 + 버튼 (D-055)", async () => {
    mountSection();
    expect(await screen.findByRole('button', { name: '4개' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '새 메모' })).toBeInTheDocument();
  });

  it('가장 먼저 만든 메모 3개를 만든 순서대로 (D-055)', async () => {
    mountSection();
    await waitFor(() => expect(items()).toHaveLength(3));
    expect(items()[0]).toHaveTextContent('작년 메모');
    expect(items()[1]).toHaveTextContent('플래너 위젯 아이디어');
    expect(items()[2]).toHaveTextContent('여행 준비물');
  });

  it('항목을 누르면 사이드바 안에서 펼쳐 제목·내용 칸, 다시 누르면 접힘 (D-055, D-057)', async () => {
    const { user } = mountSection();
    await waitFor(() => expect(items()).toHaveLength(3));
    const travel = items()[2];
    expect(travel).toHaveAttribute('aria-expanded', 'false');
    expect(within(sectionList()).queryByRole('textbox')).not.toBeInTheDocument();
    await user.click(travel);
    expect(travel).toHaveAttribute('aria-expanded', 'true');
    expect(within(sectionList()).getByRole('textbox', { name: '메모 제목' })).toHaveValue('여행 준비물');
    expect(within(sectionList()).getByRole('textbox', { name: '메모 내용' })).toHaveValue('여권, 충전기');
    await user.click(travel);
    expect(travel).toHaveAttribute('aria-expanded', 'false');
    expect(within(sectionList()).queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('제목 없는 메모를 펼치면 제목 칸은 비고 내용 전체 (D-057)', async () => {
    const { user } = mountSection();
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[1]);
    expect(within(sectionList()).getByRole('textbox', { name: '메모 제목' })).toHaveValue('');
    expect(within(sectionList()).getByRole('textbox', { name: '메모 내용' })).toHaveValue('플래너 위젯 아이디어\n주간 회고 템플릿');
  });

  it('펼친 자리 자동 저장: 입력을 1초 멈추면 바뀐 칸만 PATCH (D-057)', async () => {
    const { api, user } = mountSection();
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[2]);
    await user.type(within(sectionList()).getByRole('textbox', { name: '메모 내용' }), ', 어댑터');
    expect(api.calls('PATCH /memos/:id')).toHaveLength(0);
    await waitFor(() => expect(api.calls('PATCH /memos/:id')).toHaveLength(1), { timeout: 2500 });
    expect(api.calls('PATCH /memos/:id')[0].path).toBe('/memos/2');
    expect(api.calls('PATCH /memos/:id')[0].body).toEqual({ content: '여권, 충전기, 어댑터' });
  });

  it('접으면 1초를 기다리지 않고 바로 저장, 한 번만 (D-057)', async () => {
    const { api, user } = mountSection();
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[2]);
    await user.type(within(sectionList()).getByRole('textbox', { name: '메모 제목' }), '!');
    await user.click(items()[2]);
    await waitFor(() => expect(api.calls('PATCH /memos/:id')).toHaveLength(1));
    expect(api.calls('PATCH /memos/:id')[0].body).toEqual({ title: '여행 준비물!' });
    await new Promise((resolve) => setTimeout(resolve, 1300));
    expect(api.calls('PATCH /memos/:id')).toHaveLength(1);
  });

  it('다른 곳을 누르면 저장 (D-057)', async () => {
    const { api, user } = mountSection();
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[2]);
    await user.type(within(sectionList()).getByRole('textbox', { name: '메모 제목' }), '!');
    await user.click(document.body);
    await waitFor(() => expect(api.calls('PATCH /memos/:id')).toHaveLength(1));
    expect(api.calls('PATCH /memos/:id')[0].body).toEqual({ title: '여행 준비물!' });
  });

  it('바꾼 것이 없으면 접어도 요청을 보내지 않는다', async () => {
    const { api, user } = mountSection();
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[2]);
    await user.click(items()[2]);
    expect(api.calls('PATCH /memos/:id')).toHaveLength(0);
    expect(api.calls('DELETE /memos/:id')).toHaveLength(0);
  });

  it('제목·내용을 모두 비운 동안은 자동 저장하지 않고, 그대로 접으면 확인 없이 삭제 (D-057)', async () => {
    const { api, user } = mountSection();
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[2]);
    await user.clear(within(sectionList()).getByRole('textbox', { name: '메모 제목' }));
    await user.clear(within(sectionList()).getByRole('textbox', { name: '메모 내용' }));
    await new Promise((resolve) => setTimeout(resolve, 1300));
    expect(api.calls('PATCH /memos/:id')).toHaveLength(0);
    await user.click(items()[2]);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await waitFor(() => expect(api.calls('DELETE /memos/:id')).toHaveLength(1));
    expect(api.calls('DELETE /memos/:id')[0].path).toBe('/memos/2');
    expect(await screen.findByRole('button', { name: '3개' })).toBeInTheDocument();
    expect(sectionList()).not.toHaveTextContent('여행 준비물');
  });

  it('메모가 없으면 "아직 메모가 없어요" (D-057)', async () => {
    mountSection([]);
    expect(await screen.findByText('아직 메모가 없어요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '0개' })).toBeInTheDocument();
  });

  it("'n개'를 누르면 메모 창(OV-06)이 열린다 (D-055)", async () => {
    const { user } = mountSection();
    await user.click(await screen.findByRole('button', { name: '4개' }));
    expect(screen.getByRole('dialog', { name: '메모' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('textbox', { name: '메모 제목' })).toHaveValue('읽을 책 목록'));
  });

  it('+를 누르면 메모 창에서 새 메모 (D-055)', async () => {
    const { user } = mountSection();
    await screen.findByRole('button', { name: '4개' });
    await user.click(screen.getByRole('button', { name: '새 메모' }));
    expect(screen.getByRole('dialog', { name: '메모' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '메모 제목' })).toHaveValue('');
  });

  it('메모 창에서 저장하면 섹션 개수도 바뀐다', async () => {
    const { user } = mountSection();
    await screen.findByRole('button', { name: '4개' });
    await user.click(screen.getByRole('button', { name: '새 메모' }));
    const dialog = screen.getByRole('dialog', { name: '메모' });
    await user.type(within(dialog).getByRole('textbox', { name: '메모 제목' }), '장보기');
    await user.click(within(dialog).getAllByRole('button', { name: '저장' })[0]);
    expect(await screen.findByRole('button', { name: '5개' })).toBeInTheDocument();
  });
});
