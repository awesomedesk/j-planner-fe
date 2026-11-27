import { describe, expect, it } from 'vitest';

import { MOBILE_VIEW_OPTIONS, VIEW_MODE_LABEL, displayedViewMode, formatViewTitle } from './appLayoutUtils';

describe('헤더 날짜 제목', () => {
  it('월간: 2026년 9월', () => expect(formatViewTitle('MONTH', '2026-09-25')).toBe('2026년 9월'));
  it('일간: 9월 25일 (금) (PC-03·MO-03)', () => expect(formatViewTitle('DAY', '2026-09-25')).toBe('9월 25일 (금)'));
  it('주간: 그 주 기간 (주 시작 일요일, D-024)', () => expect(formatViewTitle('WEEK', '2026-09-30')).toBe('9월 27일 – 10월 3일'));
  it('3일: 보는 날부터 사흘 (US-29, MO-20)', () => expect(formatViewTitle('THREE_DAY', '2026-09-25')).toBe('9월 25일 – 27일'));
  it('3일: 달이 바뀌면 9월 30일 – 10월 2일', () => expect(formatViewTitle('THREE_DAY', '2026-09-30')).toBe('9월 30일 – 10월 2일'));
  it('목록: 그 주 기간 (MO-19)', () => expect(formatViewTitle('LIST', '2026-09-25')).toBe('9월 20일 – 26일'));
  it('주 시작 요일이 월요일이면 주간·목록 기간도 월~일 (US-26 SET-01)', () => {
    expect(formatViewTitle('WEEK', '2026-09-25', 'MON')).toBe('9월 21일 – 27일');
    expect(formatViewTitle('LIST', '2026-09-27', 'MON')).toBe('9월 21일 – 27일');
  });
});

describe('보기 선택지 (D-022·025, US-29)', () => {
  it('모바일 드롭다운: 월간 / 주간 / 3일 / 일간 / 목록, 모두 켜짐', () => {
    expect(MOBILE_VIEW_OPTIONS).toEqual([
      { label: '월간', mode: 'MONTH' },
      { label: '주간', mode: 'WEEK' },
      { label: '3일', mode: 'THREE_DAY' },
      { label: '일간', mode: 'DAY' },
      { label: '목록', mode: 'LIST' },
    ]);
  });

  it('PC 버튼은 월·주·일 세 개 그대로 (D-021)', () => {
    expect(VIEW_MODE_LABEL).toEqual({ MONTH: '월', WEEK: '주', DAY: '일' });
  });

  it('3일·목록은 모바일 보기 — 태블릿·PC 폭에서는 주간으로 보여 준다 (보기 상태는 그대로)', () => {
    expect(displayedViewMode('THREE_DAY', true)).toBe('WEEK');
    expect(displayedViewMode('LIST', true)).toBe('WEEK');
    expect(displayedViewMode('THREE_DAY', false)).toBe('THREE_DAY');
    expect(displayedViewMode('LIST', false)).toBe('LIST');
    expect(displayedViewMode('DAY', true)).toBe('DAY');
  });
});
