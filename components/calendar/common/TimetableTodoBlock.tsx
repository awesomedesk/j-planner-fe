"use client";

import type { Category, Todo } from '@/types/api';
import { useAppDispatch } from '@/app/hooks';
import { setTodoCompleted } from '@store/slices/todoSlice';

import { stripeColorOf } from '../utils/calendarUtils';
import { lineClampFor, minutesToClock, clockToMinutes, type TodoBlockLayout } from '../utils/timetableUtils';

interface TimetableTodoBlockProps {
  layout: TodoBlockLayout;
  category: Category | null;
  /** 1시간 높이 (px) */
  hourHeight: number;
  /** 제목 글자 크기 (px) */
  fontSize: number;
  onOpen: (todo: Todo) => void;
  /** 좁은 칸(모바일 7칸): 체크박스를 작게, 띠 4px */
  compact?: boolean;
}

/** 블록 사이 틈 (위아래·오른쪽 1px) — 일정 블록과 같게 */
const GAP = 1;
/** 색을 고르지 않은 Todo의 테두리 = 테마 Theme2 (D-030) */
const THEME2 = 'var(--tp-theme2)';

const timeText = (todo: Todo) => {
  const { start, durationMinutes } = todo.time!;
  const end = (clockToMinutes(start) + durationMinutes) % 1440;
  return `${start}~${minutesToClock(end)}`;
};

/**
 * TimetableTodoBlock - 시간표(주간·일간)의 시간 지정 Todo 블록 (US-15, D-007 · D-019)
 * - 왼쪽 카테고리 띠 + 흰 바탕 + 항목 색(없으면 Theme2) 테두리 + 체크박스
 * - 체크박스로 바로 완료 (박스와 같이 바뀜). 완료해도 블록은 남고 체크 + 줄 긋기
 * - 제목을 누르면 Todo 수정 창 (US-12)
 */
export default function TimetableTodoBlock({ layout, category, hourHeight, fontSize, onOpen, compact = false }: TimetableTodoBlockProps) {
  const dispatch = useAppDispatch();
  const { todo } = layout;
  const toPx = (minutes: number) => (minutes / 60) * hourHeight;
  const height = toPx(layout.height);
  const stripe = compact ? 4 : 5;

  return (
    <div
      data-block
      className="absolute"
      style={{
        top: `${toPx(layout.top)}px`,
        height: `${height}px`,
        left: `${(layout.column / layout.columns) * 100}%`,
        width: `${100 / layout.columns}%`,
        padding: `${GAP}px ${GAP}px ${GAP}px 0`,
      }}
    >
      <div
        data-todo-block
        className="relative flex h-full items-start overflow-hidden rounded border text-ink"
        style={{
          background: `linear-gradient(to right, ${stripeColorOf(category)} 0 ${stripe}px, #ffffff ${stripe}px)`,
          borderColor: todo.color ?? THEME2,
        }}
      >
        <input
          type="checkbox"
          aria-label={`${todo.title} 완료`}
          checked={todo.completed}
          onChange={() => void dispatch(setTodoCompleted({ id: todo.id, completed: !todo.completed }))}
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
          className={`m-0 shrink-0 accent-tp-primary ${compact ? 'ml-[6px] mt-[3px] h-[10px] w-[10px]' : 'ml-[9px] mt-[4px] h-[13px] w-[13px]'}`}
        />
        <button
          type="button"
          aria-label={`${todo.title} Todo, ${timeText(todo)}`}
          title={todo.title}
          onClick={(event) => {
            event.stopPropagation();
            onOpen(todo);
          }}
          onDoubleClick={(event) => event.stopPropagation()}
          className="flex h-full min-w-0 flex-1 items-start overflow-hidden pl-1 pr-0.5 pt-0.5 text-left font-semibold"
          style={{ fontSize: `${fontSize}px` }}
        >
          <span
            className={`overflow-hidden break-all leading-[1.25] ${todo.completed ? 'text-tp-muted line-through' : ''}`}
            style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: lineClampFor(height - GAP * 2, fontSize) }}
          >
            {todo.title}
          </span>
        </button>
      </div>
    </div>
  );
}
