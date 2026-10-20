import { act, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { json, mockApi, problem } from '@/test/mockApi';
import { makeStore } from '@store/store';

import ResetPasswordPage from '../password/ResetPasswordPage';
import VerifyEmailPage from '../signup/VerifyEmailPage';

vi.mock('@utils/navigation', () => ({ goTo: vi.fn(), currentPath: () => window.location.pathname + window.location.search }));

const TOKEN = 'a'.repeat(43);

afterEach(() => window.history.replaceState(null, '', '/'));

/**
 * 서버(next build·dev)는 주소의 토큰을 모르고 그린다 → 브라우저가 토큰을 읽고 그린 화면과 달라지면
 * hydration 오류가 나고 화면이 다시 그려진다 (2026-10-20 Chrome 확인 때 발견)
 */
const serverThenBrowser = async (path: string, page: () => ReactElement) => {
  mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요') });
  window.history.replaceState(null, '', path); // 서버: 토큰 없음
  const html = renderToString(<Provider store={makeStore()}>{page()}</Provider>);

  window.history.replaceState(null, '', `${path}?token=${TOKEN}`); // 브라우저: 메일 링크로 염
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  const recoverable = vi.fn();
  const root = await act(async () => hydrateRoot(container, <Provider store={makeStore()}>{page()}</Provider>, { onRecoverableError: recoverable }));
  return { html, recoverable, cleanup: () => { act(() => root.unmount()); container.remove(); } };
};

describe('메일 링크 화면 — 서버와 브라우저가 같은 첫 화면 (US-33·35, D-079 · SITE-05d·f)', () => {
  it('/signup/verify: 서버 HTML에 "링크 만료"를 그리지 않고, hydration 오류 없이 [인증 끝내기]가 뜬다', async () => {
    const { html, recoverable, cleanup } = await serverThenBrowser('/signup/verify', () => <VerifyEmailPage />);
    expect(html).not.toContain('만료');
    expect(await screen.findByRole('button', { name: '인증 끝내기' })).toBeInTheDocument();
    expect(recoverable).not.toHaveBeenCalled();
    cleanup();
  });

  it('/password/reset: 서버 HTML에 "링크 만료"를 그리지 않고, hydration 오류 없이 새 비밀번호 칸이 뜬다', async () => {
    const { html, recoverable, cleanup } = await serverThenBrowser('/password/reset', () => <ResetPasswordPage />);
    expect(html).not.toContain('만료');
    expect(await screen.findByLabelText('새 비밀번호')).toBeInTheDocument();
    expect(recoverable).not.toHaveBeenCalled();
    cleanup();
  });
});
