"use client";

import { useEffect, useId } from 'react';

import type { Me } from '@/types/api';

import LoginForm from './LoginForm';

export const RELOGIN_TEXT = {
  title: '다시 로그인해 주세요',
  description: '로그인이 끝났어요. 다시 로그인하면 쓰던 내용을 이어서 저장해요.',
  cancel: '취소',
} as const;

interface ReloginDialogProps {
  /** 지금 계정 이메일 (채워 둔다) */
  email: string;
  onSignedIn: (me: Me) => void | Promise<void>;
  onCancel: () => void;
}

/**
 * ReloginDialog - 작성 중 로그인이 끝났을 때 쓰던 창 위에 뜨는 로그인 창 (US-34, D-072)
 * 화면 맨 위(z-90). Esc는 [취소]와 같고 아래 창에는 전하지 않는다 (아래 창의 '작성을 취소할까요?'가 뜨지 않게).
 * 구글·가입·약관 자리는 넣지 않는다 — 같은 계정으로 다시 들어오는 창이라서 (제가 정한 부분).
 */
export default function ReloginDialog({ email, onSignedIn, onCancel }: ReloginDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

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
        <LoginForm initialEmail={email} onSignedIn={onSignedIn} />
        <button type="button" onClick={onCancel} className="self-center rounded px-3 py-1.5 text-[13px] text-tp-muted">
          {RELOGIN_TEXT.cancel}
        </button>
      </div>
    </div>
  );
}
