"use client";

import type { ReactNode } from 'react';

import { useAppSelector } from '@/app/hooks';
import Icon from '@components/icons/LineIcon';
import { selectDdayStatus, selectDdays } from '@store/slices/ddaySlice';

import { useDdayActions } from './DdayActionsContext';
import DdayList from './DdayList';

interface DdaySectionProps {
  /** 사이드바가 주는 섹션 머리. 없으면 버튼 줄만 그린다 (테스트·단독 확인용) */
  header?: (actions?: ReactNode) => ReactNode;
}

/**
 * DdaySection - PC 사이드바·폴드 오른쪽 패널의 'D-Day' 섹션 (US-22, OV-03)
 * 머리 오른쪽 + = [D-Day 추가]. 목록은 날짜와 상관없이 전체 (D-020: 옵션과 관계없이 모든 D-Day)
 * 섹션 켜기/끄기·순서 설정은 US-21 범위 — 지금은 기본 순서 자리에 꽂기만 한다
 */
export default function DdaySection({ header }: DdaySectionProps) {
  const { openNewDday } = useDdayActions();
  // 목록은 DdayList가 받는다. 여기서는 빈 상태만 본다
  const ddays = useAppSelector(selectDdays);
  const status = useAppSelector(selectDdayStatus);
  const isLoaded = status === 'succeeded' || status === 'failed';

  const addButton = (
    <button
      type="button"
      aria-label="D-Day 추가"
      onClick={openNewDday}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-tp-text hover:bg-tp-secondary"
    >
      <Icon name="plus" size={15} />
    </button>
  );

  return (
    <div className="flex flex-col gap-2">
      {header ? header(addButton) : <div className="flex items-center justify-end gap-1">{addButton}</div>}
      <DdayList variant="sidebar" />
      {isLoaded && ddays.length === 0 && <EmptyAddButton onClick={openNewDday} />}
    </div>
  );
}

export function EmptyAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="self-start px-1 text-[13px] font-semibold text-tp-primary">
      D-Day 추가
    </button>
  );
}
