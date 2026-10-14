"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';

import { useAppDispatch } from '@/app/hooks';
import ThemeButton from '@components/button/ThemeButton';
import { INPUT_CLASS } from '@components/form/formStyles';
import { showNotice } from '@store/slices/noticeSlice';
import { authApi, isApiError, toErrorMessage } from '@utils/api';
import { safeNextPath } from '@utils/auth/nextPath';
import { goTo } from '@utils/navigation';

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
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 늦추기(429) 남은 초. 0이면 다시 시도할 수 있음 */
  const [waitSeconds, setWaitSeconds] = useState(0);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (waitSeconds <= 0) return;
    const timer = setTimeout(() => setWaitSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [waitSeconds]);

  const notReady = () => dispatch(showNotice(NOT_READY_MESSAGE, 'info'));
  const locked = sending || waitSeconds > 0;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (sendingRef.current || waitSeconds > 0) return;
    sendingRef.current = true;
    setSending(true);
    setError(null);
    try {
      await authApi.login({ email, password });
      goTo(safeNextPath(new URLSearchParams(window.location.search).get('next')));
    } catch (e) {
      setError(toErrorMessage(e));
      if (isApiError(e) && e.status === 429 && e.retryAfterSeconds) setWaitSeconds(e.retryAfterSeconds);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  return (
    <section className="flex w-full flex-col gap-4 bg-white px-5 py-8 text-ink fold:max-w-[400px] fold:rounded-2xl fold:border fold:border-tp-line fold:px-8 fold:shadow-sm">
      <h1 className="text-center text-xl font-bold">J의 계획</h1>

      <LaterButton label="구글로 계속하기" onClick={notReady} block />

      <div className="flex items-center gap-3 text-xs text-tp-muted" aria-hidden="false">
        <span className="h-px flex-1 bg-tp-line" />
        <span>또는</span>
        <span className="h-px flex-1 bg-tp-line" />
      </div>

      <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor={emailId} className="text-[13px] font-medium">
            이메일
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={error ? errorId : undefined}
            className={INPUT_CLASS}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={passwordId} className="text-[13px] font-medium">
            비밀번호
          </label>
          <div className="relative">
            <input
              id={passwordId}
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={error ? errorId : undefined}
              className={`${INPUT_CLASS} pr-14`}
            />
            <button
              type="button"
              aria-pressed={showPassword}
              aria-label="비밀번호 보기"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-2 my-auto h-7 rounded px-2 text-xs text-tp-muted"
            >
              {showPassword ? '숨기기' : '보기'}
            </button>
          </div>
        </div>

        {/* 오류 한 줄 자리 (D-072) — 자리를 비워 두어 문구가 생겨도 카드가 덜 흔들리게 */}
        <div className="min-h-5 text-[13px] text-danger">
          {error && (
            <p id={errorId} role="alert">
              {error}
              {waitSeconds > 0 && <span className="block">{waitSeconds}초 뒤에 다시 시도할 수 있어요</span>}
            </p>
          )}
        </div>

        <ThemeButton type="submit" variant="primary" size="md" disabled={locked} className="w-full disabled:opacity-60">
          로그인
        </ThemeButton>
      </form>

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
