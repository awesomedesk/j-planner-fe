"use client";

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { meUpdated, selectAuth } from '@store/slices/authSlice';
import { authApi } from '@utils/api';

import DeleteAccountCard from './cards/DeleteAccountCard';
import DevicesCard from './cards/DevicesCard';
import LoginMethodsCard from './cards/LoginMethodsCard';
import PasswordCard from './cards/PasswordCard';
import ProfileCard from './cards/ProfileCard';
import { ReauthProvider } from './reauth/ReauthContext';
import { clearGoogleFlow, peekGoogleFlow, type GoogleFlow } from './utils/googleFlow';

/** 구글에서 돌아온 결과 (`/me?reauth=google|linked=google|error=…`, 08 13-4·13-5) */
type GoogleResult = { tone: 'ok' | 'error'; text: string; reauthed?: boolean };

const RESULT_KEYS = ['reauth', 'linked', 'error'];

function readGoogleResult(search: string, flow: GoogleFlow | null): GoogleResult | null {
  const params = new URLSearchParams(search);
  if (params.get('reauth') === 'google') return { tone: 'ok', text: '본인 확인이 끝났어요. 진행할 작업을 다시 선택해 주세요.', reauthed: true };
  if (params.get('linked') === 'google') return { tone: 'ok', text: '구글을 연결했어요' };
  switch (params.get('error')) {
    case null:
      return null;
    case 'GOOGLE_ALREADY_LINKED':
      return { tone: 'error', text: '이 구글 계정은 다른 계정에 연결돼 있어요' };
    case 'GOOGLE_ACCOUNT_MISMATCH':
      return { tone: 'error', text: '연결된 구글 계정으로 다시 확인해 주세요' };
    case 'IDENTITY_ALREADY_CONNECTED':
      return { tone: 'error', text: '이미 구글이 연결돼 있어요' };
    default:
      // GOOGLE_FAILED·모르는 코드: 본인 확인으로 갔다 왔는지 연결로 갔다 왔는지로 문구를 고른다 (제가 정한 부분)
      return flow === 'reauth'
        ? { tone: 'error', text: '구글 본인 확인을 마치지 못했어요. 다시 시도해 주세요.' }
        : { tone: 'error', text: '구글 연결을 마치지 못했어요' };
  }
}

/**
 * MyAccountPage - 내 계정 `/me` (US-37, D-085·D-091 · 06 SITE-09)
 * 카드 순서: 기본 정보 → 비밀번호 → 로그인 수단 → 로그인한 기기 → 회원 탈퇴. 각 카드는 자기 버튼으로만 보낸다.
 * 로그인은 RequireLogin이 확인한다 (아니면 /login?next=/me). 구글 결과 주소는 읽은 뒤 지운다.
 */
export default function MyAccountPage() {
  const dispatch = useAppDispatch();
  const { me } = useAppSelector(selectAuth);
  const [result] = useState(() => readGoogleResult(window.location.search, peekGoogleFlow()));
  const [reauthedAt] = useState(() => (result?.reauthed ? Date.now() : null));
  const [sessionsKey, setSessionsKey] = useState(0);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    clearGoogleFlow();
    const params = new URLSearchParams(window.location.search);
    if (!RESULT_KEYS.some((key) => params.has(key))) return;
    RESULT_KEYS.forEach((key) => params.delete(key));
    const rest = params.toString();
    window.history.replaceState(null, '', rest ? `${window.location.pathname}?${rest}` : window.location.pathname);
  }, []);

  /** 비밀번호·로그인 수단이 바뀌면 내 정보를 다시 받는다 (hasPassword·loginMethods) */
  const refreshMe = useCallback(async () => {
    try {
      dispatch(meUpdated(await authApi.me()));
    } catch {
      // 못 받으면 지금 정보를 그대로 둔다 (다음 화면 열 때 다시 받음)
    }
  }, [dispatch]);

  if (!me) return null;

  const focusPassword = () => {
    passwordRef.current?.scrollIntoView?.({ block: 'center' });
    passwordRef.current?.focus();
  };

  return (
    <ReauthProvider hasPassword={me.hasPassword} hasGoogle={me.loginMethods.includes('GOOGLE')} confirmedAt={reauthedAt}>
      <main className="min-h-dvh bg-tp-bg text-tp-text">
        <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 px-4 py-6">
          <Link href="/" className="self-start text-[13px] font-medium text-tp-muted underline-offset-2 hover:underline">
            <span aria-hidden="true">← </span>달력으로 돌아가기
          </Link>
          <h1 className="text-xl font-bold">내 계정</h1>

          {result && (
            <p
              role={result.tone === 'ok' ? 'status' : 'alert'}
              className={`rounded-lg px-4 py-3 text-sm ${result.tone === 'ok' ? 'bg-success-bg text-success' : 'border border-danger-line bg-white text-danger'}`}
            >
              {result.text}
            </p>
          )}

          <ProfileCard me={me} />
          <PasswordCard
            me={me}
            inputRef={passwordRef}
            onChanged={() => {
              void refreshMe();
              setSessionsKey((k) => k + 1);
            }}
          />
          <LoginMethodsCard me={me} onAddPassword={focusPassword} onChanged={() => void refreshMe()} />
          <DevicesCard refreshKey={sessionsKey} />
          <DeleteAccountCard />
        </div>
      </main>
    </ReauthProvider>
  );
}
