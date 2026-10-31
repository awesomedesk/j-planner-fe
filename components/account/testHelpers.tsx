import { screen, within } from '@testing-library/react';

import RequireLogin from '@components/auth/RequireLogin';
import NoticeCenter from '@components/notice/NoticeCenter';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';

import MyAccountPage from './MyAccountPage';

/** 내 계정 화면 테스트 공통 (US-37, D-091 · 06 SITE-09) */

export const ME = { email: 'qa-fe@example.com', name: '검수', hasPassword: true, loginMethods: ['EMAIL'] };
export const ME_WITH_GOOGLE = { ...ME, loginMethods: ['EMAIL', 'GOOGLE'] };
export const ME_GOOGLE_ONLY = { ...ME, hasPassword: false, loginMethods: ['GOOGLE'] };
export const GOOGLE_IDENTITY = { provider: 'GOOGLE', email: 'qa-fe@gmail.example.com', linkedAt: '2026-10-20T09:30:00' };

export const SESSIONS = [
  { id: 'aaa111', device: 'Chrome · macOS', loggedInAt: '2026-10-30T09:00:00', lastUsedAt: '2026-10-31T15:20:00', ipPrefix: '211.36.*.*', current: true },
  { id: 'bbb222', device: 'Safari · iOS', loggedInAt: '2026-10-28T21:05:00', lastUsedAt: '2026-10-29T08:10:00', ipPrefix: '118.235.*.*', current: false },
];

export const REAUTH_REQUIRED = () => problem(403, 'REAUTH_REQUIRED', '본인 확인이 필요해요');
export const REAUTH_FAILED = () =>
  problem(400, 'REAUTH_FAILED', '비밀번호가 맞지 않아요', [{ field: 'password', message: '비밀번호가 맞지 않아요' }]);

type Routes = Parameters<typeof mockApi>[0];

/** 로그인한 회원 + 연결 수단·기기 목록 (필요한 것만 바꿔 끼움) */
export function signedIn(routes: Routes = {}, me: object = ME, identities: object[] = []) {
  return mockApi({
    'GET /auth/csrf': () => json(204),
    'GET /me': () => json(200, me),
    'GET /me/identities': () => json(200, identities),
    'GET /me/sessions': () => json(200, SESSIONS),
    ...routes,
  });
}

/** `/me` 화면 (실제 페이지처럼 RequireLogin 안에) */
export function openAccount(search = '') {
  window.history.replaceState(null, '', `/me${search}`);
  return renderWithStore(
    <>
      <RequireLogin>
        <MyAccountPage />
      </RequireLogin>
      <NoticeCenter />
    </>
  );
}

export type User = ReturnType<typeof openAccount>['user'];

/** 카드 (제목으로 찾음) */
export const card = async (name: string) => within(await screen.findByRole('region', { name }));

/** '본인 확인이 필요해요' 창 */
export const reauthDialog = async () => within(await screen.findByRole('dialog', { name: '본인 확인이 필요해요' }));
