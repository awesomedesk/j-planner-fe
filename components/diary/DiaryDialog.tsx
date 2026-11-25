"use client";

import { useEffect, useRef } from 'react';

import type { Diary, LocalDate } from '@/types/api';
import ThemeButton from '@components/button/ThemeButton';
import DialogFrame, { useDialogRequestClose } from '@components/dialog/DialogFrame';
import { INPUT_CLASS } from '@components/form/formStyles';

import { formatDayTitle } from '@utils/date/dateUtils';

import DiaryDeleteConfirm from './DiaryDeleteConfirm';
import DiaryEditor from './DiaryEditor';
import { useDiaryEntry } from './hooks/useDiaryEntry';
import { useDiaryForm, type DiaryForm } from './hooks/useDiaryForm';

interface DiaryDialogProps {
  /** 연 날짜에 고정 (06: PC 창은 연 날짜) */
  date: LocalDate;
  onClose: () => void;
  onSaved?: (diary: Diary) => void;
  onDeleted?: () => void;
}

/**
 * DiaryDialog - PC·태블릿 일기 창 (US-24, OV-05)
 * 사이드바 일기 섹션·월간 펜 아이콘에서 연다. 머리 = 날짜, 본문 = 내용 + 이날 완료한 Todo, 아래 [삭제] | [취소] [저장]
 * 404는 빈 일기. 저장하면 닫고 연 버튼으로 초점. 바뀐 내용이 있으면 닫기 전에 작성 취소 확인 (D-037)
 */
export default function DiaryDialog({ date, onClose, onSaved, onDeleted }: DiaryDialogProps) {
  const { diary, isLoaded } = useDiaryEntry(date);

  // 연 버튼을 기억했다가 닫힐 때 돌려준다
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  const title = `${formatDayTitle(date)} 일기`;
  if (!isLoaded) {
    return (
      <DialogFrame title={title} onClose={onClose}>
        <textarea aria-label="일기 내용" disabled rows={8} className={`${INPUT_CLASS} min-h-40`} />
      </DialogFrame>
    );
  }
  return <LoadedDiaryDialog title={title} date={date} diary={diary} onClose={onClose} onSaved={onSaved} onDeleted={onDeleted} />;
}

interface LoadedProps extends DiaryDialogProps {
  title: string;
  diary: Diary | null;
}

function LoadedDiaryDialog({ title, date, diary, onClose, onSaved, onDeleted }: LoadedProps) {
  const form = useDiaryForm(date, diary);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const submit = async () => {
    const saved = await form.save();
    if (saved) onSaved?.(saved);
    else textareaRef.current?.focus();
  };

  return (
    <DialogFrame
      title={title}
      onClose={onClose}
      isDirty={form.isDirty}
      mobileHeaderAction={
        <button type="button" onClick={() => void submit()} disabled={form.isSubmitting} className="h-11 min-w-11 px-2 text-[15px] font-bold disabled:opacity-60">
          저장
        </button>
      }
      footer={<DiaryFooter form={form} onSubmit={() => void submit()} />}
    >
      <DiaryEditor date={date} form={form} isLoading={false} textareaRef={textareaRef} />
      {form.isDeleteConfirming && (
        <DiaryDeleteConfirm
          onCancel={form.cancelDelete}
          onConfirm={async () => {
            if (await form.confirmDelete()) onDeleted?.();
          }}
        />
      )}
    </DialogFrame>
  );
}

function DiaryFooter({ form, onSubmit }: { form: DiaryForm; onSubmit: () => void }) {
  const requestClose = useDialogRequestClose();
  return (
    <>
      <div className="flex items-center gap-3">
        {form.saved && (
          <ThemeButton variant="danger" className="px-0" onClick={form.requestDelete} disabled={form.isSubmitting}>
            삭제
          </ThemeButton>
        )}
      </div>
      <div className="flex gap-2">
        <ThemeButton size="md" onClick={requestClose}>
          취소
        </ThemeButton>
        <ThemeButton size="md" variant="primary" onClick={onSubmit} disabled={form.isSubmitting}>
          {form.isSubmitting ? '저장 중…' : '저장'}
        </ThemeButton>
      </div>
    </>
  );
}
