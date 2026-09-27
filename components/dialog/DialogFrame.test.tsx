import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import DialogFrame, { useDialogRequestClose } from './DialogFrame';

function CancelButton() {
  const requestClose = useDialogRequestClose();
  return (
    <button type="button" onClick={requestClose}>
      취소
    </button>
  );
}

const renderDialog = (isDirty: boolean) => {
  const onClose = vi.fn();
  const user = userEvent.setup();
  render(
    <DialogFrame title="일정 추가" onClose={onClose} isDirty={isDirty}>
      <CancelButton />
    </DialogFrame>
  );
  return { onClose, user };
};

describe('입력·관리 창 닫기 (D-037, D-039)', () => {
  it('바꾼 것이 없으면 바깥을 누르면 바로 닫힌다', async () => {
    const { onClose, user } = renderDialog(false);
    await user.click(screen.getByTestId('dialog-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('바꾼 것이 있으면 바깥 클릭 → "작성을 취소할까요?" 확인 창', async () => {
    const { onClose, user } = renderDialog(true);
    await user.click(screen.getByTestId('dialog-backdrop'));
    expect(screen.getByRole('alertdialog', { name: '작성을 취소할까요?' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('[계속 작성]은 확인 창만 닫고, [작성 취소]는 창을 닫는다 (D-039 문구)', async () => {
    const { onClose, user } = renderDialog(true);
    await user.click(screen.getByRole('button', { name: '닫기' }));
    await user.click(screen.getByRole('button', { name: '계속 작성' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '뒤로' }));
    await user.click(screen.getByRole('button', { name: '작성 취소' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Esc·창 안 취소 버튼도 같은 확인을 거친다', async () => {
    const { onClose, user } = renderDialog(true);
    await user.keyboard('{Escape}');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
