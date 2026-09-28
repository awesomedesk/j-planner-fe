import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES } from '@/test/fixtures';
import { SEED_SCHEDULES } from '@/test/seed';

import DateSheet from './DateSheet';

const setup = () => {
  const onClose = vi.fn();
  const onOpenDayPlan = vi.fn();
  render(
    <DateSheet
      date="2026-09-25"
      schedules={SEED_SCHEDULES}
      categoriesById={new Map(CATEGORIES.map((c) => [c.id, c]))}
      onOpenSchedule={vi.fn()}
      onOpenDayPlan={onOpenDayPlan}
      onClose={onClose}
    />
  );
  const handle = screen.getByRole('button', { name: '시트 닫기' });
  const sheet = screen.getByRole('region', { name: '9월 25일 (금) 날짜 시트' });
  return { onClose, onOpenDayPlan, handle, sheet };
};

beforeEach(() => {
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

describe('모바일 날짜 시트 (MO-01 ③, US-06)', () => {
  it('그날 일정과 하루 계획 보기', async () => {
    const { onOpenDayPlan } = setup();
    expect(screen.getByText('치과')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '하루 계획 보기' }));
    expect(onOpenDayPlan).toHaveBeenCalledWith('2026-09-25');
  });

  it('손잡이를 누르면 닫힌다', () => {
    const { handle, onClose } = setup();
    fireEvent.click(handle);
    expect(onClose).toHaveBeenCalled();
  });

  it('끌기 시작하면 포인터를 붙잡아 손잡이 밖에서 떼도 받는다 (US-06 검수)', () => {
    const { handle } = setup();
    fireEvent.pointerDown(handle, { pointerId: 7, clientY: 500 });
    expect(handle.setPointerCapture).toHaveBeenCalledWith(7);
  });

  it('끄는 동안 시트가 손가락을 따라 내려오고, 60px 넘게 끌고 떼면 닫힌다', () => {
    const { handle, sheet, onClose } = setup();
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 500 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 540 });
    expect(sheet.style.transform).toBe('translateY(40px)');
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 480 }); // 위로는 안 따라감
    expect(sheet.style.transform).toBe('translateY(0px)');
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 580 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 580 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('조금만 끌고 떼면 제자리로 돌아가고, 뒤따르는 클릭으로 닫히지 않는다', () => {
    const { handle, sheet, onClose } = setup();
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 500 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 530 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 530 });
    fireEvent.click(handle);
    expect(sheet.style.transform).toBe('');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('끌기가 취소되면(pointercancel) 제자리로', () => {
    const { handle, sheet, onClose } = setup();
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 500 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 600 });
    fireEvent.pointerCancel(handle, { pointerId: 1 });
    expect(sheet.style.transform).toBe('');
    expect(onClose).not.toHaveBeenCalled();
  });
});
