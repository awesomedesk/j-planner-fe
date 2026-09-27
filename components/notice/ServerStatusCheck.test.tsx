import { act, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { showNotice } from '@store/slices/noticeSlice';

import NoticeCenter from './NoticeCenter';
import ServerStatusCheck, { SERVER_UNREACHABLE_MESSAGE } from './ServerStatusCheck';

const App = () => (
  <>
    <ServerStatusCheck />
    <NoticeCenter />
    <main>달력</main>
  </>
);

describe('서버 상태 확인 (US-03)', () => {
  it('앱을 열 때 GET /health 를 한 번 부르고, 정상이면 안내가 없다', async () => {
    const api = mockApi({ 'GET /health': () => json(200, { status: 'UP' }) });
    renderWithStore(<App />);
    await waitFor(() => expect(api.calls('GET /health')).toHaveLength(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('서버에 닿지 않으면 짧은 안내만 띄우고 화면은 그대로', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    renderWithStore(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent(SERVER_UNREACHABLE_MESSAGE);
    expect(screen.getByRole('main')).toHaveTextContent('달력');
  });

  it('서버가 5xx 로 답해도 같은 안내', async () => {
    mockApi({ 'GET /health': () => json(503, { status: 'DOWN' }) });
    renderWithStore(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent(SERVER_UNREACHABLE_MESSAGE);
  });
});

describe('안내 (US-03)', () => {
  it('4초 뒤 사라지고, × 로 바로 닫을 수 있다', async () => {
    const { store, user } = renderWithStore(<NoticeCenter />);
    act(() => { store.dispatch(showNotice('저장했어요', 'info')); });
    await user.click(screen.getByRole('button', { name: '안내 닫기' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    vi.useFakeTimers();
    act(() => { store.dispatch(showNotice('다시 시도하세요')); });
    expect(screen.getByRole('alert')).toHaveTextContent('다시 시도하세요');
    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('같은 문구는 겹쳐 띄우지 않는다', () => {
    const { store } = renderWithStore(<NoticeCenter />);
    act(() => {
      store.dispatch(showNotice('서버 오류'));
      store.dispatch(showNotice('서버 오류'));
    });
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });
});
