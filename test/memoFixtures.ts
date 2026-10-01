import type { Memo } from '@/types/api';

export const memo = (overrides: Partial<Memo> & Pick<Memo, 'id'>): Memo => ({
  title: '메모',
  content: null,
  createdAt: '2026-09-01T09:00:00',
  updatedAt: '2026-09-01T09:00:00',
  ...overrides,
});

/**
 * 메모 4개. 서버는 최근 수정 순(updatedAt desc, id desc)으로 준다 (D-029)
 * 만든 순서(createdAt asc): 작년 메모(4) → 제목 없는 메모(3) → 여행 준비물(2) → 읽을 책 목록(1)
 */
export const BOOKS = memo({
  id: 1,
  title: '읽을 책 목록',
  content: '- 데미안\n- 코스모스',
  createdAt: '2026-09-20T09:00:00',
  updatedAt: '2026-09-24T21:40:00',
});
export const TRAVEL = memo({
  id: 2,
  title: '여행 준비물',
  content: '여권, 충전기',
  createdAt: '2026-09-10T08:00:00',
  updatedAt: '2026-09-20T10:00:00',
});
export const UNTITLED = memo({
  id: 3,
  title: null,
  content: '플래너 위젯 아이디어\n주간 회고 템플릿',
  createdAt: '2026-08-01T12:00:00',
  updatedAt: '2026-09-12T18:00:00',
});
export const LAST_YEAR = memo({
  id: 4,
  title: '작년 메모',
  content: null,
  createdAt: '2025-12-01T09:00:00',
  updatedAt: '2025-12-31T23:00:00',
});

/** GET /memos 응답 (최근 수정 순) */
export const MEMOS: Memo[] = [BOOKS, TRAVEL, UNTITLED, LAST_YEAR];
