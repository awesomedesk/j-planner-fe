"use client";

import { useEffect, useId, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import ThemeButton from '@components/button/ThemeButton';
import { selectAuth } from '@store/slices/authSlice';
import { showNotice } from '@store/slices/noticeSlice';

import { NOT_READY_MESSAGE } from '../LoginPage';
import { useLogout } from './useLogout';

export const LOGOUT_EVERYWHERE_CONFIRM = {
  title: '다른 기기에서도 모두 로그아웃할까요?',
  description: '이 기기도 로그아웃돼요.',
  confirm: '모두 로그아웃',
  cancel: '취소',
} as const;

/**
 * 계정 메뉴 내용 (US-34, D-072) — PC·태블릿 헤더 계정 메뉴와 모바일 ≡ 메뉴 맨 아래가 같이 쓴다.
 * 이름·이메일, '내 계정'(점선 자리, US-37), [로그아웃], [모든 기기에서 로그아웃](확인 창)
 */
export default function AccountMenuItems() {
  const dispatch = useAppDispatch();
  const { me } = useAppSelector(selectAuth);
  const { busy, logout, logoutEverywhere } = useLogout();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-2 text-tp-text">
      {me && (
        <div className="flex flex-col px-1 pb-1">
          <span className="text-sm font-bold">{me.name}</span>
          <span className="break-all text-[13px] text-tp-muted">{me.email}</span>
        </div>
      )}
      <button
        type="button"
        onClick={() => dispatch(showNotice(NOT_READY_MESSAGE, 'info'))}
        className="rounded-lg border border-dashed border-tp-line px-3 py-2 text-left text-[13px] text-tp-muted"
      >
        내 계정
      </button>
      <ThemeButton size="md" className="w-full justify-center" disabled={busy} onClick={logout}>
        로그아웃
      </ThemeButton>
      <ThemeButton size="md" className="w-full justify-center" disabled={busy} onClick={() => setConfirming(true)}>
        모든 기기에서 로그아웃
      </ThemeButton>

      {confirming && (
        <LogoutEverywhereConfirm
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            void logoutEverywhere();
          }}
        />
      )}
    </div>
  );
}

function LogoutEverywhereConfirm({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const titleId = useId();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onCancel();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/45" aria-hidden="true" onClick={onCancel} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex w-full max-w-[320px] flex-col gap-2 rounded-2xl bg-tp-bg p-5 text-tp-text shadow-2xl"
      >
        <h3 id={titleId} className="text-base font-bold">
          {LOGOUT_EVERYWHERE_CONFIRM.title}
        </h3>
        <p className="text-sm text-tp-muted">{LOGOUT_EVERYWHERE_CONFIRM.description}</p>
        <div className="mt-3 flex justify-end gap-2">
          <ThemeButton size="md" onClick={onCancel} autoFocus>
            {LOGOUT_EVERYWHERE_CONFIRM.cancel}
          </ThemeButton>
          <ThemeButton size="md" variant="primary" onClick={onConfirm}>
            {LOGOUT_EVERYWHERE_CONFIRM.confirm}
          </ThemeButton>
        </div>
      </div>
    </div>
  );
}
