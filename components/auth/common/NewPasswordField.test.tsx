import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import NewPasswordField from './NewPasswordField';

function Harness({ error }: { error?: string }) {
  const [value, setValue] = useState('');
  return <NewPasswordField id="pw" label="새 비밀번호" name="newPassword" value={value} onChange={setValue} error={error} />;
}

describe('새 비밀번호 칸 (D-079 · 06 SITE-05 공통 규칙)', () => {
  it('autocomplete new-password, 확인용 두 번째 칸 없음, 안내 문구', () => {
    render(<Harness />);
    const input = screen.getByLabelText('새 비밀번호');
    expect(input).toHaveAttribute('autocomplete', 'new-password');
    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getAllByLabelText(/비밀번호/, { selector: 'input' })).toHaveLength(1);
    expect(input).toHaveAccessibleDescription(/15자 이상이면 돼요\. 띄어쓰기를 넣은 긴 문장도 좋아요/);
  });

  it('보기 버튼으로 글자를 보였다 숨긴다', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const toggle = screen.getByRole('button', { name: '비밀번호 보기' });
    await user.click(toggle);
    expect(screen.getByLabelText('새 비밀번호')).toHaveAttribute('type', 'text');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('글자 수 n/15, 15자가 되면 ✓', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getByText('0/15')).toBeInTheDocument();
    await user.type(screen.getByLabelText('새 비밀번호'), 'a'.repeat(14));
    expect(screen.getByText('14/15')).toBeInTheDocument();
    expect(screen.queryByText('✓')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('새 비밀번호'), 'b');
    expect(screen.getByText('15/15')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('오류는 칸 바로 아래 한 줄 + aria-invalid + aria-describedby', () => {
    render(<Harness error="유출된 적이 있는 비밀번호예요. 다른 비밀번호를 써 주세요." />);
    const input = screen.getByLabelText('새 비밀번호');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/유출된 적이 있는 비밀번호예요/);
  });
});
