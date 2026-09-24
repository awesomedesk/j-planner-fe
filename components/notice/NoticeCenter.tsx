"use client";

import { useEffect } from 'react';

import Icon from '@components/icons/LineIcon';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { dismissNotice, selectNotices, type Notice } from '@store/slices/noticeSlice';

/** 안내가 떠 있는 시간 (ms) */
const NOTICE_DURATION_MS = 4000;

/**
 * NoticeCenter - 화면 아래 가운데에 짧은 안내를 띄운다 (US-03)
 * 화면 어디서든 `dispatch(showNotice('…'))` 또는 `useErrorNotice()`로 띄운다.
 */
export default function NoticeCenter() {
  const notices = useAppSelector(selectNotices);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 tablet:bottom-6"
    >
      {notices.map((notice) => (
        <NoticeItem key={notice.id} notice={notice} />
      ))}
    </div>
  );
}

function NoticeItem({ notice }: { notice: Notice }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timer = window.setTimeout(() => dispatch(dismissNotice(notice.id)), NOTICE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [dispatch, notice.id]);

  return (
    <div
      role={notice.tone === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl bg-tp-dark px-4 py-3 text-sm text-tp-light shadow-lg"
    >
      {notice.tone === 'error' && <span className="h-2 w-2 shrink-0 rounded-full bg-danger" aria-hidden="true" />}
      <span className="min-w-0 flex-1">{notice.message}</span>
      <button type="button" aria-label="안내 닫기" onClick={() => dispatch(dismissNotice(notice.id))} className="shrink-0 opacity-80">
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}
