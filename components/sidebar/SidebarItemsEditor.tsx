"use client";

import { useEffect, useRef, useState } from 'react';

import type { SidebarItem } from '@/types/api';
import Icon from '@components/icons/LineIcon';

import { SIDEBAR_SECTIONS } from './sidebarItems';

interface SidebarItemsEditorProps {
  items: SidebarItem[];
  /** 바뀐 4개 전체(순서 = 표시 순서). 저장은 부르는 쪽 (PATCH /settings) */
  onChange: (items: SidebarItem[]) => void;
}

const labelOf = (type: SidebarItem['type']) => SIDEBAR_SECTIONS.find((section) => section.type === type)?.label ?? type;
const iconOf = (type: SidebarItem['type']) => SIDEBAR_SECTIONS.find((section) => section.type === type)?.icon ?? 'todo';

const ARROW_CLASS =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-tp-line bg-tp-panel text-tp-primary disabled:cursor-not-allowed disabled:opacity-40';

/**
 * SidebarItemsEditor - 섹션 편집 행 (US-21, #394 v1.2 · FE 검토 ⑤)
 * 줄마다 체크박스(이름 'Todo 표시') + ▲▼(이름 'Todo 위로/아래로', 맨 끝은 막힘).
 * 누른 뒤에도 초점이 같은 버튼에 남고, 막혀서 누를 수 없게 되면 반대 버튼으로 옮긴다.
 * 날짜 패널 '섹션 편집'과 달력 설정(US-26)이 같이 쓴다.
 */
export default function SidebarItemsEditor({ items, onChange }: SidebarItemsEditorProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);

  useEffect(() => {
    if (!focusKey) return;
    const target = listRef.current?.querySelector<HTMLElement>(`[data-key="${focusKey}"]`);
    if (target && !(target as HTMLButtonElement).disabled) target.focus();
    else listRef.current?.querySelector<HTMLElement>(`[data-key="${focusKey.replace(/-(up|down)$/, (m) => (m === '-up' ? '-down' : '-up'))}"]`)?.focus();
  }, [focusKey, items]);

  const toggle = (type: SidebarItem['type']) => {
    onChange(items.map((item) => (item.type === type ? { ...item, visible: !item.visible } : item)));
    setFocusKey(`${type}-cb`);
  };
  const move = (index: number, step: -1 | 1) => {
    const next = [...items];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    onChange(next);
    setFocusKey(`${items[index].type}-${step < 0 ? 'up' : 'down'}`);
  };

  return (
    <ul ref={listRef} aria-label="섹션 편집" className="flex flex-col gap-1.5">
      {items.map((item, index) => {
        const label = labelOf(item.type);
        return (
          <li key={item.type} className="flex items-center gap-1.5 rounded-xl border border-tp-line bg-tp-panel px-3 py-1.5">
            <label className="flex min-h-9 flex-1 cursor-pointer items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                data-key={`${item.type}-cb`}
                aria-label={`${label} 표시`}
                checked={item.visible}
                onChange={() => toggle(item.type)}
                className="h-4 w-4 accent-tp-primary"
              />
              <Icon name={iconOf(item.type)} size={15} />
              {label}
            </label>
            <button type="button" data-key={`${item.type}-up`} aria-label={`${label} 위로`} disabled={index === 0} onClick={() => move(index, -1)} className={ARROW_CLASS}>
              <Icon name="chevronUp" size={16} />
            </button>
            <button
              type="button"
              data-key={`${item.type}-down`}
              aria-label={`${label} 아래로`}
              disabled={index === items.length - 1}
              onClick={() => move(index, 1)}
              className={ARROW_CLASS}
            >
              <Icon name="chevronDown" size={16} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
