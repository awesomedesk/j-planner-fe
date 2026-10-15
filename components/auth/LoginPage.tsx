"use client";

import { useEffect } from 'react';

import { useAppDispatch } from '@/app/hooks';
import { showNotice } from '@store/slices/noticeSlice';
import { safeNextPath } from '@utils/auth/nextPath';
import { goTo } from '@utils/navigation';

import LoginForm from './LoginForm';
import { useSession } from './useSession';

/** 아직 없는 기능 자리를 눌렀을 때 (D-008 방식, D-072) */
export const NOT_READY_MESSAGE = '준비 중이에요';

/** 점선 자리 버튼 (구글·비밀번호 찾기·가입·약관) */
function LaterButton({ label, onClick, block = false }: { label: string; onClick: () => void; block?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border border-dashed border-tp-line px-3 py-2 text-[13px] text-tp-muted ${block ? 'w-full py-2.5 text-sm' : ''}`}
    >
      {label}
    </button>
  );
}

/**
 * LoginPage - 로그인 화면 `/login` (US-34, D-072 · SITE-05 로그인 부분)
 * 가운데 카드(모바일은 전체 폭). 성공하면 `?next=`(사이트 안 경로만) 또는 달력으로 페이지를 새로 연다.
 */
export default function LoginPage() {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'signedIn') goTo('/');
  }, [status]);

  if (status !== 'signedOut' && status !== 'error') return null;

  return (
    <main className="flex min-h-dvh items-start justify-center bg-white fold:items-center fold:bg-tp-bg fold:px-4 fold:py-10">
      <LoginCard />
    </main>
  );
}

function LoginCard() {
  const dispatch = useAppDispatch();
  const notReady = () => dispatch(showNotice(NOT_READY_MESSAGE, 'info'));

  return (
    <section className="flex w-full flex-col gap-4 bg-white px-5 py-8 text-ink fold:max-w-[400px] fold:rounded-2xl fold:border fold:border-tp-line fold:px-8 fold:shadow-sm">
      <h1 className="text-center text-xl font-bold">J의 계획</h1>

      <LaterButton label="구글로 계속하기" onClick={notReady} block />

      <div className="flex items-center gap-3 text-xs text-tp-muted" aria-hidden="false">
        <span className="h-px flex-1 bg-tp-line" />
        <span>또는</span>
        <span className="h-px flex-1 bg-tp-line" />
      </div>

      <LoginForm onSignedIn={() => goTo(safeNextPath(new URLSearchParams(window.location.search).get('next')))} />

      <div className="flex justify-center gap-2">
        <LaterButton label="비밀번호 찾기" onClick={notReady} />
        <LaterButton label="가입하기" onClick={notReady} />
      </div>

      <div className="flex justify-center gap-2 pt-2">
        <LaterButton label="이용약관" onClick={notReady} />
        <LaterButton label="개인정보처리방침" onClick={notReady} />
      </div>
    </section>
  );
}
