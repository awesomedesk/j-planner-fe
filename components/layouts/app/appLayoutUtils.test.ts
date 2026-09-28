import { describe, expect, it } from 'vitest';

import { buildMobileDayTabs, formatViewTitle } from './appLayoutUtils';

describe('헤더 날짜 제목', () => {
  it('월간: 2026년 9월', () => expect(formatViewTitle('MONTH', '2026-09-25')).toBe('2026년 9월'));
  it('일간: 9월 25일 (금) (PC-03·MO-03)', () => expect(formatViewTitle('DAY', '2026-09-25')).toBe('9월 25일 (금)'));
  it('주간: 그 주 기간 (주 시작 일요일, D-024)', () => expect(formatViewTitle('WEEK', '2026-09-30')).toBe('9월 27일 – 10월 3일'));
});

describe('모바일 일간 탭 (D-049)', () => {
  const labels = (tabs: ReturnType<typeof buildMobileDayTabs>) => tabs.map((t) => t.label);

  it('시간표(맨 앞) + 사이드바 항목 기본 순서 Todo·D-Day·일기·메모', () => {
    expect(labels(buildMobileDayTabs())).toEqual(['시간표', 'Todo', 'D-Day', '일기', '메모']);
  });

  it('설정의 사이드바 순서를 따른다', () => {
    const items = [
      { type: 'DIARY', visible: true },
      { type: 'TODO', visible: true },
      { type: 'MEMO', visible: true },
      { type: 'DDAY', visible: true },
    ] as const;
    expect(labels(buildMobileDayTabs([...items]))).toEqual(['시간표', '일기', 'Todo', '메모', 'D-Day']);
  });

  it('설정에서 끈 항목은 숨긴다, 시간표는 항상 있다 (D-049 보완)', () => {
    const items = [
      { type: 'TODO', visible: false },
      { type: 'DDAY', visible: false },
      { type: 'DIARY', visible: false },
      { type: 'MEMO', visible: false },
    ] as const;
    expect(labels(buildMobileDayTabs([...items]))).toEqual(['시간표']);
  });

  it('지금은 시간표만 열림, 나머지는 M2·M3에서 (D-048 Q2)', () => {
    expect(buildMobileDayTabs().map((t) => t.enabled)).toEqual([true, false, false, false, false]);
  });
});
