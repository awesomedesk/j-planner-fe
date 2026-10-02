import { describe, expect, it } from 'vitest';

import { buildMobileDayTabs, dayTabBehavior } from './sidebarItems';

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

  it('내용이 있는 탭만 열린다 (US-25 연결 지점) — 내용을 꽂은 탭만 enabled', () => {
    expect(buildMobileDayTabs(undefined, new Set(['MEMO'])).map((t) => [t.key, t.enabled])).toEqual([
      ['TIMETABLE', true],
      ['TODO', false],
      ['DDAY', false],
      ['DIARY', false],
      ['MEMO', true],
    ]);
  });

  it('지금은 시간표만 열림, 나머지는 M2·M3에서 (D-048 Q2)', () => {
    expect(buildMobileDayTabs().map((t) => t.enabled)).toEqual([true, false, false, false, false]);
  });
});

describe('탭별 동작 (D-049)', () => {
  it('시간표: 스와이프로 날짜 이동, 필터 있음', () => {
    expect(dayTabBehavior('TIMETABLE')).toEqual({ swipe: true, categoryFilter: true, dateNav: 'swipe' });
  });
  it('Todo: 머리 줄 < >, 필터 있음 / 일기: 머리 줄 < >, 필터 없음', () => {
    expect(dayTabBehavior('TODO')).toEqual({ swipe: false, categoryFilter: true, dateNav: 'arrows' });
    expect(dayTabBehavior('DIARY')).toEqual({ swipe: false, categoryFilter: false, dateNav: 'arrows' });
  });
  it('D-Day·메모: 날짜와 상관없음 — 스와이프·< >·필터 없음', () => {
    for (const key of ['DDAY', 'MEMO'] as const) {
      expect(dayTabBehavior(key)).toEqual({ swipe: false, categoryFilter: false, dateNav: 'none' });
    }
  });
});
