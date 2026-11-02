"use client";

import { useRef } from 'react';

import { themeButtonClass } from '@components/button/ThemeButton';
import ModalShell from '@components/dialog/ModalShell';

/**
 * 둘러보기에서 저장하려 할 때 (US-40 AC4, 06 SITE-08) — 실제 요청을 보내기 전에 띄운다.
 * [가입하기]·[계속 둘러보기]·[로그인]. 계속 둘러보기(Esc)는 창만 닫고 쓰던 화면·입력은 그대로 둔다.
 * 세션 만료·재인증 창이 아니다.
 */
export default function SaveBlockedDialog({ onClose }: { onClose: () => void }) {
  const continueRef = useRef<HTMLButtonElement>(null);
  return (
    <ModalShell
      role="alertdialog"
      title="가입하면 저장돼요"
      description="둘러보기에서는 저장할 수 없어요. 입력한 내용은 가입해도 옮겨지지 않아요."
      onCancel={onClose}
      initialFocusRef={continueRef}
    >
      <div className="flex flex-col gap-2">
        <a href="/signup" className={`${themeButtonClass('primary', 'md')} w-full`}>
          가입하기
        </a>
        <button ref={continueRef} type="button" onClick={onClose} className={`${themeButtonClass('secondary', 'md')} w-full`}>
          계속 둘러보기
        </button>
        <a href="/login" className="self-center px-3 py-1.5 text-[13px] text-tp-muted underline underline-offset-2">
          로그인
        </a>
      </div>
    </ModalShell>
  );
}
