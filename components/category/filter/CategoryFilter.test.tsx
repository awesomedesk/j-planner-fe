import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Id } from '@/types/api';
import { CATEGORIES } from '@/test/fixtures';

import CategoryFilterDropdown from './CategoryFilterDropdown';
import CategoryFilterSheet from './CategoryFilterSheet';

type Filter = Id[] | null;

/** 바깥(AppShell)처럼 필터 값을 들고 있는 틀 */
function Harness({ variant, initial = null, onChange, onOpenManager }: { variant: 'pc' | 'mobile'; initial?: Filter; onChange: (f: Filter) => void; onOpenManager: () => void }) {
  const [filter, setFilter] = useState<Filter>(initial);
  const change = (next: Filter) => {
    setFilter(next);
    onChange(next);
  };
  const Component = variant === 'pc' ? CategoryFilterDropdown : CategoryFilterSheet;
  return <Component categories={CATEGORIES} filter={filter} onChange={change} onOpenManager={onOpenManager} />;
}

const setup = (variant: 'pc' | 'mobile', initial?: Filter) => {
  const onChange = vi.fn();
  const onOpenManager = vi.fn();
  const user = userEvent.setup();
  render(<Harness variant={variant} initial={initial} onChange={onChange} onOpenManager={onOpenManager} />);
  return { user, onChange, onOpenManager };
};

const trigger = () => screen.getByRole('button', { name: /카테고리 필터/ });
const box = (name: string) => screen.getByRole('checkbox', { name });

describe('PC 카테고리 필터 드롭다운 (US-11, D-015, PC-01 ③⑨)', () => {
  it("처음엔 '카테고리: 전체', 열면 모두 체크 + 검색·전체 선택·모두 해제·카테고리 관리", async () => {
    const { user } = setup('pc');
    expect(trigger()).toHaveTextContent('카테고리: 전체');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger());
    const panel = screen.getByRole('dialog', { name: '카테고리 선택' });
    expect(within(panel).getAllByRole('checkbox').map((c) => (c as HTMLInputElement).checked)).toEqual([true, true, true, true]);
    expect(within(panel).getAllByRole('checkbox').map((c) => c.getAttribute('aria-label'))).toEqual(['미지정', '공부', '업무', '운동']);
    expect(within(panel).getByRole('textbox', { name: '카테고리 검색' })).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: '전체 선택' })).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: '모두 해제' })).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: '카테고리 관리' })).toBeInTheDocument();
  });

  it('체크를 바꾸면 바로 적용되고 버튼에 고른 수', async () => {
    const { user, onChange } = setup('pc');
    await user.click(trigger());
    await user.click(box('운동'));
    expect(onChange).toHaveBeenLastCalledWith([1, 2, 3]);
    expect(trigger()).toHaveTextContent('카테고리: 3개');
    await user.click(box('운동'));
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(trigger()).toHaveTextContent('카테고리: 전체');
  });

  it('모두 해제 → 0개, 전체 선택 → 전체', async () => {
    const { user, onChange } = setup('pc');
    await user.click(trigger());
    await user.click(screen.getByRole('button', { name: '모두 해제' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(trigger()).toHaveTextContent('카테고리: 0개');
    await user.click(screen.getByRole('button', { name: '전체 선택' }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('검색하면 맞는 것만 보이고, 전체 선택·모두 해제는 보이는 것에만', async () => {
    const { user, onChange } = setup('pc');
    await user.click(trigger());
    await user.type(screen.getByRole('textbox', { name: '카테고리 검색' }), '업');
    expect(screen.getAllByRole('checkbox').map((c) => c.getAttribute('aria-label'))).toEqual(['업무']);
    await user.click(screen.getByRole('button', { name: '모두 해제' }));
    expect(onChange).toHaveBeenLastCalledWith([1, 2, 4]);
  });

  it('검색 결과가 없으면 안내', async () => {
    const { user } = setup('pc');
    await user.click(trigger());
    await user.type(screen.getByRole('textbox', { name: '카테고리 검색' }), '여행');
    expect(screen.getByText('맞는 카테고리가 없어요')).toBeInTheDocument();
  });

  it('Esc·바깥을 누르면 닫힌다', async () => {
    const { user } = setup('pc');
    await user.click(trigger());
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: '카테고리 선택' })).not.toBeInTheDocument();
    await user.click(trigger());
    await user.click(document.body);
    expect(screen.queryByRole('dialog', { name: '카테고리 선택' })).not.toBeInTheDocument();
  });

  it("'카테고리 관리' → 관리 창을 열고 드롭다운은 닫힌다 (D-016)", async () => {
    const { user, onOpenManager } = setup('pc');
    await user.click(trigger());
    await user.click(screen.getByRole('button', { name: '카테고리 관리' }));
    expect(onOpenManager).toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: '카테고리 선택' })).not.toBeInTheDocument();
  });
});

describe('모바일 카테고리 필터 시트 (US-11, MO-06)', () => {
  it("버튼은 '전체', 누르면 아래 시트: 검색·전체 선택·모두 해제·관리·적용", async () => {
    const { user } = setup('mobile');
    expect(trigger()).toHaveTextContent('전체');
    await user.click(trigger());
    const sheet = screen.getByRole('dialog', { name: '카테고리 필터' });
    expect(within(sheet).getByRole('heading', { name: '카테고리' })).toBeInTheDocument();
    expect(within(sheet).getByRole('textbox', { name: '카테고리 검색' })).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: '관리' })).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: '적용 (전체)' })).toBeInTheDocument();
  });

  it("고르는 동안은 적용되지 않고, '적용'을 누르면 닫히며 버튼에 고른 수", async () => {
    const { user, onChange } = setup('mobile');
    await user.click(trigger());
    await user.click(box('운동'));
    await user.click(box('미지정'));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '적용 (2개)' }));
    expect(onChange).toHaveBeenCalledWith([2, 3]);
    expect(screen.queryByRole('dialog', { name: '카테고리 필터' })).not.toBeInTheDocument();
    expect(trigger()).toHaveTextContent('2개');
  });

  it('적용하지 않고 바깥을 누르면 고른 것은 버리고 닫힌다', async () => {
    const { user, onChange } = setup('mobile', [2, 3]);
    await user.click(trigger());
    await user.click(box('운동'));
    await user.click(screen.getByTestId('category-filter-backdrop'));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(trigger());
    expect(box('운동')).not.toBeChecked();
    expect(box('공부')).toBeChecked();
  });

  it("'관리' → 카테고리 관리를 연다", async () => {
    const { user, onOpenManager } = setup('mobile');
    await user.click(trigger());
    await user.click(screen.getByRole('button', { name: '관리' }));
    expect(onOpenManager).toHaveBeenCalled();
  });
});
