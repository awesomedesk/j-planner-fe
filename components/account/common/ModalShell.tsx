"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';

import { useLatest } from '@utils/hooks/useLatest';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalShellProps {
  /** 확인만 묻는 창은 alertdialog */
  role?: 'dialog' | 'alertdialog';
  title: string;
  description?: ReactNode;
  /** Esc·바깥 누름 */
  onCancel: () => void;
  /** 처음 초점 (없으면 창 안 첫 칸·버튼) */
  initialFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
}

/**
 * 내 계정의 대화창 틀 (US-37, 06 SITE-09) — 본인 확인·해제/로그아웃/탈퇴 확인
 * - 모바일은 전체 폭, 600px 이상은 가운데 카드
 * - 초점 가두기: Tab·Shift+Tab이 창 안에서만 돈다. Esc는 [취소]와 같다
 * - 닫히면 창을 연 버튼으로 초점을 돌려준다
 */
export default function ModalShell({ role = 'dialog', title, description, onCancel, initialFocusRef, children }: ModalShellProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCancelRef = useLatest(onCancel);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    (initialFocusRef?.current ?? focusables()[0])?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCancelRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const inside = panel?.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      if (opener?.isConnected) opener.focus();
    };
    // 창이 열려 있는 동안 한 번만 (처음 초점·연 버튼 기억)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center fold:items-center fold:p-4">
      <div className="absolute inset-0 bg-black/45" aria-hidden="true" onClick={onCancel} />
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative flex w-full flex-col gap-3 rounded-t-2xl bg-white p-5 text-ink shadow-2xl fold:max-w-[400px] fold:rounded-2xl fold:p-6"
      >
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="text-sm text-tp-muted">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
