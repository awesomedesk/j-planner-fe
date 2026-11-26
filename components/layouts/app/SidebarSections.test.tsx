import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithStore } from '@/test/render';

import SidebarSections from './SidebarSections';

describe('사이드바 섹션 내용 자리 (US-25 연결 지점)', () => {
  it('내용을 꽂은 섹션은 그 내용, 나머지는 지금처럼 빈 틀 (메모는 처음 접혀 있어 펼쳐서 본다)', async () => {
    const { user } = renderWithStore(<SidebarSections content={{ MEMO: ({ header }) => <>{header()}<p>메모 3개</p></> }} />);
    await user.click(screen.getByRole('button', { name: '메모' }));
    const memo = screen.getByRole('region', { name: '메모' });
    expect(within(memo).getByText('메모 3개')).toBeInTheDocument();
    expect(memo.querySelector('[data-placeholder]')).toBeNull();
    expect(screen.getByRole('region', { name: 'D-Day' }).querySelector('[data-placeholder]')).not.toBeNull();
  });

  it('섹션 머리 오른쪽에 내용의 버튼을 둘 수 있다 (D-055: n개 · +)', async () => {
    const { user } = renderWithStore(<SidebarSections content={{ MEMO: ({ header }) => header(<button type="button">새 메모</button>) }} />);
    await user.click(screen.getByRole('button', { name: '메모' }));
    const heading = screen.getByRole('heading', { name: '메모' });
    expect(within(heading.parentElement as HTMLElement).getByRole('button', { name: '새 메모' })).toBeInTheDocument();
  });
});
