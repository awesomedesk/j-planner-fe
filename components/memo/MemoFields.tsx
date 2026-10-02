"use client";

import type { ReactNode } from 'react';

import { useNow } from '@utils/hooks/useNow';

import type { MemoForm } from './hooks/useMemoForm';
import { MEMO_TITLE_MAX_LENGTH, formatMemoDate, shouldShowTitleCounter } from './utils/memoUtils';

const MEMO_INPUT_CLASS =
  'w-full rounded-lg border border-tp-line bg-white px-3 py-2.5 text-ink outline-none focus:ring-2 focus:ring-tp-theme2 aria-[invalid=true]:border-danger';

interface MemoFieldsProps {
  formId: string;
  form: MemoForm;
  /** 수정일 줄 오른쪽 (모바일: 메모 삭제) */
  footerAction?: ReactNode;
}

/**
 * MemoFields - 메모 제목·내용 칸 (OV-06 오른쪽, MO-15 본문)
 * 날짜 칸 없음 (D-011). 저장은 form 제출로만 (D-030).
 */
export default function MemoFields({ formId, form, footerAction }: MemoFieldsProps) {
  const now = useNow();
  const { values, errors, memo } = form;

  return (
    <form
      id={formId}
      noValidate
      className="flex min-h-0 flex-1 flex-col gap-2.5"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="flex flex-col gap-1">
        <input
          type="text"
          aria-label="메모 제목"
          placeholder="제목"
          value={values.title}
          maxLength={MEMO_TITLE_MAX_LENGTH}
          onChange={(event) => form.setField('title', event.target.value)}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={`${formId}-title-help`}
          className={`${MEMO_INPUT_CLASS} text-base font-bold`}
        />
        <div id={`${formId}-title-help`} className="flex justify-between gap-2 text-xs">
          <span className="text-danger">{errors.title}</span>
          {shouldShowTitleCounter(values.title) && (
            <span className="shrink-0 text-tp-muted">
              {values.title.length}/{MEMO_TITLE_MAX_LENGTH}
            </span>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <textarea
          aria-label="메모 내용"
          placeholder="내용"
          value={values.content}
          onChange={(event) => form.setField('content', event.target.value)}
          aria-invalid={Boolean(errors.content)}
          aria-describedby={errors.content ? `${formId}-content-error` : undefined}
          className={`${MEMO_INPUT_CLASS} min-h-[240px] flex-1 resize-none text-sm leading-relaxed`}
        />
        {errors.content && (
          <p id={`${formId}-content-error`} className="text-xs text-danger">
            {errors.content}
          </p>
        )}
      </div>

      {form.formError && (
        <p role="alert" className="whitespace-pre-line text-sm text-danger">
          {form.formError}
        </p>
      )}

      {(memo || footerAction) && (
        <div className="flex min-h-9 items-center justify-between gap-3 text-xs text-tp-muted">
          <span>{memo ? `${formatMemoDate(memo.updatedAt, now)} 수정` : ''}</span>
          {footerAction}
        </div>
      )}
    </form>
  );
}
