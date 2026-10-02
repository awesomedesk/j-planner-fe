import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import MobileAddMenu from './MobileAddMenu';
import PcAddMenu from './PcAddMenu';

describe('PC·태블릿 헤더 추가 (PC-01 ④, TAB-01)', () => {
  it('"추가" 버튼은 하나이고, 누르면 일정/Todo/D-Day 선택지 (US-05 수정 요청)', async () => {
    const user = userEvent.setup();
    render(<PcAddMenu onSelect={vi.fn()} />);
    const add = screen.getAllByRole('button', { name: '추가' });
    expect(add).toHaveLength(1);
    await user.click(add[0]);
    expect(add[0]).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('menuitem').map((m) => m.textContent)).toEqual(['일정', 'Todo', 'D-Day']);
  });

  it('Todo는 열림(US-12), D-Day는 아직 흐리게 막아 둔다 (D-040)', async () => {
    const user = userEvent.setup();
    render(<PcAddMenu onSelect={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: '추가' }));
    expect(screen.getByRole('menuitem', { name: '일정' })).toBeEnabled();
    expect(screen.getByRole('menuitem', { name: 'Todo' })).toBeEnabled();
    expect(screen.getByRole('menuitem', { name: 'D-Day' })).toBeDisabled();
  });

  it('일정을 고르면 SCHEDULE로 알리고 메뉴가 닫힌다', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PcAddMenu onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: '추가' }));
    await user.click(screen.getByRole('menuitem', { name: '일정' }));
    expect(onSelect).toHaveBeenCalledWith('SCHEDULE');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('Esc 또는 바깥을 누르면 닫힌다', async () => {
    const user = userEvent.setup();
    render(<div><p>바깥</p><PcAddMenu onSelect={vi.fn()} /></div>);
    await user.click(screen.getByRole('button', { name: '추가' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '추가' }));
    await user.click(screen.getByText('바깥'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

describe('모바일 + 버튼 (MO-07, D-021)', () => {
  it('+ → × 로 바뀌고 선택지가 펼쳐진다, 일정 고르면 SCHEDULE', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<MobileAddMenu onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: '추가' }));
    expect(screen.getByRole('button', { name: '추가 닫기' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Todo 추가' })).toBeEnabled();
    expect(screen.getByRole('menuitem', { name: 'D-Day 추가' })).toBeDisabled();
    await user.click(screen.getByRole('menuitem', { name: '일정 추가' }));
    expect(onSelect).toHaveBeenCalledWith('SCHEDULE');
    expect(screen.getByRole('button', { name: '추가' })).toBeInTheDocument();
  });

  it('× 를 누르면 닫힌다', async () => {
    const user = userEvent.setup();
    render(<MobileAddMenu onSelect={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: '추가' }));
    await user.click(screen.getByRole('button', { name: '추가 닫기' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
