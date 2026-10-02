import type { ReactNode } from 'react';

import type { SidebarItemType } from '@/types/calendar';
import Icon from '@components/icons/LineIcon';
import { SIDEBAR_SECTIONS } from '@components/sidebar/sidebarItems';

import { SIDEBAR_SECTION_SLOTS, type SidebarSectionSlot } from './sidebarSectionSlots';

interface SidebarSectionsProps {
  /** 섹션 내용 (기본 = sidebarSectionSlots). 없는 섹션은 빈 틀 */
  content?: Partial<Record<SidebarItemType, SidebarSectionSlot>>;
}

/**
 * SidebarSections - 사이드바·폴드 오른쪽 패널의 섹션 (D-013)
 * 미니 달력(맨 위 고정) → Todo · D-Day · 일기 · 메모.
 * 내용은 sidebarSectionSlots 한 곳에서 꽂는다 (US-25 연결 지점). 내용은 header(버튼)로 섹션 머리를 그린다
 */
export default function SidebarSections({ content = SIDEBAR_SECTION_SLOTS }: SidebarSectionsProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <SectionFrame title="미니 달력" />
      {SIDEBAR_SECTIONS.map((section) => {
        const slot = content[section.type];
        return (
          <SectionFrame key={section.type} title={section.label} icon={section.icon}>
            {slot && ((header) => slot({ header }))}
          </SectionFrame>
        );
      })}
    </div>
  );
}

type Icons = 'todo' | 'dday' | 'diary' | 'memo';

interface SectionFrameProps {
  title: string;
  icon?: Icons;
  /** 섹션 내용. 받은 header(버튼)로 머리를 그린다. 없으면 머리 + 빈 자리 */
  children?: false | ((header: (actions?: ReactNode) => ReactNode) => ReactNode);
}

function SectionFrame({ title, icon, children }: SectionFrameProps) {
  const header = (actions?: ReactNode) => (
    <div className="flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-1.5 text-sm font-bold">
        {icon && <Icon name={icon} size={15} />}
        {title}
      </h3>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  );
  return (
    <section aria-label={title} className="flex flex-col gap-2 rounded-xl border border-tp-line bg-tp-panel p-3">
      {children ? (
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
