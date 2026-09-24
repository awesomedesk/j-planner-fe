import Icon from '@components/icons/LineIcon';

import { SIDEBAR_SECTIONS } from './appLayoutUtils';

/**
 * SidebarSections - 사이드바·날짜 시트의 섹션 자리 (D-013)
 * 미니 달력(맨 위 고정) → Todo · D-Day · 일기 · 메모. 내용은 M2·M3에서 채운다.
 */
export default function SidebarSections() {
  return (
    <div className="flex flex-col gap-2.5">
      <SectionFrame title="미니 달력" />
      {SIDEBAR_SECTIONS.map((section) => (
        <SectionFrame key={section.type} title={section.label} icon={section.icon} />
      ))}
    </div>
  );
}

function SectionFrame({ title, icon }: { title: string; icon?: 'todo' | 'dday' | 'diary' | 'memo' }) {
  return (
    <section className="flex flex-col gap-2 rounded-xl border border-tp-line bg-tp-panel p-3">
      <h3 className="flex items-center gap-1.5 text-sm font-bold">
        {icon && <Icon name={icon} size={15} />}
        {title}
      </h3>
      <div className="h-10 rounded-lg border border-dashed border-tp-line" aria-hidden="true" />
    </section>
  );
}
