import { describe, expect, it } from 'vitest';

import { formatViewTitle } from './appLayoutUtils';

describe('헤더 날짜 제목', () => {
  it('월간: 2026년 9월', () => expect(formatViewTitle('MONTH', '2026-09-25')).toBe('2026년 9월'));
  it('주간: 그 주 기간 (주 시작 일요일, D-024)', () => expect(formatViewTitle('WEEK', '2026-09-30')).toBe('9월 27일 – 10월 3일'));
});
