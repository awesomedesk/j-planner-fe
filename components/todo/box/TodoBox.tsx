"use client";

import { useEffect, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import type { Category, Id, LocalDate, Todo } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { getCategoryListColor } from '@components/category/utils/categoryUtils';
import Icon from '@components/icons/LineIcon';
import { selectCategoriesById } from '@store/slices/categorySlice';
import { moveTodo, setTodoCompleted } from '@store/slices/todoSlice';

import { formatDayTitle } from '@utils/date/dateUtils';
import { useDragReorder } from '@utils/hooks/useDragReorder';

import { useDayTodos } from '../hooks/useDayTodos';
import { useTodoActions } from '../TodoActionsContext';
import { getDropAfterId, isOverdueWarning, todoRowTag, todoRowTrailing } from '../utils/todoBoxUtils';

interface TodoBoxProps {
  date: LocalDate;
  /** 섹션 머리를 바깥(사이드바)이 그릴 때: 오른쪽에 '완료/전체' 수를 넘긴다. 없으면 박스가 'Todo' 머리를 그린다 */
  header?: (actions: ReactNode) => ReactNode;
}

/**
 * TodoBox - 그날의 Todo 한 박스 (US-13, D-013 · D-015 · D-027)
 * - 하루·기간·주간·월간을 나누지 않고 사용자 순서 그대로, 종류는 꼬리표로만
 * - 체크하면 박스에서 숨기고 '완료 n개 보기'로 펼친다. 기간·주간·월간도 한 번이면 전체 완료
 * - 제목을 누르면 Todo 수정 창 (US-12)
 * - 지난 미완료 (US-16, D-029): 원래 날짜 박스와 오늘 박스(서버가 함께 줌)에 빨간 ! + 'n/n 지남'. 순서는 제자리 (D-015)
 * - 끌어서 순서 바꾸기 (US-14, TODO-09): PC는 마우스로 끌기, 모바일은 길게 눌러 끌기, 키보드는 제목에서 Alt+↑/↓.
 *   미완료끼리만 옮긴다 (완료한 것은 숨겨지는 목록이라 끌지 않음)
 * PC 사이드바 Todo 섹션, 폴드 오른쪽 패널, 모바일 일간 Todo 탭(MO-10)이 같이 쓴다
 */
export default function TodoBox({ date, header }: TodoBoxProps) {
  const { todos, isLoaded } = useDayTodos(date);
  const categoriesById = useAppSelector(selectCategoriesById);
  const [isDoneOpen, setIsDoneOpen] = useState(false);

  const open = todos.filter((t) => !t.completed);
  const done = todos.filter((t) => t.completed);
  const dispatch = useAppDispatch();
  const openIds = open.map((t) => t.id);
  /** 키보드로 옮긴 뒤 그 제목에 포커스를 되돌린다 */
  const [keyboardMoved, setKeyboardMoved] = useState<{ id: Id } | null>(null);

  const move = (id: Id, insertIndex: number) => {
    const afterId = getDropAfterId(openIds, id, insertIndex);
    if (afterId !== undefined) void dispatch(moveTodo({ id, afterId }));
  };
  const { listRef, drag, rowProps } = useDragReorder(openIds, move);

  const moveByKey = (id: Id, event: KeyboardEvent) => {
    if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    const index = openIds.indexOf(id);
    const to = event.key === 'ArrowUp' ? index - 1 : index + 1;
    if (to < 0 || to >= openIds.length) return;
    move(id, to);
    setKeyboardMoved({ id });
  };

  useEffect(() => {
    if (!keyboardMoved) return;
    listRef.current?.querySelector<HTMLElement>(`[data-reorder-id="${keyboardMoved.id}"] [data-todo-title]`)?.focus();
  }, [keyboardMoved, listRef]);

  /** 끄는 동안 놓일 자리: 나머지 줄 중 insertIndex번째 줄 위, 맨 끝이면 마지막 줄 아래 */
  const rest = drag ? openIds.filter((id) => id !== drag.id) : [];
  const dropMark = (id: Id): 'top' | 'bottom' | null => {
    if (!drag || drag.insertIndex === drag.fromIndex || id === drag.id) return null;
    const i = rest.indexOf(id);
    if (i === drag.insertIndex) return 'top';
    if (drag.insertIndex === rest.length && i === rest.length - 1) return 'bottom';
    return null;
  };

  const count = <span className="text-xs text-tp-muted">{`${done.length}/${todos.length}`}</span>;

  return (
    <div className="flex flex-col gap-1.5">
      {header ? (
        header(count)
      ) : (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Todo</h3>
          {count}
        </div>
      )}

      <ul ref={listRef} aria-label={`${formatDayTitle(date)} Todo`} className="flex flex-col gap-1">
        {open.map((todo) => (
          <TodoRow
            key={todo.id}
            todo={todo}
            category={categoriesById.get(todo.categoryId)}
            rowProps={rowProps(todo.id)}
            dropMark={dropMark(todo.id)}
            onTitleKeyDown={(e) => moveByKey(todo.id, e)}
          />
        ))}
      </ul>
      {isLoaded && todos.length === 0 && <p className="px-1 py-2 text-[13px] text-tp-muted">Todo가 없어요</p>}

      {done.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={isDoneOpen}
            onClick={() => setIsDoneOpen((v) => !v)}
            className="flex items-center justify-between px-0.5 py-1 text-xs font-semibold text-tp-muted"
          >
            {isDoneOpen ? `완료 ${done.length}개 접기` : `완료 ${done.length}개 보기`}
            <Icon name={isDoneOpen ? 'chevronUp' : 'chevronDown'} size={14} />
          </button>
          {isDoneOpen && (
            <ul aria-label="완료한 Todo" className="flex flex-col gap-1">
              {done.map((todo) => (
                <TodoRow key={todo.id} todo={todo} category={categoriesById.get(todo.categoryId)} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

interface TodoRowProps {
  todo: Todo;
  category: Category | undefined;
  /** 끌기용 (미완료 목록만) */
  rowProps?: ReturnType<ReturnType<typeof useDragReorder>['rowProps']>;
  dropMark?: 'top' | 'bottom' | null;
  onTitleKeyDown?: (event: KeyboardEvent) => void;
}

function TodoRow({ todo, category, rowProps, dropMark = null, onTitleKeyDown }: TodoRowProps) {
  const dispatch = useAppDispatch();
  const { openTodo } = useTodoActions();
  const tag = todoRowTag(todo);
  const trailing = todoRowTrailing(todo);
  const overdue = isOverdueWarning(todo);

  return (
    <li
      {...rowProps}
      className={`relative flex select-none items-center gap-2 rounded-lg border ${overdue ? 'border-danger-line' : 'border-tp-line'} bg-white px-2 py-1.5 text-[13px] text-ink [-webkit-touch-callout:none] ${
        rowProps?.['data-dragging'] !== undefined ? 'cursor-grabbing shadow-lg ring-1 ring-tp-primary' : ''
      }`}
    >
      {dropMark && (
        <span
          aria-hidden="true"
          data-drop-indicator=""
          className={`pointer-events-none absolute inset-x-0 h-0.5 rounded-full bg-tp-primary ${dropMark === 'top' ? '-top-[3px]' : '-bottom-[3px]'}`}
        />
      )}
      <input
        type="checkbox"
        aria-label={`${todo.title} 완료`}
        checked={todo.completed}
        onChange={() => void dispatch(setTodoCompleted({ id: todo.id, completed: !todo.completed }))}
        className="m-0 h-[15px] w-[15px] shrink-0 accent-tp-primary"
      />
      {overdue && (
        <span
          role="img"
          aria-label="기한 지남"
          className="inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full bg-danger text-[10px] font-extrabold leading-none text-white"
        >
          !
        </span>
      )}
      {category && (
        <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: getCategoryListColor(category) }} />
      )}
      <button
        type="button"
        aria-label={`${todo.title} 수정`}
        aria-keyshortcuts={rowProps ? 'Alt+ArrowUp Alt+ArrowDown' : undefined}
        data-todo-title=""
        onClick={() => openTodo(todo)}
        onKeyDown={onTitleKeyDown}
        className={`min-w-0 flex-1 truncate text-left ${todo.completed ? 'text-tp-muted line-through' : ''} ${overdue ? 'font-semibold text-danger' : ''}`}
      >
        {todo.title}
      </button>
      {tag && (
        <span className="shrink-0 whitespace-nowrap rounded-full border border-tp-secondary-line bg-tp-panel px-1.5 py-px text-[10px] font-bold text-tp-on-secondary">
          {tag}
        </span>
      )}
      {trailing && (
        <span className={`shrink-0 whitespace-nowrap text-[11px] ${overdue ? 'text-danger' : 'text-tp-muted'}`}>{trailing}</span>
      )}
    </li>
  );
}
