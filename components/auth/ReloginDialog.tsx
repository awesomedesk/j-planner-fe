"use client";

import { useEffect, useId, useRef, useState } from 'react';

import type { Me } from '@/types/api';
import ThemeButton from '@components/button/ThemeButton';
import { authApi } from '@utils/api';
import { googleResultMessage, signInWithGooglePopup } from '@utils/auth/googleLogin';

import { OrDivider } from './common/AuthFrame';
import GoogleButton from './common/GoogleButton';
import LoginForm from './LoginForm';

export const RELOGIN_TEXT = {
  title: '다시 로그인해 주세요',
  description: '로그인이 끝났어요. 다시 로그인하면 쓰던 내용을 이어서 저장해요.',
  cancel: '취소',
} as const;

interface ReloginDialogProps {
  /** 지금 계정 이메일 (채워 둔다) */
  email: string;
  /** 다시 로그인함 (휴면 복원이면 restored, US-38) */
  onSignedIn: (me: Me, restored: boolean) => void | Promise<void>;
  onCancel: () => void;
}

/**
 * ReloginDialog - 작성 중 로그인이 끝났을 때 쓰던 창 위에 뜨는 로그인 창 (US-34, D-072)
 * 화면 맨 위(z-90). Esc는 [취소]와 같고 아래 창에는 전하지 않는다 (아래 창의 '작성을 취소할까요?'가 뜨지 않게).
 * 가입·약관 자리는 넣지 않는다 — 같은 계정으로 다시 들어오는 창이라서 (제가 정한 부분).
 * [Google로 계속하기] (US-36 AC4): 팝업으로 구글 로그인 → 끝 화면이 알리면 GET /me → onSignedIn
 * (같은 계정인지는 RequireLogin이 본다). 순서는 /login과 같게 구글 → 또는 → 이메일 (제가 정한 부분).
 */
export default function ReloginDialog({ email, onSignedIn, onCancel }: ReloginDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const google = useGoogleRelogin(onSignedIn);

  useEffect(() => {
    // 아래 DialogFrame은 window에서 Esc를 받으므로, 그보다 먼저(캡처 단계) 받아 멈춘다
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onCancel();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative flex w-full max-w-[360px] flex-col gap-3 rounded-2xl bg-white p-6 text-ink shadow-2xl"
      >
        <h2 id={titleId} className="text-lg font-bold">
          {RELOGIN_TEXT.title}
        </h2>
        <p id={descriptionId} className="text-sm text-tp-muted">
          {RELOGIN_TEXT.description}
        </p>
        <GoogleButton onClick={google.start} disabled={google.waiting}>
          Google로 계속하기
        </GoogleButton>
        {google.error && (
          <p role="alert" className="text-center text-[13px] text-danger">
            {google.error}
          </p>
        )}
        <OrDivider />
        <LoginForm initialEmail={email} onSignedIn={onSignedIn} />
        <button type="button" onClick={onCancel} className="self-center rounded px-3 py-1.5 text-[13px] text-tp-muted">
          {RELOGIN_TEXT.cancel}
        </button>
      </div>
    </div>
  );
}

/** 팝업 구글 로그인 → 내 정보 → onSignedIn. 결과 문구는 06 SITE-05a */
function useGoogleRelogin(onSignedIn: (me: Me, restored: boolean) => void | Promise<void>) {
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const waitingRef = useRef(false);

  const start = async () => {
    if (waitingRef.current) return;
    waitingRef.current = true;
    setWaiting(true);
    setError(null);
    try {
      const result = await signInWithGooglePopup();
      if (!result) return; // 알리지 않고 닫음: 아무 일 없음
      if (!result.ok) {
        setError(googleResultMessage(result.code));
        return;
      }
      let me: Me;
      try {
        me = await authApi.me();
      } catch {
        setError(googleResultMessage('GOOGLE_FAILED')); // 끝났다는데 세션이 없음
        return;
      }
      await onSignedIn(me, result.restored);
    } finally {
      waitingRef.current = false;
      setWaiting(false);
    }
  };

  return { start: () => void start(), waiting, error };
}
