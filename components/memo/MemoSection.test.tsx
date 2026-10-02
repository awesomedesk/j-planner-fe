import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Memo } from '@/types/api';
import { MEMOS } from '@/test/memoFixtures';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';

import { selectNotices } from '@store/slices/noticeSlice';

import MemoSection from './MemoSection';

const NOW = '2026-10-01T10:00:00';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 9, 1, 10, 0));
});
afterEach(() => vi.useRealTimers());

interface SectionServerOptions {
  /** PATCH 응답을 이 Promise가 풀릴 때까지 늦춘다 (요청마다 한 번씩 꺼내 쓴다) */
  patchGates?: Promise<void>[];
  /** true를 돌려주면 PATCH가 500 */
  shouldPatchFail?: () => boolean;
  /** true를 돌려주면 DELETE가 500 */
  shouldDeleteFail?: () => boolean;
}

/** 밖에서 풀어 주는 Promise */
const deferred = () => {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((done) => (resolve = done));
  return { promise, resolve };
};

const mountSection = (
  initialMemos: Memo[] = MEMOS,
  { patchGates = [], shouldPatchFail = () => false, shouldDeleteFail = () => false }: SectionServerOptions = {}
) => {
  let serverMemos: Memo[] = [...initialMemos];
  const idOf = (path: string) => Number(path.split('/').pop());
  const api = mockApi({
    'GET /memos': () => json(200, serverMemos),
    'PATCH /memos/:id': async (req) => {
      const gate = patchGates.shift();
      if (gate) await gate;
      if (shouldPatchFail()) return problem(500, 'INTERNAL_ERROR', '서버 오류');
      const base = serverMemos.find((m) => m.id === idOf(req.path)) as Memo;
      const updated = { ...base, ...(req.body as object), updatedAt: NOW };
      serverMemos = serverMemos.map((m) => (m.id === updated.id ? updated : m));
      return json(200, updated);
    },
    'DELETE /memos/:id': (req) => {
      if (shouldDeleteFail()) return problem(500, 'INTERNAL_ERROR', '서버 오류');
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
    expect(await screen.findByRole('button', { name: '메모 4개 모두 보기' })).toBeInTheDocument();
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

  it('바꾼 것이 없으면 접어도 요청을 보내지 않는다 (D-057)', async () => {
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
    expect(await screen.findByRole('button', { name: '메모 3개 모두 보기' })).toBeInTheDocument();
    expect(sectionList()).not.toHaveTextContent('여행 준비물');
  });

  it('메모가 없으면 "아직 메모가 없어요" (D-057)', async () => {
    mountSection([]);
    expect(await screen.findByText('아직 메모가 없어요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '메모 0개 모두 보기' })).toBeInTheDocument();
  });

  it("'n개'를 누르면 메모 창(OV-06)이 열린다 (D-055)", async () => {
    const { user } = mountSection();
    await user.click(await screen.findByRole('button', { name: '메모 4개 모두 보기' }));
    expect(screen.getByRole('dialog', { name: '메모' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('textbox', { name: '메모 제목' })).toHaveValue('읽을 책 목록'));
  });

  it('+를 누르면 메모 창에서 새 메모 (D-055)', async () => {
    const { user } = mountSection();
    await screen.findByRole('button', { name: '메모 4개 모두 보기' });
    await user.click(screen.getByRole('button', { name: '새 메모' }));
    expect(screen.getByRole('dialog', { name: '메모' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '메모 제목' })).toHaveValue('');
  });

  it('메모 창에서 저장하면 섹션 개수도 바뀐다 (D-055)', async () => {
    const { user } = mountSection();
    await screen.findByRole('button', { name: '메모 4개 모두 보기' });
    await user.click(screen.getByRole('button', { name: '새 메모' }));
    const dialog = screen.getByRole('dialog', { name: '메모' });
    await user.type(within(dialog).getByRole('textbox', { name: '메모 제목' }), '장보기');
    await user.click(within(dialog).getAllByRole('button', { name: '저장' })[0]);
    expect(await screen.findByRole('button', { name: '메모 5개 모두 보기' })).toBeInTheDocument();
  });
});

describe('사이드바 펼친 메모 자리 수정 보완 (US-25, D-058)', () => {
  const titleBox = () => within(sectionList()).getByRole('textbox', { name: '메모 제목' });

  it('저장은 한 줄로: 앞 저장 응답이 오기 전에는 다음 저장을 보내지 않고, 마지막 값만 남는다 (D-058)', async () => {
    const first = deferred();
    const { api, user } = mountSection(MEMOS, { patchGates: [first.promise] });
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[2]);
    await user.type(titleBox(), '1');
    await user.click(document.body);
    await waitFor(() => expect(api.calls('PATCH /memos/:id')).toHaveLength(1));
    await user.type(titleBox(), '2');
    await user.click(document.body);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(api.calls('PATCH /memos/:id')).toHaveLength(1);
    first.resolve();
    await waitFor(() => expect(api.calls('PATCH /memos/:id')).toHaveLength(2));
    expect(api.calls('PATCH /memos/:id')[0].body).toEqual({ title: '여행 준비물1' });
    expect(api.calls('PATCH /memos/:id')[1].body).toEqual({ title: '여행 준비물12' });
    // 늦게 온 옛 응답이 저장 기준을 덮지 않았으면 접어도 더 보낼 것이 없다
    await user.click(items()[2]);
    await waitFor(() => expect(items()[2]).toHaveAttribute('aria-expanded', 'false'));
    expect(api.calls('PATCH /memos/:id')).toHaveLength(2);
    expect(items()[2]).toHaveTextContent('여행 준비물12');
  });

  it('삭제는 진행 중인 저장이 끝난 뒤 보내고, 지운 메모는 다시 나타나지 않는다 (D-058)', async () => {
    const first = deferred();
    const { api, user } = mountSection(MEMOS, { patchGates: [first.promise] });
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[2]);
    await user.type(titleBox(), '!');
    await user.click(document.body);
    await waitFor(() => expect(api.calls('PATCH /memos/:id')).toHaveLength(1));
    await user.clear(titleBox());
    await user.clear(within(sectionList()).getByRole('textbox', { name: '메모 내용' }));
    await user.click(items()[2]);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(api.calls('DELETE /memos/:id')).toHaveLength(0);
    first.resolve();
    await waitFor(() => expect(api.calls('DELETE /memos/:id')).toHaveLength(1));
    expect(await screen.findByRole('button', { name: '메모 3개 모두 보기' })).toBeInTheDocument();
    expect(sectionList()).not.toHaveTextContent('여행 준비물');
  });

  it("펼쳐 고치던 중 'n개'를 누르면 먼저 저장하고 접은 뒤 메모 창을 연다 (D-058)", async () => {
    const first = deferred();
    const { api, user } = mountSection(MEMOS, { patchGates: [first.promise] });
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[2]);
    await user.type(titleBox(), '!');
    await user.click(screen.getByRole('button', { name: '메모 4개 모두 보기' }));
    await waitFor(() => expect(api.calls('PATCH /memos/:id')).toHaveLength(1));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    first.resolve();
    expect(await screen.findByRole('dialog', { name: '메모' })).toBeInTheDocument();
    expect(items()[2]).toHaveAttribute('aria-expanded', 'false');
    expect(api.calls('PATCH /memos/:id')[0].body).toEqual({ title: '여행 준비물!' });
  });

  it('+로 메모 창을 열 때도 펼친 메모를 먼저 저장하고 접는다 (D-058)', async () => {
    const { api, user } = mountSection();
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[2]);
    await user.type(titleBox(), '!');
    await user.click(screen.getByRole('button', { name: '새 메모' }));
    expect(await screen.findByRole('dialog', { name: '메모' })).toBeInTheDocument();
    expect(api.calls('PATCH /memos/:id')).toHaveLength(1);
    expect(items()[2]).toHaveAttribute('aria-expanded', 'false');
  });

  it('메모 창에서 고친 뒤 다시 펼치면 최신 내용으로 시작한다 (D-058)', async () => {
    const { user } = mountSection();
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[2]);
    await user.click(items()[2]);
    await user.click(screen.getByRole('button', { name: '메모 4개 모두 보기' }));
    const dialog = await screen.findByRole('dialog', { name: '메모' });
    await user.click(within(within(dialog).getByRole('list', { name: '메모 목록' })).getByText('여행 준비물'));
    const dialogTitle = within(dialog).getByRole('textbox', { name: '메모 제목' });
    await user.clear(dialogTitle);
    await user.type(dialogTitle, '짐 목록');
    await user.click(within(dialog).getAllByRole('button', { name: '저장' })[0]);
    await waitFor(() => expect(within(dialog).getByText('짐 목록')).toBeInTheDocument());
    await user.click(within(dialog).getAllByRole('button', { name: '닫기' })[0]);
    await waitFor(() => expect(items()[2]).toHaveTextContent('짐 목록'));
    await user.click(items()[2]);
    expect(titleBox()).toHaveValue('짐 목록');
  });

  it("자동 저장이 실패하면 펼친 채 내용을 남기고 '저장 못 했어요', 접을 때 다시 시도 (D-058)", async () => {
    let failing = true;
    const { api, user } = mountSection(MEMOS, { shouldPatchFail: () => failing });
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[2]);
    await user.type(titleBox(), '!');
    await user.click(items()[2]);
    expect(await screen.findByText('저장 못 했어요')).toBeInTheDocument();
    expect(items()[2]).toHaveAttribute('aria-expanded', 'true');
    expect(titleBox()).toHaveValue('여행 준비물!');

    // 또 실패하면 그대로 펼친 채
    await user.click(items()[2]);
    await waitFor(() => expect(api.calls('PATCH /memos/:id').length).toBeGreaterThanOrEqual(2));
    expect(items()[2]).toHaveAttribute('aria-expanded', 'true');

    failing = false;
    const before = api.calls('PATCH /memos/:id').length;
    await user.click(items()[2]);
    await waitFor(() => expect(items()[2]).toHaveAttribute('aria-expanded', 'false'));
    expect(api.calls('PATCH /memos/:id').length).toBe(before + 1);
    expect(screen.queryByText('저장 못 했어요')).not.toBeInTheDocument();
  });

  it('저장에 실패한 뒤 다시 입력하면 1초 뒤 다시 저장한다 (D-058)', async () => {
    let failing = true;
    const { api, user } = mountSection(MEMOS, { shouldPatchFail: () => failing });
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[2]);
    await user.type(titleBox(), '!');
    await user.click(document.body);
    expect(await screen.findByText('저장 못 했어요')).toBeInTheDocument();
    failing = false;
    await user.type(titleBox(), '?');
    await waitFor(() => expect(screen.queryByText('저장 못 했어요')).not.toBeInTheDocument(), { timeout: 2500 });
    expect(api.calls('PATCH /memos/:id').at(-1)?.body).toEqual({ title: '여행 준비물!?' });
  });

  it('모두 비운 채 사이드바가 사라지면 접은 것과 같이 삭제한다 (D-058)', async () => {
    const { api, user, unmount } = mountSection();
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[2]);
    await user.clear(titleBox());
    await user.clear(within(sectionList()).getByRole('textbox', { name: '메모 내용' }));
    unmount();
    await waitFor(() => expect(api.calls('DELETE /memos/:id')).toHaveLength(1));
    expect(api.calls('DELETE /memos/:id')[0].path).toBe('/memos/2');
  });

  it('고친 채 사이드바가 사라지면 남은 변경을 저장한다 (D-057, D-058)', async () => {
    const { api, user, unmount } = mountSection();
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[2]);
    fireEvent.change(titleBox(), { target: { value: '여행 준비물!' } });
    unmount();
    await waitFor(() => expect(api.calls('PATCH /memos/:id')).toHaveLength(1));
    expect(api.calls('PATCH /memos/:id')[0].body).toEqual({ title: '여행 준비물!' });
  });

  it("사이드바가 사라질 때 저장에 실패하면 화면 아래 안내 '저장 못 했어요' (D-058)", async () => {
    const { api, user, unmount, store } = mountSection(MEMOS, { shouldPatchFail: () => true });
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[2]);
    fireEvent.change(titleBox(), { target: { value: '여행 준비물!' } });
    unmount();
    await waitFor(() => expect(api.calls('PATCH /memos/:id')).toHaveLength(1));
    await waitFor(() => expect(selectNotices(store.getState()).map((notice) => notice.message)).toContain('저장 못 했어요'));
  });

  it("사이드바가 사라질 때 비운 메모 삭제에 실패하면 화면 아래 안내 '지우지 못했어요' (D-058)", async () => {
    const { api, user, unmount, store } = mountSection(MEMOS, { shouldDeleteFail: () => true });
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[2]);
    await user.clear(titleBox());
    await user.clear(within(sectionList()).getByRole('textbox', { name: '메모 내용' }));
    unmount();
    await waitFor(() => expect(api.calls('DELETE /memos/:id')).toHaveLength(1));
    await waitFor(() => expect(selectNotices(store.getState()).map((notice) => notice.message)).toContain('지우지 못했어요'));
  });

  it('펼친 채 저장에 실패하면 칸 안 한 줄만, 화면 아래 안내는 없다 (D-058)', async () => {
    const { user, store } = mountSection(MEMOS, { shouldPatchFail: () => true });
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[2]);
    await user.type(titleBox(), '!');
    await user.click(items()[2]);
    expect(await screen.findByText('저장 못 했어요')).toBeInTheDocument();
    expect(selectNotices(store.getState())).toHaveLength(0);
  });
});
