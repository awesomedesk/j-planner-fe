import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@utils/api';
import { makeStore } from '@store/store';

import { useErrorNotice } from './useErrorNotice';

const setup = () => {
  const store = makeStore();
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const { result } = renderHook(() => useErrorNotice(), { wrapper });
  return { notify: result.current, store };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('오류 안내 (US-03) — 둘러보기에서 막은 저장은 오류로 남기지 않음 (US-40, #351 PO 답 2026-11-14)', () => {
  it('DEMO_READ_ONLY: 콘솔 오류도, 안내 문구도 없다 (요청을 보내지 않은 정상 경계)', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { notify, store } = setup();
    notify(new ApiError({ message: '', status: 0, code: 'DEMO_READ_ONLY' }));
    expect(consoleError).not.toHaveBeenCalled();
    expect(JSON.stringify(store.getState().notice)).not.toMatch(/"message":"[^"]+"/);
  });

  it('그 밖의 오류(네트워크·서버)는 그대로 콘솔 오류 + 안내 — 감추지 않는다', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { notify } = setup();
    notify(new ApiError({ message: '서버에 연결할 수 없어요. 잠시 후 다시 시도하세요.', status: 0, code: 'NETWORK_ERROR' }));
    notify(new ApiError({ message: '잠시 후 다시 시도해 주세요.', status: 500, code: 'INTERNAL_ERROR' }));
    expect(consoleError).toHaveBeenCalledTimes(2);
    expect(consoleError.mock.calls[0][0]).toBe('[ERROR]');
  });
});
