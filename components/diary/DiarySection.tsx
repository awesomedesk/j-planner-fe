"use client";

import type { ReactNode } from 'react';

import { useAppSelector } from '@/app/hooks';
import { selectSelectedDate } from '@store/slices/calendarSlice';

import { formatDayTitle } from '@utils/date/dateUtils';

import { useDiaryActions } from './DiaryActionsContext';
import { useDiaryEntry } from './hooks/useDiaryEntry';
import { diaryPreview } from './utils/diaryUtils';

/**
 * DiarySection - PC 사이드바·폴드 패널 '일기' 섹션 (US-24, 06 사이드바 일기)
 * 기준 날짜 일기: 앞 3줄(…) + [고치기] / 없으면 '이날 쓴 일기가 없어요.' + [일기 쓰기]. 둘 다 그날 일기 창(OV-05)
 * 사이드바에서 바로 고치거나 자동 저장하지 않는다 (메모 D-057 예외를 넓히지 않음)
 */
export default function DiarySection({ header }: { header?: (actions?: ReactNode) => ReactNode }) {
  const date = useAppSelector(selectSelectedDate);
  const { diary, isLoaded } = useDiaryEntry(date);
  const { openDiary } = useDiaryActions();
  const day = formatDayTitle(date);
  const preview = diary ? diaryPreview(diary.content) : null;

  return (
    <div className="flex flex-col gap-2">
      {header?.()}
      {isLoaded &&
        (preview ? (
          <>
            <p data-testid="diary-preview" className="whitespace-pre-line break-words text-[13px] leading-relaxed text-tp-text">
              {preview.text}
              {preview.isCut && '…'}
            </p>
            <button type="button" aria-label={`${day} 일기 고치기`} onClick={() => openDiary(date)} className="self-start px-1 text-[13px] font-semibold text-tp-primary">
              고치기
            </button>
          </>
        ) : (
          <>
            <p className="px-1 text-[13px] text-tp-muted">이날 쓴 일기가 없어요.</p>
            <button type="button" aria-label={`${day} 일기 쓰기`} onClick={() => openDiary(date)} className="self-start px-1 text-[13px] font-semibold text-tp-primary">
              일기 쓰기
            </button>
          </>
        ))}
    </div>
  );
}
