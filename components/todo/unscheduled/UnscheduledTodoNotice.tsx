"use client";

import { useEffect, useState } from 'react';

import type { LocalDate, Todo } from '@/types/api';

import { useDayTodos } from '../hooks/useDayTodos';
import { unscheduledOpenTodos } from '../utils/todoBoxUtils';

interface UnscheduledTodoNoticeProps {
  /** 일간 시간표가 보는 날짜 */
  date: LocalDate;
  /** PC·태블릿(PC-03 ⑧) / 모바일(MO-03 ③) */
  variant: 'pc' | 'mobile';
  /** 시간을 정할 Todo를 골랐을 때 → '시간 지정'을 켠 Todo 수정 창 (AppShell) */
  onPick: (todo: Todo) => void;
}

/**
 * UnscheduledTodoNotice - 일간 시간표의 '시간 미지정 Todo n개' 안내 (US-18, D-021 · PC-03 ⑧ · MO-03 ③)
 * - 그날 Todo 박스와 같은 목록(GET /todos?date=, 카테고리 필터)에서 시간 없고 안 끝냈고 그날이 범위 안인 것만 센다
 *   (지난 미완료는 뺌, US-18 Q1). 0개면 그리지 않는다
 * - PC: 시간표 오른쪽 아래 떠 있는 연한 상자. 제목을 누르면 그 Todo의 시간을 정한다
 * - 모바일: 화면 아래 떠 있는 줄(+ 버튼 왼쪽까지). 1개면 바로, 여러 개면 아래 시트에서 고른다
 * 저장하면 박스를 다시 받으므로(refreshTodos) 수가 저절로 줄고 시간표에 블록이 생긴다
 */
export default function UnscheduledTodoNotice({ date, variant, onPick }: UnscheduledTodoNoticeProps) {
  const { todos } = useDayTodos(date);
  const items = unscheduledOpenTodos(todos, date);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (items.length === 0) return null;
  const countText = `시간 미지정 Todo ${items.length}개`;

  if (variant === 'pc') {
    return (
      <section
        aria-label="시간 미지정 Todo"
        className="absolute bottom-3 right-6 z-[5] flex max-h-[40%] w-[380px] max-w-[calc(100%-5rem)] flex-col gap-1.5 overflow-y-auto rounded-xl border border-dashed border-tp-line bg-tp-panel p-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
      >
        <h3 className="text-[13px] font-bold">{countText}</h3>
        <p className="text-xs text-tp-muted">제목을 누르면 시간을 정할 수 있어요</p>
        <ul className="flex flex-wrap gap-x-1 gap-y-0.5 text-xs leading-relaxed">
          {items.map((todo, i) => (
            <li key={todo.id} className="flex min-w-0 items-center gap-1">
              {i > 0 && (
                <span aria-hidden="true" className="text-tp-muted">
                  ·
                </span>
              )}
              <TitleButton todo={todo} onPick={onPick} className="max-w-[300px] truncate font-semibold text-tp-primary hover:underline" />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label={`${countText}, 시간 지정하기`}
        onClick={() => (items.length === 1 ? onPick(items[0]) : setIsSheetOpen(true))}
        className="fixed bottom-5 left-3 right-[84px] z-10 flex h-14 items-center justify-between gap-2 rounded-xl border border-tp-line bg-white px-3 text-[13px] text-ink shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
      >
        <span className="truncate">{countText}</span>
        <span className="shrink-0 font-semibold text-tp-primary">시간 지정하기</span>
      </button>
      {isSheetOpen && (
        <PickSheet
          items={items}
          onPick={(todo) => {
            setIsSheetOpen(false);
            onPick(todo);
          }}
          onClose={() => setIsSheetOpen(false)}
        />
      )}
    </>
  );
}

function TitleButton({ todo, onPick, className }: { todo: Todo; onPick: (todo: Todo) => void; className: string }) {
  return (
    <button type="button" aria-label={`${todo.title} 시간 지정`} onClick={() => onPick(todo)} className={className}>
      {todo.title}
    </button>
  );
}

/** 모바일: 여러 개일 때 고르는 아래 시트 (US-18 Q3). 바깥·닫기·Esc로 닫힌다 */
function PickSheet({ items, onPick, onClose }: { items: Todo[]; onPick: (todo: Todo) => void; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/45" aria-hidden="true" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="시간을 정할 Todo"
        className="fixed inset-x-0 bottom-0 z-30 flex max-h-[60dvh] flex-col gap-2 rounded-t-[18px] bg-tp-bg px-3.5 pb-5 pt-3 text-tp-text shadow-[0_-6px_18px_rgba(0,0,0,0.12)]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold">시간을 정할 Todo</h2>
          <button type="button" onClick={onClose} className="h-11 min-w-11 px-2 text-[13px] font-semibold text-tp-primary">
            닫기
          </button>
        </div>
        <ul className="flex flex-col overflow-y-auto">
          {items.map((todo) => (
            <li key={todo.id} className="border-b border-tp-line last:border-b-0">
              <TitleButton todo={todo} onPick={onPick} className="w-full truncate py-3 text-left text-sm font-semibold" />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
