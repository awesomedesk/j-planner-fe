import { describe, expect, it } from 'vitest';

import { BOOKS, LAST_YEAR, MEMOS, TRAVEL, UNTITLED, memo } from '@/test/memoFixtures';

import {
  MEMO_TITLE_MAX_LENGTH,
  formatMemoDate,
  getMemoHeading,
  getMemoPreview,
  isMemoEmpty,
  isMemoFormChanged,
  memoToFormValues,
  pickEarliestCreatedMemos,
  sortMemosByRecentUpdate,
  toMemoCreateRequest,
  toMemoUpdateRequest,
} from './memoUtils';

describe('메모 규칙 (US-25)', () => {
  it('제목은 255자까지 (08-api-design 8절)', () => {
    expect(MEMO_TITLE_MAX_LENGTH).toBe(255);
  });

  it('제목·내용이 모두 비면(공백만 포함) 빈 메모 (US-25 AC, D-032)', () => {
    expect(isMemoEmpty({ title: '', content: '' })).toBe(true);
    expect(isMemoEmpty({ title: '   ', content: ' \n\t ' })).toBe(true);
    expect(isMemoEmpty({ title: '제목', content: '' })).toBe(false);
    expect(isMemoEmpty({ title: '', content: '내용' })).toBe(false);
  });

  it('보낼 때 제목은 앞뒤 공백을 지우고 비면 null, 내용은 그대로 두되 공백뿐이면 null (D-047)', () => {
    expect(toMemoCreateRequest({ title: '  장보기  ', content: '  우유\n' })).toEqual({ title: '장보기', content: '  우유\n' });
    expect(toMemoCreateRequest({ title: '   ', content: '내용' })).toEqual({ title: null, content: '내용' });
    expect(toMemoCreateRequest({ title: '제목', content: ' \n ' })).toEqual({ title: '제목', content: null });
  });

  it('수정은 바뀐 칸만 보낸다 (Merge Patch)', () => {
    expect(toMemoUpdateRequest(BOOKS, { title: '읽을 책', content: BOOKS.content ?? '' })).toEqual({ title: '읽을 책' });
    expect(toMemoUpdateRequest(BOOKS, { title: '읽을 책 목록', content: '- 데미안' })).toEqual({ content: '- 데미안' });
    expect(toMemoUpdateRequest(BOOKS, { title: ' 읽을 책 목록 ', content: BOOKS.content ?? '' })).toEqual({});
    expect(toMemoUpdateRequest(LAST_YEAR, { title: '', content: '새 내용' })).toEqual({ title: null, content: '새 내용' });
  });

  it('메모를 입력 값으로 (null → 빈 칸)', () => {
    expect(memoToFormValues(UNTITLED)).toEqual({ title: '', content: '플래너 위젯 아이디어\n주간 회고 템플릿' });
    expect(memoToFormValues(null)).toEqual({ title: '', content: '' });
  });

  it('바뀐 것이 있는지 (D-037 확인용)', () => {
    expect(isMemoFormChanged({ title: '', content: '' }, { title: '', content: '' })).toBe(false);
    expect(isMemoFormChanged({ title: '', content: '' }, { title: 'a', content: '' })).toBe(true);
  });
});

describe('메모 목록 순서', () => {
  it('메모 창·탭 목록은 최근 수정 순, 같으면 id 큰 것 먼저 (D-029)', () => {
    const same = memo({ id: 9, updatedAt: TRAVEL.updatedAt });
    expect(sortMemosByRecentUpdate([LAST_YEAR, TRAVEL, BOOKS, same, UNTITLED]).map((m) => m.id)).toEqual([1, 9, 2, 3, 4]);
  });

  it('사이드바는 만든 날 기준 가장 먼저 만든 3개 — 고쳐도 자리 그대로 (D-055)', () => {
    expect(pickEarliestCreatedMemos(MEMOS).map((m) => m.id)).toEqual([4, 3, 2]);
    const edited = { ...LAST_YEAR, updatedAt: '2026-10-01T09:00:00' };
    expect(pickEarliestCreatedMemos([edited, BOOKS, TRAVEL, UNTITLED]).map((m) => m.id)).toEqual([4, 3, 2]);
    expect(pickEarliestCreatedMemos([BOOKS])).toEqual([BOOKS]);
  });
});

describe('메모 표시', () => {
  it('제목 없는 메모는 내용 첫 줄을 제목 자리에 (D-055)', () => {
    expect(getMemoHeading(BOOKS)).toBe('읽을 책 목록');
    expect(getMemoHeading(UNTITLED)).toBe('플래너 위젯 아이디어');
    expect(getMemoHeading(memo({ id: 5, title: null, content: '\n  첫 줄  \n둘째 줄' }))).toBe('첫 줄');
  });

  it('미리보기: 내용을 한 줄로. 첫 줄을 제목으로 썼으면 그 다음부터', () => {
    expect(getMemoPreview(BOOKS)).toBe('- 데미안 - 코스모스');
    expect(getMemoPreview(UNTITLED)).toBe('주간 회고 템플릿');
    expect(getMemoPreview(LAST_YEAR)).toBe('');
  });

  it("수정일은 'M/D', 올해가 아니면 'YYYY. M/D' (확인 부탁)", () => {
    const now = new Date(2026, 9, 1);
    expect(formatMemoDate(BOOKS.updatedAt, now)).toBe('9/24');
    expect(formatMemoDate(LAST_YEAR.updatedAt, now)).toBe('2025. 12/31');
  });
});

describe('사이드바 펼친 내용 (D-055)', () => {
  it('제목이 있으면 내용 전체, 제목 없으면 첫 줄(제목 자리) 다음부터', async () => {
    const { getMemoBody } = await import('./memoUtils');
    expect(getMemoBody(BOOKS)).toBe('- 데미안\n- 코스모스');
    expect(getMemoBody(UNTITLED)).toBe('주간 회고 템플릿');
    expect(getMemoBody(LAST_YEAR)).toBe('');
  });
});
