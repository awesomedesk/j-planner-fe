"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';

import type { Me } from '@/types/api';
import ThemeButton from '@components/button/ThemeButton';
import { INPUT_CLASS } from '@components/form/formStyles';
import { authApi, isApiError, toErrorMessage } from '@utils/api';

interface LoginFormProps {
  /** 처음 채울 이메일 (다시 로그인 창은 지금 계정, D-072) */
  initialEmail?: string;
  /** 로그인 성공 (내 정보). 여기서 던진 오류도 오류 한 줄로 보인다 */
  onSignedIn: (me: Me) => void | Promise<void>;
}

/**
 * LoginForm - 이메일·비밀번호·오류 한 줄·[로그인] (US-34, D-072)
 * 로그인 화면(/login)과 작성 중 '다시 로그인' 창이 같이 쓴다.
 * - 실패 문구는 BE가 준 한 줄, 늦추기(429)면 'n초 뒤에 다시 시도할 수 있어요' + [로그인] 잠금(Retry-After)
 * - 보내는 중 잠금(두 번 눌러도 요청 한 번)
 */
export default function LoginForm({ initialEmail = '', onSignedIn }: LoginFormProps) {
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const [email, setEmail] = useState(initialEmail);
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

  const locked = sending || waitSeconds > 0;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (sendingRef.current || waitSeconds > 0) return;
    sendingRef.current = true;
    setSending(true);
    setError(null);
    try {
      const me = await authApi.login({ email, password });
      await onSignedIn(me);
    } catch (e) {
      setError(toErrorMessage(e));
      if (isApiError(e) && e.status === 429 && e.retryAfterSeconds) setWaitSeconds(e.retryAfterSeconds);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  return (
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
  );
}
