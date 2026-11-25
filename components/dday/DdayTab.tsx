"use client";

import Icon from '@components/icons/LineIcon';

import { useDdayActions } from './DdayActionsContext';
import DdayList from './DdayList';

/**
 * DdayTab - 모바일 일간 'D-Day' 탭 내용 (US-22, MO-13 · D-049)
 * 머리 줄은 날짜만, < >·필터 없음 (sidebarItems dayTabBehavior). 남은 날은 항상 오늘 기준(서버 today.label)
 * 카드를 누르면 수정, 길게 눌러 순서 변경, 왼쪽으로 밀면 삭제 확인 (D-029, D-030)
 */
export default function DdayTab() {
  const { openNewDday } = useDdayActions();
  return (
    <div className="flex flex-col gap-2.5 overflow-y-auto p-3 pb-24">
      <DdayList variant="tab" />
      <button
        type="button"
        onClick={openNewDday}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-tp-line px-3 py-2.5 text-sm font-semibold text-tp-primary"
      >
        <Icon name="plus" size={15} />
        D-Day 추가
      </button>
    </div>
  );
}
