import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DayListPopover from './DayListPopover';

afterEach(() => vi.restoreAllMocks());

const rect = (left: number, width: number) => ({ left, right: left + width, width, top: 0, bottom: 100, height: 100, x: left, y: 0, toJSON: () => ({}) }) as DOMRect;

describe('그날 목록 창이 화면 밖으로 넘치지 않게 (D-052 검수 ①)', () => {
  it('오른쪽으로 넘치면 넘친 만큼 + 여백 8px 왼쪽으로', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(178, 224)); // right 402
    Object.defineProperty(document.documentElement, 'clientWidth', { value: 388, configurable: true });
    render(<DayListPopover title="9월 23일 (수)" ariaLabel="목록" alignRight={false} onClose={vi.fn()}>내용</DayListPopover>);
    expect(screen.getByRole('dialog', { name: '목록' }).style.transform).toBe('translateX(-22px)');
  });

  it('왼쪽으로 넘치면 오른쪽으로', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(-30, 224));
    Object.defineProperty(document.documentElement, 'clientWidth', { value: 388, configurable: true });
    render(<DayListPopover title="9월 26일 (토)" ariaLabel="목록" alignRight onClose={vi.fn()}>내용</DayListPopover>);
    expect(screen.getByRole('dialog', { name: '목록' }).style.transform).toBe('translateX(38px)');
  });

  it('안에 들어오면 그대로', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(40, 224));
    Object.defineProperty(document.documentElement, 'clientWidth', { value: 388, configurable: true });
    render(<DayListPopover title="t" ariaLabel="목록" alignRight={false} onClose={vi.fn()}>내용</DayListPopover>);
    expect(screen.getByRole('dialog', { name: '목록' }).style.transform).toBe('');
  });
});
