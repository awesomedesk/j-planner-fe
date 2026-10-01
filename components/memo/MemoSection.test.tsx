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

const mountSection = () => {
  let serverMemos: Memo[] = [...MEMOS];
  const api = mockApi({
    'GET /memos': () => json(200, serverMemos),
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

  it('항목을 누르면 사이드바 안에서 펼쳐 내용 전체, 다시 누르면 접힘 (D-055)', async () => {
    const { user } = mountSection();
    await waitFor(() => expect(items()).toHaveLength(3));
    const travel = items()[2];
    expect(travel).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('여권, 충전기')).not.toBeInTheDocument();
    await user.click(travel);
    expect(travel).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('여권, 충전기')).toBeInTheDocument();
    await user.click(travel);
    expect(travel).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('여권, 충전기')).not.toBeInTheDocument();
  });

  it('제목 없는 메모를 펼치면 첫 줄 다음 내용이 보인다 (D-055)', async () => {
    const { user } = mountSection();
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[1]);
    expect(screen.getByText('주간 회고 템플릿')).toBeInTheDocument();
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
