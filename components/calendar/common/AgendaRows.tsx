"use client";

import type { Schedule } from '@/types/api';
import { useAppSelector } from '@/app/hooks';
import Icon from '@components/icons/LineIcon';
import { useTodoActions } from '@components/todo/TodoActionsContext';
import { selectCategoriesById } from '@store/slices/categorySlice';
import { useClockText } from '@utils/hooks/useTimeFormat';
import { safeHttpUrl } from '@utils/url/safeHttpUrl';

import { blockBackground, readableTextColor, stripeColorOf } from '../utils/calendarUtils';
import type { DayAgendaItem } from '../utils/dayAgendaUtils';

interface AgendaRowsProps {
  /** 목록 이름 (화면 읽기) */
  label: string;
  items: DayAgendaItem[];
  onOpenSchedule: (schedule: Schedule) => void;
}

/** 색을 고르지 않은 Todo의 테두리 = 테마 Theme2 (D-030) */
const THEME2 = 'var(--tp-theme2)';

/**
 * AgendaRows - 그날 일정 · 시간 지정 Todo 줄 목록 (US-17 MO-10 ③, US-29 목록 보기 MO-19)
 * - 왼쪽 시간 칸(시작·끝), 오른쪽 블록 (시간표 블록과 같은 색 규칙, D-019)
 *   일정 = 띠 + 항목 색 채움, 오른쪽에 장소 · Todo = 띠 + 흰 바탕 + 항목 색 테두리, 오른쪽에 'Todo'
 * - 누르면 일정 수정 창 / Todo 수정 창. URL이 있는 일정은 링크 아이콘 (D-021)
 */
export default function AgendaRows({ label, items, onOpenSchedule }: AgendaRowsProps) {
  const categoriesById = useAppSelector(selectCategoriesById);
  const { openTodo } = useTodoActions();
  const clock = useClockText();
  return (
    <ul aria-label={label} className="flex flex-col gap-1.5">
      {items.map((item) => {
        const isTodo = item.kind === 'todo';
        const source = isTodo ? item.todo : item.schedule;
        const category = categoriesById.get(source.categoryId) ?? null;
        const blockStyle = isTodo
          ? {
              background: `linear-gradient(to right, ${stripeColorOf(category)} 0 5px, #ffffff 5px)`,
              border: `2px solid ${item.todo.color ?? THEME2}`,
              borderLeftWidth: 0,
            }
          : { background: blockBackground(category, item.schedule.color), color: readableTextColor(item.schedule.color) };
        const side = isTodo ? 'Todo' : (item.schedule.location?.name ?? null);
        const linkUrl = safeHttpUrl(item.kind === 'schedule' ? item.schedule.url : null);
        return (
          <li key={`${item.kind}-${source.id}`} className="flex items-stretch gap-2">
            <span className="flex w-10 shrink-0 flex-col pt-1 text-[11px] text-tp-muted">
              <span>{clock(item.timeTop)}</span>
              {item.timeBottom && <span>{clock(item.timeBottom)}</span>}
            </span>
            <button
              type="button"
              onClick={() => (item.kind === 'todo' ? openTodo(item.todo) : onOpenSchedule(item.schedule))}
              className={`flex min-h-9 min-w-0 flex-1 items-center justify-between gap-2 rounded-md py-[5px] pl-[11px] text-left text-[13px] font-semibold ${
                isTodo ? 'text-ink' : ''
              }`}
              style={blockStyle}
            >
              <span className={`min-w-0 truncate ${isTodo && item.todo.completed ? 'line-through opacity-60' : ''}`}>
                {source.title}
              </span>
              {side && <span className="shrink-0 truncate pr-2 text-[11px] font-medium opacity-80">{side}</span>}
            </button>
            {item.kind === 'schedule' && linkUrl && (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${item.schedule.title} 링크 열기`}
                className="inline-flex w-9 shrink-0 items-center justify-center text-tp-primary"
              >
                <Icon name="link" size={15} />
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
