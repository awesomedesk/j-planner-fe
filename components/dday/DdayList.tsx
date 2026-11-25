"use client";

import { useEffect, useState } from 'react';

import type { Dday, Id } from '@/types/api';
import { useAppDispatch } from '@/app/hooks';
import SwipeDeleteItem from '@components/common/SwipeDeleteItem';
import ThemeButton from '@components/button/ThemeButton';
import Icon from '@components/icons/LineIcon';
import { moveDday, refreshDdays } from '@store/slices/ddaySlice';

import { ddayApi } from '@utils/api';
import { useDragReorder } from '@utils/hooks/useDragReorder';
import { useErrorNotice } from '@utils/hooks/useErrorNotice';
import { getDropAfterId } from '@utils/list/reorder';

import DdayDeleteConfirm from './DdayDeleteConfirm';
import { useDdayActions } from './DdayActionsContext';
import { useDdays } from './hooks/useDdays';

export const DDAY_EMPTY_MESSAGE = 'D-Day가 없어요.';

interface DdayListProps {
  /** PC 사이드바·폴드 패널(줄) / 모바일 일간 D-Day 탭(카드, 왼쪽으로 밀어 삭제 MO-13) */
  variant: 'sidebar' | 'tab';
}

type MoveDirection = 'up' | 'down';

/**
 * DdayList - D-Day 한 목록 (US-22, OV-03 · MO-13 · D-029 · D-030)
 * - 줄: 제목(한 줄 …) + 오른쪽 오늘 기준 표시(today.label). 남은 날·지난 날 구분 없이 사용자 순서
 * - 누르면(Enter 포함) 수정 창. 순서: PC는 끌어서, 모바일은 길게 눌러서, 키보드는 줄의 [위로]·[아래로]
 * - 모바일 카드는 왼쪽으로 밀면 삭제 → 확인 창 (D-030)
 */
export default function DdayList({ variant }: DdayListProps) {
  const dispatch = useAppDispatch();
  const notifyError = useErrorNotice();
  const { ddays, isLoaded } = useDdays();
  const { openDday } = useDdayActions();
  const ids = ddays.map((d) => d.id);

  const move = (id: Id, insertIndex: number) => {
    const afterId = getDropAfterId(ids, id, insertIndex);
    if (afterId !== undefined) void dispatch(moveDday({ id, afterId }));
  };
  const { listRef, drag, rowProps } = useDragReorder(ids, move);

  /** [위로]·[아래로] 뒤에 같은 버튼으로 초점을 돌린다 (줄이 옮겨져도 키보드 위치 유지) */
  const [movedBy, setMovedBy] = useState<{ id: Id; direction: MoveDirection } | null>(null);
  const moveByButton = (id: Id, direction: MoveDirection) => {
    const index = ids.indexOf(id);
    move(id, direction === 'up' ? index - 1 : index + 1);
    setMovedBy({ id, direction });
  };
  useEffect(() => {
    if (!movedBy) return;
    listRef.current?.querySelector<HTMLElement>(`[data-reorder-id="${movedBy.id}"] [data-move="${movedBy.direction}"]`)?.focus();
  }, [movedBy, ddays, listRef]);

  /** 끄는 동안 놓일 자리 표시 (Todo 박스와 같게) */
  const rest = drag ? ids.filter((id) => id !== drag.id) : [];
  const dropMark = (id: Id): 'top' | 'bottom' | null => {
    if (!drag || drag.insertIndex === drag.fromIndex || id === drag.id) return null;
    const i = rest.indexOf(id);
    if (i === drag.insertIndex) return 'top';
    if (drag.insertIndex === rest.length && i === rest.length - 1) return 'bottom';
    return null;
  };

  // 모바일 밀어서 삭제 → 확인 창
  const [deleting, setDeleting] = useState<Dday | null>(null);
  const [busyId, setBusyId] = useState<Id | null>(null);
  const confirmDelete = async () => {
    const target = deleting;
    setDeleting(null);
    if (!target) return;
    setBusyId(target.id);
    try {
      await ddayApi.remove(target.id);
      await dispatch(refreshDdays());
    } catch (error) {
      notifyError(error);
    } finally {
      setBusyId(null);
    }
  };

  const row = (dday: Dday, index: number) => (
    <DdayRow
      dday={dday}
      variant={variant}
      dropMark={dropMark(dday.id)}
      canMoveUp={index > 0}
      canMoveDown={index < ddays.length - 1}
      onOpen={() => openDday(dday)}
      onMove={(direction) => moveByButton(dday.id, direction)}
    />
  );

  return (
    <>
      <ul ref={listRef} aria-label="D-Day 목록" className={`flex flex-col ${variant === 'tab' ? 'gap-2.5' : 'gap-1'}`}>
        {ddays.map((dday, index) => {
          const props = rowProps(dday.id);
          const isDragging = props['data-dragging'] !== undefined;
          return variant === 'tab' ? (
            <SwipeDeleteItem
              key={dday.id}
              onDelete={() => setDeleting(dday)}
              deleteLabel={`${dday.title} 삭제`}
              isDeleting={busyId === dday.id}
              itemProps={{ ...props, className: undefined }}
            >
              {({ isRevealed, close }) => (
                <div className={isDragging ? 'rounded-xl shadow-lg ring-1 ring-tp-primary' : undefined} onClickCapture={isRevealed ? (e) => (e.stopPropagation(), close()) : undefined}>
                  {row(dday, index)}
                </div>
              )}
            </SwipeDeleteItem>
          ) : (
            <li
              key={dday.id}
              {...props}
              className={`group relative select-none rounded-lg [-webkit-touch-callout:none] ${isDragging ? 'cursor-grabbing shadow-lg ring-1 ring-tp-primary' : ''}`}
            >
              {row(dday, index)}
            </li>
          );
        })}
      </ul>
      {isLoaded && ddays.length === 0 && <p className="px-1 py-2 text-[13px] text-tp-muted">{DDAY_EMPTY_MESSAGE}</p>}

      {deleting && <DdayDeleteConfirm onCancel={() => setDeleting(null)} onConfirm={() => void confirmDelete()} />}
    </>
  );
}

interface DdayRowProps {
  dday: Dday;
  variant: 'sidebar' | 'tab';
  dropMark: 'top' | 'bottom' | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onOpen: () => void;
  onMove: (direction: MoveDirection) => void;
}

function DdayRow({ dday, variant, dropMark, canMoveUp, canMoveDown, onOpen, onMove }: DdayRowProps) {
  const isTab = variant === 'tab';
  return (
    <div
      className={`group relative flex items-center gap-1 border border-tp-line bg-white text-ink ${isTab ? 'rounded-xl px-3 py-2.5' : 'rounded-lg px-2 py-1.5'}`}
    >
      {dropMark && (
        <span
          aria-hidden="true"
          data-drop-indicator=""
          className={`pointer-events-none absolute inset-x-0 h-0.5 rounded-full bg-tp-primary ${dropMark === 'top' ? '-top-[3px]' : '-bottom-[3px]'}`}
        />
      )}
      <button
        type="button"
        aria-label={`${dday.title} ${dday.today.label} 수정`}
        onClick={onOpen}
        className={`flex min-w-0 flex-1 items-center justify-between gap-2 text-left ${isTab ? 'text-[15px]' : 'text-[13px]'}`}
      >
        <span className="min-w-0 truncate font-semibold">{dday.title}</span>
        <span className="shrink-0 whitespace-nowrap font-bold text-tp-primary">{dday.today.label}</span>
      </button>
      {/* 키보드 순서 바꾸기: 줄에 마우스를 올리거나 초점이 있을 때 보인다 (06 목록, 카테고리 ▲▼와 같은 모양) */}
      <span className="inline-flex shrink-0 gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <ThemeButton iconOnly className="!h-6 !w-6" aria-label={`${dday.title} 위로`} data-move="up" disabled={!canMoveUp} onClick={() => onMove('up')}>
          <Icon name="chevronUp" size={13} strokeWidth={2.4} />
        </ThemeButton>
        <ThemeButton iconOnly className="!h-6 !w-6" aria-label={`${dday.title} 아래로`} data-move="down" disabled={!canMoveDown} onClick={() => onMove('down')}>
          <Icon name="chevronDown" size={13} strokeWidth={2.4} />
        </ThemeButton>
      </span>
    </div>
  );
}
