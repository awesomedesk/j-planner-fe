import { format, parseISO } from 'date-fns';

import type { LocalDateTime, Memo, MemoRequest } from '@/types/api';

/** 제목 최대 길이 (08-api-design 8절, 넘으면 400) */
export const MEMO_TITLE_MAX_LENGTH = 255;

/** 제목 글자 수 'n/255'를 보이기 시작하는 길이 (D-057) */
export const MEMO_TITLE_COUNTER_FROM = 230;

/** 빈 목록 안내 (D-057) */
export const EMPTY_MEMO_MESSAGE = '아직 메모가 없어요';

/** 사이드바 펼친 메모 자동 저장: 입력이 이만큼 멈추면 저장 (D-057) */
export const MEMO_AUTOSAVE_DELAY_MS = 1000;

/** PC 사이드바 메모 섹션에 보이는 개수 (D-055) */
export const SIDEBAR_MEMO_COUNT = 3;

/** 메모 입력 칸 값 (빈 칸 = '') */
export interface MemoFormValues {
  title: string;
  content: string;
}

export type MemoFormField = keyof MemoFormValues;
export type MemoFormErrors = Partial<Record<MemoFormField, string>>;

// ---------------------------------------------------------------- 보낼 값

/** 제목: 앞뒤 공백을 지우고 비면 null (D-047) */
const normalizeTitle = (title: string): string | null => title.trim() || null;

/** 내용: 그대로 두되 공백뿐이면 null (D-047) */
const normalizeContent = (content: string): string | null => (content.trim() ? content : null);

/** 제목·내용이 모두 비었는지 (공백만 있는 것도 빈 것). 빈 메모는 저장할 수 없다 (US-25 AC, D-032) */
export const isMemoEmpty = (values: MemoFormValues): boolean =>
  normalizeTitle(values.title) === null && normalizeContent(values.content) === null;

/** 제목 글자 수를 보일지 (230자부터, D-057) */
export const shouldShowTitleCounter = (title: string): boolean => title.length >= MEMO_TITLE_COUNTER_FROM;

export const memoToFormValues = (memo: Memo | null): MemoFormValues => ({
  title: memo?.title ?? '',
  content: memo?.content ?? '',
});

export const isMemoFormChanged = (initial: MemoFormValues, current: MemoFormValues): boolean =>
  initial.title !== current.title || initial.content !== current.content;

export const toMemoCreateRequest = (values: MemoFormValues): MemoRequest => ({
  title: normalizeTitle(values.title),
  content: normalizeContent(values.content),
});

/** 수정: 서버에 저장될 값이 달라진 칸만 보낸다 (JSON Merge Patch) */
export const toMemoUpdateRequest = (memo: Memo, values: MemoFormValues): MemoRequest => {
  const next = toMemoCreateRequest(values);
  const patch: MemoRequest = {};
  if (next.title !== memo.title) patch.title = next.title;
  if (next.content !== memo.content) patch.content = next.content;
  return patch;
};

// ---------------------------------------------------------------- 순서

/** 최근 수정 순, 같으면 id 큰 것 먼저 — 서버 목록과 같은 순서 (D-029) */
export const sortMemosByRecentUpdate = (memos: Memo[]): Memo[] =>
  [...memos].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id - a.id);

/** 만든 날 기준 가장 먼저 만든 메모 n개. 고쳐도 자리가 그대로 (D-055) */
export const pickEarliestCreatedMemos = (memos: Memo[], count = SIDEBAR_MEMO_COUNT): Memo[] =>
  [...memos].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id).slice(0, count);

/** 메모 창에서 지운 뒤 열 메모: 남은 목록의 맨 위, 없으면 새 메모(null) */
export const pickMemoAfterDelete = (memos: Memo[], deletedId: Memo['id']): Memo | null =>
  memos.find((item) => item.id !== deletedId) ?? null;

// ---------------------------------------------------------------- 표시

const splitLines = (content: string | null) => (content ?? '').split('\n');
const firstFilledLineIndex = (lines: string[]) => lines.findIndex((line) => line.trim() !== '');

/** 제목 자리 글자. 제목이 없으면 내용 첫 줄 (D-055) */
export const getMemoHeading = (memo: Memo): string => {
  if (memo.title) return memo.title;
  const lines = splitLines(memo.content);
  const index = firstFilledLineIndex(lines);
  return index < 0 ? '' : lines[index].trim();
};

/** 제목 자리 다음에 보일 내용 (줄바꿈 유지). 제목이 없으면 첫 줄 다음부터 */
export const getMemoBody = (memo: Memo): string => {
  if (memo.title) return memo.content ?? '';
  const lines = splitLines(memo.content);
  const index = firstFilledLineIndex(lines);
  return index < 0 ? '' : lines.slice(index + 1).join('\n').trim();
};

/** 목록 카드의 한 줄 미리보기 */
export const getMemoPreview = (memo: Memo): string =>
  getMemoBody(memo)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');

/** 수정일 'M/D', 올해가 아니면 'YYYY. M/D' */
export const formatMemoDate = (dateTime: LocalDateTime, now: Date): string => {
  const date = parseISO(dateTime);
  return date.getFullYear() === now.getFullYear() ? format(date, 'M/d') : format(date, 'yyyy. M/d');
};
