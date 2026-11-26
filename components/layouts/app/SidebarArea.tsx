"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

import type { LocalDate } from '@/types/api';
import type { SidebarItemType } from '@/types/calendar';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import ThemeButton from '@components/button/ThemeButton';
import Icon from '@components/icons/LineIcon';
import SidebarItemsEditor from '@components/sidebar/SidebarItemsEditor';
import { SIDEBAR_SECTIONS } from '@components/sidebar/sidebarItems';
import { saveSettings, selectSidebarItems } from '@store/slices/settingsSlice';
import { formatDayTitle } from '@utils/date/dateUtils';

import SidebarSections, { type SectionFocusRequest } from './SidebarSections';

interface SidebarAreaProps {
  selectedDate: LocalDate;
  isOpen: boolean;
  /** 태블릿(768~1023px): 열면 달력 위에 겹쳐 표시 (D-018) */
  isOverlay: boolean;
  /** 열기. 막대의 섹션 버튼이면 그 섹션 (펼쳐서 제목에 초점, v1.2) */
  onOpen: (section?: SidebarItemType) => void;
  onClose: () => void;
  /** 막대에서 연 섹션 → 펼치고 초점 */
  focusRequest?: SectionFocusRequest | null;
  className?: string;
}

/**
 * SidebarArea - 오른쪽 사이드바 자리 (768px 이상, US-19~21 · #394 db5f2fd)
 *
 * - 1024px 이상: 저장된 열림 상태(`/settings` sidebarOpen, 기본 열림), 폭 330px. 1920px 이상은 360px (D-018)
 * - 768~1023px: 닫힌 상태로 시작, 열면 달력 위에 겹쳐 표시 (저장하지 않음)
 * - 닫힘: 오른쪽 좁은 막대(열기 + 보이는 섹션 아이콘, 설정 순서) (PC-04, D-021)
 * - 머리: 날짜 제목 · [섹션 편집]/[완료] · 닫기(›). 편집 중에는 제목 '섹션 편집', 섹션 대신 편집 행. Esc는 편집만 끝낸다
 */
export default function SidebarArea({ selectedDate, isOpen, isOverlay, onOpen, onClose, focusRequest = null, className = '' }: SidebarAreaProps) {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectSidebarItems);
  const [editing, setEditing] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  /** 닫기로 막대가 되면 '사이드바 열기'에 초점 (v1.2) */
  const focusRailOnClose = useRef(false);

  useEffect(() => {
    if (!isOpen && focusRailOnClose.current) {
      focusRailOnClose.current = false;
      openButtonRef.current?.focus();
    }
  }, [isOpen]);

  // 막대에서 섹션을 열면 편집은 끝낸다
  const [handledRequest, setHandledRequest] = useState(focusRequest);
  if (focusRequest !== handledRequest) {
    setHandledRequest(focusRequest);
    if (focusRequest) setEditing(false);
  }

  if (!isOpen) {
    return (
      <aside aria-label="사이드바 (닫힘)" className={`w-14 shrink-0 flex-col items-center gap-2 border-l border-tp-line bg-tp-bg py-3 ${className}`}>
        <RailButton ref={openButtonRef} label="사이드바 열기" icon="sidebarOpen" onClick={() => onOpen()} />
        <div className="w-7 border-t border-tp-line" />
        {items
          .filter((item) => item.visible)
          .map((item) => {
            const section = SIDEBAR_SECTIONS.find((s) => s.type === item.type);
            return section ? <RailButton key={section.type} label={`${section.label} 열기`} icon={section.icon} onClick={() => onOpen(section.type)} /> : null;
          })}
      </aside>
    );
  }

  const close = () => {
    setEditing(false);
    focusRailOnClose.current = true;
    onClose();
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && editing) {
      event.stopPropagation();
      setEditing(false);
      editButtonRef.current?.focus();
    }
  };

  const panel = (
    <aside
      aria-label="사이드바"
      onKeyDown={handleKeyDown}
      className={`flex h-full w-[330px] shrink-0 flex-col gap-2.5 overflow-y-auto border-l border-tp-line bg-tp-bg p-3 wide:w-[360px] ${
        isOverlay ? 'shadow-2xl' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold">{editing ? '섹션 편집' : formatDayTitle(selectedDate)}</h2>
        <div className="flex shrink-0 gap-1.5">
          <ThemeButton ref={editButtonRef} size="sm" onClick={() => setEditing((value) => !value)}>
            {editing ? '완료' : '섹션 편집'}
          </ThemeButton>
          <ThemeButton iconOnly aria-label="사이드바 닫기" onClick={close}>
            <Icon name="chevronRight" />
          </ThemeButton>
        </div>
      </div>
      {editing ? (
        <SidebarItemsEditor items={items} onChange={(next) => void dispatch(saveSettings({ sidebarItems: next }))} />
      ) : (
        <SidebarSections focusRequest={focusRequest} />
      )}
    </aside>
  );

  if (!isOverlay) return <div className={`${className}`}>{panel}</div>;

  return (
    <div className={`${className}`}>
      {/* 겹쳐 열렸을 때도 막대 자리는 그대로 두어 달력 폭이 흔들리지 않게 한다 */}
      <div className="w-14 shrink-0 border-l border-tp-line bg-tp-bg" aria-hidden="true" />
      <div className="absolute inset-y-0 right-0 z-30 flex">{panel}</div>
    </div>
  );
}

type RailIcon = 'sidebarOpen' | 'todo' | 'dday' | 'diary' | 'memo';

function RailButton({ label, icon, onClick, ref }: { label: string; icon: RailIcon; onClick: () => void; ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-tp-line bg-tp-panel text-tp-primary"
    >
      <Icon name={icon} size={18} />
    </button>
  );
}
