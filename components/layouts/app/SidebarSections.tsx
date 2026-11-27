"use client";

import { useEffect, useRef, useState, type ReactNode } from 'react';

import type { SidebarItemType } from '@/types/calendar';
import { useAppSelector } from '@/app/hooks';
import Icon from '@components/icons/LineIcon';
import MiniCalendar from '@components/sidebar/MiniCalendar';
import { SIDEBAR_SECTIONS } from '@components/sidebar/sidebarItems';
import { selectSidebarItems } from '@store/slices/settingsSlice';

import { SIDEBAR_SECTION_SLOTS, type SidebarSectionSlot } from './sidebarSectionSlots';

/** 막대의 섹션 버튼 → 그 섹션을 펼치고 제목에 초점 (v1.2). key가 바뀔 때마다 한 번 */
export interface SectionFocusRequest {
  type: SidebarItemType;
  key: number;
}

interface SidebarSectionsProps {
  /** 섹션 내용 (기본 = sidebarSectionSlots). 없는 섹션은 빈 틀 */
  content?: Partial<Record<SidebarItemType, SidebarSectionSlot>>;
  focusRequest?: SectionFocusRequest | null;
  /** 미니 달력(맨 위 고정, D-015). 모바일 날짜 시트는 빼고 그린다 */
  showMiniCalendar?: boolean;
}

/** 처음 접혀 있는 섹션: Todo·D-Day는 펼치고 일기·메모는 접는다 (#394 v1.2). 접힘은 기억하지 않는다 (API 자리 없음, FE 검토 ③) */
const INITIALLY_FOLDED: readonly SidebarItemType[] = ['DIARY', 'MEMO'];

/**
 * SidebarSections - 사이드바·폴드 오른쪽 패널의 섹션 (D-013, US-19·21)
 * 미니 달력(맨 위 고정, 모바일 시트는 없음) → 설정(`/settings` sidebarItems)의 순서대로, 끈 섹션은 뺀다. 모두 끄면 안내.
 * 섹션 제목(버튼)을 누르면 접기·펼치기. 내용은 sidebarSectionSlots 한 곳에서 꽂고, 내용은 header(버튼)로 머리를 그린다
 */
export default function SidebarSections({ content = SIDEBAR_SECTION_SLOTS, focusRequest = null, showMiniCalendar = true }: SidebarSectionsProps) {
  const items = useAppSelector(selectSidebarItems);
  const visible = items.filter((item) => item.visible);
  // 막대에서 섹션을 눌러 열면 처음부터 그 섹션은 펼친 채
  const [folded, setFolded] = useState<ReadonlySet<SidebarItemType>>(() => new Set(INITIALLY_FOLDED.filter((type) => type !== focusRequest?.type)));
  /** 접기·펼치기 뒤 같은 제목 버튼에 초점 (머리를 다시 그려도) */
  const [toggled, setToggled] = useState<{ type: SidebarItemType; key: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 막대에서 연 섹션은 펼친다 (받은 요청이 바뀐 그 렌더에서)
  const [handledRequest, setHandledRequest] = useState(focusRequest);
  if (focusRequest !== handledRequest) {
    setHandledRequest(focusRequest);
    if (focusRequest && folded.has(focusRequest.type)) setFolded((prev) => new Set([...prev].filter((type) => type !== focusRequest.type)));
  }
  useEffect(() => {
    if (!focusRequest) return;
    const heading = containerRef.current?.querySelector<HTMLElement>(`[data-section-toggle="${focusRequest.type}"]`);
    heading?.focus();
    heading?.scrollIntoView?.({ block: 'nearest' });
  }, [focusRequest]);

  useEffect(() => {
    if (toggled) containerRef.current?.querySelector<HTMLElement>(`[data-section-toggle="${toggled.type}"]`)?.focus();
  }, [toggled]);

  const toggle = (type: SidebarItemType) => {
    setFolded((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
    setToggled((prev) => ({ type, key: (prev?.key ?? 0) + 1 }));
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-2.5">
      {showMiniCalendar && (
        <section aria-label="미니 달력" className="rounded-xl border border-tp-line bg-tp-panel p-3">
          <MiniCalendar />
        </section>
      )}
      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-tp-line p-3 text-[13px] text-tp-muted">표시할 섹션이 없어요. 섹션 편집에서 켤 수 있어요.</p>
      ) : (
        visible.map((item) => {
          const section = SIDEBAR_SECTIONS.find((s) => s.type === item.type);
          if (!section) return null;
          const slot = content[section.type];
          const isFolded = folded.has(section.type);
          return (
            <SectionFrame
              key={section.type}
              type={section.type}
              title={section.label}
              icon={section.icon}
              folded={isFolded}
              onToggle={() => toggle(section.type)}
            >
              {slot && ((header) => slot({ header }))}
            </SectionFrame>
          );
        })
      )}
    </div>
  );
}

type Icons = 'todo' | 'dday' | 'diary' | 'memo';

interface SectionFrameProps {
  title: string;
  type?: SidebarItemType;
  icon?: Icons;
  /** 접기 (없으면 접을 수 없는 칸 — 미니 달력) */
  folded?: boolean;
  onToggle?: () => void;
  /** 섹션 내용. 받은 header(버튼)로 머리를 그린다. 없으면 머리 + 빈 자리 */
  children?: false | ((header: (actions?: ReactNode) => ReactNode) => ReactNode);
}

function SectionFrame({ title, type, icon, folded = false, onToggle, children }: SectionFrameProps) {
  const header = (actions?: ReactNode) => (
    <div className="flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-1.5 text-sm font-bold">
        {onToggle ? (
          <button type="button" data-section-toggle={type} aria-expanded={!folded} onClick={onToggle} className="flex min-h-8 items-center gap-1.5">
            {icon && <Icon name={icon} size={15} />}
            {title}
            <Icon name={folded ? 'chevronRight' : 'chevronDown'} size={14} className="text-tp-muted" />
          </button>
        ) : (
          <>
            {icon && <Icon name={icon} size={15} />}
            {title}
          </>
        )}
      </h3>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  );
  return (
    <section aria-label={title} className="flex flex-col gap-2 rounded-xl border border-tp-line bg-tp-panel p-3">
      {folded ? (
        header()
      ) : children ? (
        children(header)
      ) : (
        <>
          {header()}
          <div data-placeholder className="h-10 rounded-lg border border-dashed border-tp-line" aria-hidden="true" />
        </>
      )}
    </section>
  );
}
