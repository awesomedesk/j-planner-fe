import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Id } from '@/types/api';
import { CATEGORIES } from '@/test/fixtures';

import CategoryFilterDropdown from './CategoryFilterDropdown';
import CategoryFilterSheet from './CategoryFilterSheet';
import type { FilterReveal } from './useFilterReveal';

// D-056: 필터에서 빠진 카테고리로 저장하면 필터 목록이 저절로 펼쳐져 그 줄을 보여 주고, 잠시 뒤 닫힌다
// CATEGORIES: 1 미지정, 2 공부, 3 업무, 4 운동. 필터는 '공부'만 켜진 상태

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const reveal = (): FilterReveal => ({ categoryId: 3, key: 1 });

const renderDropdown = (r: FilterReveal | null, onChange = vi.fn()) => {
  const onRevealDone = vi.fn();
  const view = render(
    <CategoryFilterDropdown categories={CATEGORIES} filter={[2] as Id[]} onChange={onChange} onOpenManager={vi.fn()} reveal={r} onRevealDone={onRevealDone} />
  );
  return { ...view, onChange, onRevealDone };
};
const panel = () => screen.queryByRole('dialog', { name: '카테고리 선택' });
const row = (name: string) => screen.getByRole('checkbox', { name }).closest('label') as HTMLElement;
const trigger = () => screen.getByRole('button', { name: /카테고리 필터/ });
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('PC 필터 드롭다운이 저절로 펼쳐짐 (D-056)', () => {
  it('펼치고, 버튼이 커지며 빛 고리, 저장한 카테고리 줄에 연한 바탕', () => {
    renderDropdown(reveal());
    expect(panel()).toBeInTheDocument();
    expect(trigger()).toHaveAttribute('data-reveal-pulse');
    expect(row('업무')).toHaveAttribute('data-marked');
    expect(row('업무')).not.toHaveAttribute('data-glow');
  });

  it('0.5초 뒤 그 줄에 두 번째 빛 고리', () => {
    renderDropdown(reveal());
    advance(500);
    expect(row('업무')).toHaveAttribute('data-glow');
  });

  it('1.8초 뒤 저절로 닫힌다', () => {
    const { onRevealDone } = renderDropdown(reveal());
    advance(1799);
    expect(panel()).toBeInTheDocument();
    advance(1);
    expect(panel()).not.toBeInTheDocument();
    expect(onRevealDone).toHaveBeenCalled();
  });

  it('펼친 직후 0.4초 동안은 눌러도 반응 없음 (저장 두 번 누름 방지)', () => {
    const { onChange } = renderDropdown(reveal());
    fireEvent.click(screen.getByRole('checkbox', { name: '업무' }));
    expect(onChange).not.toHaveBeenCalled();
    advance(400);
    fireEvent.click(screen.getByRole('checkbox', { name: '업무' }));
    expect(onChange).toHaveBeenCalledWith([2, 3]);
  });

  it('목록을 누르거나 포커스하면 닫지 않는다', () => {
    renderDropdown(reveal());
    advance(600);
    fireEvent.pointerDown(row('운동'));
    advance(3000);
    expect(panel()).toBeInTheDocument();
  });

  it('0.4초 안에 누른 것은 붙잡은 것으로 보지 않는다', () => {
    renderDropdown(reveal());
    fireEvent.pointerDown(row('운동'));
    advance(1800);
    expect(panel()).not.toBeInTheDocument();
  });

  it('PC: 마우스를 목록 안에서 4px 넘게 움직이면 닫지 않음, 가만히 놓인 커서는 무시', () => {
    renderDropdown(reveal());
    advance(600);
    const box = panel() as HTMLElement;
    fireEvent.pointerMove(box, { clientX: 100, clientY: 100, pointerType: 'mouse' });
    fireEvent.pointerMove(box, { clientX: 102, clientY: 101, pointerType: 'mouse' });
    advance(1300);
    expect(panel()).not.toBeInTheDocument(); // 2px만 움직임 → 닫힘
  });

  it('PC: 4px 넘게 움직이면 그대로 둔다', () => {
    renderDropdown(reveal());
    advance(600);
    const box = panel() as HTMLElement;
    fireEvent.pointerMove(box, { clientX: 100, clientY: 100, pointerType: 'mouse' });
    fireEvent.pointerMove(box, { clientX: 106, clientY: 100, pointerType: 'mouse' });
    advance(3000);
    expect(panel()).toBeInTheDocument();
  });
});

describe('모바일 필터 시트가 저절로 펼쳐짐 (D-056)', () => {
  const renderSheet = (r: FilterReveal | null) => {
    const onChange = vi.fn();
    render(<CategoryFilterSheet categories={CATEGORIES} filter={[2]} onChange={onChange} onOpenManager={vi.fn()} reveal={r} onRevealDone={vi.fn()} />);
    return { onChange };
  };
  const sheet = () => screen.queryByRole('dialog', { name: '카테고리 필터' });

  it('아래 시트로 펼치고 저장한 줄 표시, 1.8초 뒤 고른 것 없이 닫힘', () => {
    const { onChange } = renderSheet(reveal());
    expect(sheet()).toBeInTheDocument();
    expect(row('업무')).toHaveAttribute('data-marked');
    advance(1800);
    expect(sheet()).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('시트 바깥을 누르면 1.8초를 기다리지 않고 바로 닫힌다 — 0.4초 안이어도, 필터는 그대로 (D-056 보완 2)', () => {
    const { onChange } = renderSheet(reveal());
    advance(100);
    const below = vi.fn();
    document.body.addEventListener('click', below);
    fireEvent.click(screen.getByTestId('category-filter-backdrop'));
    expect(sheet()).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(below).not.toHaveBeenCalled(); // 바깥 누름은 아래로 전달하지 않는다
    document.body.removeEventListener('click', below);
  });

  it('시트를 만지면 열린 채로 두고, 적용하면 반영', () => {
    const { onChange } = renderSheet(reveal());
    advance(500);
    fireEvent.pointerDown(row('업무'));
    fireEvent.click(screen.getByRole('checkbox', { name: '업무' }));
    advance(3000);
    fireEvent.click(screen.getByRole('button', { name: '적용 (2개)' }));
    expect(onChange).toHaveBeenCalledWith([2, 3]);
  });
});
