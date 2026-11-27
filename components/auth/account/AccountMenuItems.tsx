"use client";

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';

import { useAppSelector } from '@/app/hooks';
import ThemeButton, { themeButtonClass } from '@components/button/ThemeButton';
import { selectAuth } from '@store/slices/authSlice';

import PolicyLinks from '@components/public/PolicyLinks';
import { useCalendarSettings } from '@components/settings/CalendarSettingsContext';

import { rememberAccountReturn, type AccountEntry } from './accountReturnFocus';
import { useLogout } from './useLogout';

export const LOGOUT_EVERYWHERE_CONFIRM = {
  title: '다른 기기에서도 모두 로그아웃할까요?',
  description: '이 기기도 로그아웃돼요.',
  confirm: '모두 로그아웃',
  cancel: '취소',
} as const;

const SECTION_TITLE = 'px-1 text-[13px] font-semibold text-tp-muted';

/**
 * '설정 및 계정' 내용 (D-109, US-34 D-072) — PC·태블릿 ⚙ 메뉴와 모바일 전체 화면이 같이 쓴다.
 * 계정(이름·이메일·[내 계정] /me) → [달력 설정 ›](US-26: 패널·전체 화면을 연다, onNavigate로 메뉴를 닫음) → [로그아웃]·[모든 기기에서 로그아웃](확인 창) → 약관·처리방침·문의.
 * 로그인 정보가 없으면(둘러보기, D-093) 계정·로그아웃은 빼고 달력 설정·약관만.
 * [내 계정]은 앱 안 이동이라 달력의 날짜·보기가 남고, 어느 진입 버튼(entry)으로 왔는지 기억해 돌아오면 그 버튼에 초점 (D-117).
 * 모든 기기 확인 창을 취소·Esc로 닫으면 [모든 기기에서 로그아웃]으로 초점을 돌려준다 (#382 시안).
 */
export default function AccountMenuItems({ entry, onNavigate }: { entry: AccountEntry; onNavigate?: () => void }) {
  const calendarSettings = useCalendarSettings();
  const { me } = useAppSelector(selectAuth);
  const { busy, logout, logoutEverywhere } = useLogout();
  const [confirming, setConfirming] = useState(false);
  const everywhereRef = useRef<HTMLButtonElement>(null);
  const cancelConfirm = () => {
    setConfirming(false);
    everywhereRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-2 text-tp-text">
      {me && (
        <section className="flex flex-col gap-2">
          <h3 className={SECTION_TITLE}>계정</h3>
          <div className="flex flex-col px-1">
            <span className="text-sm font-bold">{me.name}</span>
            <span className="break-all text-[13px] text-tp-muted">{me.email}</span>
          </div>
          <Link href="/me" onClick={() => rememberAccountReturn(entry)} className={`${themeButtonClass('primary', 'md')} w-full !justify-between`}>
            내 계정
            <span aria-hidden="true">›</span>
          </Link>
        </section>
      )}
      <section className="flex flex-col gap-2 pt-1">
        <h3 className={SECTION_TITLE}>달력 설정</h3>
        <ThemeButton
          size="md"
          data-calendar-settings-entry=""
          className="w-full !justify-between"
          onClick={() => {
            onNavigate?.();
            calendarSettings?.open(entry);
          }}
        >
          달력 설정
          <span aria-hidden="true">›</span>
        </ThemeButton>
      </section>
      {me && (
        <div className="flex flex-col gap-2 border-t border-tp-line pt-3">
          <ThemeButton size="md" className="w-full justify-center" disabled={busy} onClick={logout}>
            로그아웃
          </ThemeButton>
          <ThemeButton ref={everywhereRef} size="md" className="w-full justify-center" disabled={busy} onClick={() => setConfirming(true)}>
            모든 기기에서 로그아웃
          </ThemeButton>
        </div>
      )}
      {/* 설정 화면이 생기기 전까지 약관·처리방침·문의는 여기서 (US-39 AC2, #340 ④) */}
      <nav aria-label="약관과 문의" className="flex flex-wrap items-center justify-center gap-1 pt-1">
        <PolicyLinks />
        <a href="/contact" className="rounded-lg px-3 py-2 text-[13px] text-tp-muted underline-offset-2 hover:underline">
          문의
        </a>
      </nav>

      {confirming && (
        <LogoutEverywhereConfirm
          onCancel={cancelConfirm}
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
