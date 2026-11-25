"use client";

import { useState } from 'react';

import type { Diary, LocalDate } from '@/types/api';
import ThemeButton from '@components/button/ThemeButton';
import { useGuardWhileDirty } from '@components/dialog/LeaveGuard';
import { INPUT_CLASS } from '@components/form/formStyles';

import { formatDayTitle } from '@utils/date/dateUtils';

import DiaryDeleteConfirm from './DiaryDeleteConfirm';
import DiaryEditor from './DiaryEditor';
import { useDiaryEntry } from './hooks/useDiaryEntry';
import { useDiaryForm } from './hooks/useDiaryForm';

/**
 * DiaryTab - 모바일 일간 '일기' 탭 본문 (US-24, MO-11 · D-049)
 * 날짜 이동은 머리 줄 < >·'오늘'(AppShell). 탭 안에서 바로 쓰고 [저장] → 머문 채 '저장했어요.'
 * 바뀐 내용이 있는데 날짜·보기·탭을 바꾸면 '작성을 취소할까요?' (LeaveGuard, D-037)
 */
export default function DiaryTab({ date }: { date: LocalDate }) {
  const { diary, isLoaded } = useDiaryEntry(date);
  return (
    <section aria-label={`${formatDayTitle(date)} 일기`} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 pb-24">
      {isLoaded ? (
        <LoadedDiaryTab key={date} date={date} diary={diary} />
      ) : (
        <textarea aria-label="일기 내용" disabled rows={8} className={`${INPUT_CLASS} min-h-40`} />
      )}
    </section>
  );
}

function LoadedDiaryTab({ date, diary }: { date: LocalDate; diary: Diary | null }) {
  const form = useDiaryForm(date, diary);
  const [savedNotice, setSavedNotice] = useState(false);
  useGuardWhileDirty(form.isDirty);

  const formForEditor = {
    ...form,
    change: (value: string) => {
      setSavedNotice(false);
      form.change(value);
    },
  };

  return (
    <>
      <DiaryEditor date={date} form={formForEditor} isLoading={false} />
      <div className="flex items-center justify-between gap-2">
        <div>
          {form.saved && (
            <ThemeButton variant="danger" className="px-0" onClick={form.requestDelete} disabled={form.isSubmitting}>
              삭제
            </ThemeButton>
          )}
        </div>
        <ThemeButton
          size="md"
          variant="primary"
          disabled={form.isSubmitting}
          onClick={async () => {
            if (await form.save()) setSavedNotice(true);
          }}
        >
          저장
        </ThemeButton>
      </div>
      <p role="status" className="text-right text-[13px] text-tp-muted">
        {savedNotice ? '저장했어요.' : ''}
      </p>
      {form.isDeleteConfirming && <DiaryDeleteConfirm onCancel={form.cancelDelete} onConfirm={() => void form.confirmDelete()} />}
    </>
  );
}
