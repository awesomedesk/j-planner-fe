"use client";

import { useState } from 'react';
import type { ReactNode } from 'react';

import type { Category, LocalDate, Todo } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { getCategoryListColor } from '@components/category/utils/categoryUtils';
import Icon from '@components/icons/LineIcon';
import { selectCategoriesById } from '@store/slices/categorySlice';
import { setTodoCompleted } from '@store/slices/todoSlice';

import { formatDayTitle } from '@utils/date/dateUtils';

import { useDayTodos } from '../hooks/useDayTodos';
import { useTodoActions } from '../TodoActionsContext';
import { todoRowTag, todoRowTrailing } from '../utils/todoBoxUtils';

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
 * PC 사이드바 Todo 섹션, 폴드 오른쪽 패널, 모바일 일간 Todo 탭(MO-10)이 같이 쓴다
 */
export default function TodoBox({ date, header }: TodoBoxProps) {
  const { todos, isLoaded } = useDayTodos(date);
  const categoriesById = useAppSelector(selectCategoriesById);
  const [isDoneOpen, setIsDoneOpen] = useState(false);

  const open = todos.filter((t) => !t.completed);
  const done = todos.filter((t) => t.completed);
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

      <ul aria-label={`${formatDayTitle(date)} Todo`} className="flex flex-col gap-1">
        {open.map((todo) => (
          <TodoRow key={todo.id} todo={todo} category={categoriesById.get(todo.categoryId)} />
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

function TodoRow({ todo, category }: { todo: Todo; category: Category | undefined }) {
  const dispatch = useAppDispatch();
  const { openTodo } = useTodoActions();
  const tag = todoRowTag(todo);
  const trailing = todoRowTrailing(todo);

  return (
    <li className="flex items-center gap-2 rounded-lg border border-tp-line bg-white px-2 py-1.5 text-[13px] text-ink">
      <input
        type="checkbox"
        aria-label={`${todo.title} 완료`}
        checked={todo.completed}
        onChange={() => void dispatch(setTodoCompleted({ id: todo.id, completed: !todo.completed }))}
        className="m-0 h-[15px] w-[15px] shrink-0 accent-tp-primary"
      />
      {category && (
        <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: getCategoryListColor(category) }} />
      )}
      <button
        type="button"
        aria-label={`${todo.title} 수정`}
        onClick={() => openTodo(todo)}
        className={`min-w-0 flex-1 truncate text-left ${todo.completed ? 'text-tp-muted line-through' : ''}`}
      >
        {todo.title}
      </button>
      {tag && (
        <span className="shrink-0 whitespace-nowrap rounded-full border border-tp-secondary-line bg-tp-panel px-1.5 py-px text-[10px] font-bold text-tp-on-secondary">
          {tag}
        </span>
      )}
      {trailing && <span className="shrink-0 whitespace-nowrap text-[11px] text-tp-muted">{trailing}</span>}
    </li>
  );
}
