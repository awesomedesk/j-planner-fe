"use client";

import { useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@/app/hooks';
import { selectAuth } from '@store/slices/authSlice';

import AccountMenuItems from './AccountMenuItems';

/**
 * AccountMenuButton - PC·태블릿 헤더 맨 끝(⚙ 다음) 동그란 계정 버튼 (US-34, D-072)
 * 이름 첫 글자. 누르면 아래로 계정 메뉴. 바깥을 누르거나 Esc면 닫힌다.
 */
export default function AccountMenuButton() {
  const { me } = useAppSelector(selectAuth);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element;
      // 확인 창(모든 기기 로그아웃)은 메뉴 밖에 떠도 메뉴의 일부
      if (containerRef.current?.contains(target) || target.closest?.('[role="alertdialog"]')) return;
      setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  if (!me) return null;
  const initial = Array.from(me.name.trim() || me.email)[0]?.toUpperCase() ?? '?';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="계정 메뉴"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-tp-secondary-line bg-tp-secondary text-sm font-bold text-tp-on-secondary"
      >
        {initial}
      </button>
      {isOpen && (
        <div
          role="dialog"
          aria-label="계정"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-tp-line bg-tp-bg p-3 shadow-lg"
        >
          <AccountMenuItems />
        </div>
      )}
    </div>
  );
}
