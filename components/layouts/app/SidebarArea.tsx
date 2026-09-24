"use client";

import ThemeButton from '@components/button/ThemeButton';
import Icon from '@components/icons/LineIcon';

import { SIDEBAR_SECTIONS, formatSidebarDate } from './appLayoutUtils';
import SidebarSections from './SidebarSections';

interface SidebarAreaProps {
  selectedDate: Date;
  isOpen: boolean;
  /** 태블릿(768~1023px): 열면 달력 위에 겹쳐 표시 (D-018) */
  isOverlay: boolean;
  onOpen: () => void;
  onClose: () => void;
  className?: string;
}

/**
 * SidebarArea - 오른쪽 사이드바 자리 (768px 이상)
 *
 * - 1024px 이상: 열린 상태로 시작, 폭 330px. 1920px 이상은 360px 고정 (D-018)
 * - 768~1023px: 닫힌 상태로 시작, 열면 달력 위에 겹쳐 표시
 * - 닫힘: 오른쪽 좁은 막대(열기 + 섹션 아이콘) (PC-04, D-021)
 * 섹션 내용(US-19), 열림 상태 기억(US-20), 설정 모드(US-21)는 M3에서 붙인다.
 */
export default function SidebarArea({ selectedDate, isOpen, isOverlay, onOpen, onClose, className = '' }: SidebarAreaProps) {
  if (!isOpen) {
    return (
      <aside aria-label="사이드바 (닫힘)" className={`w-14 shrink-0 flex-col items-center gap-2 border-l border-tp-line bg-tp-bg py-3 ${className}`}>
        <RailButton label="사이드바 열기" icon="sidebarOpen" onClick={onOpen} />
        <div className="w-7 border-t border-tp-line" />
        {SIDEBAR_SECTIONS.map((section) => (
          <RailButton key={section.type} label={section.label} icon={section.icon} onClick={onOpen} />
        ))}
      </aside>
    );
  }

  const panel = (
    <aside
      aria-label="사이드바"
      className={`flex h-full w-[330px] shrink-0 flex-col gap-2.5 overflow-y-auto border-l border-tp-line bg-tp-bg p-3 wide:w-[360px] ${
        isOverlay ? 'shadow-2xl' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold" suppressHydrationWarning>
          {formatSidebarDate(selectedDate)}
        </h2>
        <div className="flex gap-1.5">
          <ThemeButton iconOnly aria-label="사이드바 설정">
            <Icon name="gear" size={15} />
          </ThemeButton>
          <ThemeButton iconOnly aria-label="사이드바 닫기" onClick={onClose}>
            <Icon name="chevronRight" />
          </ThemeButton>
        </div>
      </div>
      <SidebarSections />
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

function RailButton({ label, icon, onClick }: { label: string; icon: 'sidebarOpen' | 'todo' | 'dday' | 'diary' | 'memo'; onClick: () => void }) {
  return (
    <button
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
