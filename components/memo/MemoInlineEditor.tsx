"use client";

import { forwardRef, useImperativeHandle, type FocusEvent } from 'react';

import type { Id, Memo } from '@/types/api';

import { useMemoAutosave } from './hooks/useMemoAutosave';
import MemoTitleCounter from './MemoTitleCounter';
import { MEMO_TITLE_MAX_LENGTH } from './utils/memoUtils';

interface MemoInlineEditorProps {
  memo: Memo;
  onSaved: (memo: Memo) => void;
  onDeleted: (id: Id) => void;
}

export interface MemoInlineEditorHandle {
  /** 남은 변경 저장(모두 비었으면 삭제). 성공하면 true → 접어도 된다 (D-058) */
  finish: () => Promise<boolean>;
}

const INLINE_INPUT_CLASS = 'w-full rounded-md border border-tp-line bg-white px-2 py-1.5 text-[13px] text-ink outline-none focus:ring-2 focus:ring-tp-theme2';

/**
 * MemoInlineEditor - 사이드바에서 펼친 메모의 제목·내용 칸 (D-057, D-058)
 * 자동 저장은 useMemoAutosave. 칸 밖을 누르면 바로 저장하고, 실패하면 '저장 못 했어요'.
 */
const MemoInlineEditor = forwardRef<MemoInlineEditorHandle, MemoInlineEditorProps>(function MemoInlineEditor(
  { memo, onSaved, onDeleted },
  ref
) {
  const { values, errorMessage, setField, saveNow, finish } = useMemoAutosave({ memo, onSaved, onDeleted });

  useImperativeHandle(ref, () => ({ finish }), [finish]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    void saveNow();
  };

  return (
    <div className="flex flex-col gap-1.5 px-2.5 pb-2.5" onBlur={handleBlur}>
      <input
        type="text"
        aria-label="메모 제목"
        placeholder="제목"
        value={values.title}
        maxLength={MEMO_TITLE_MAX_LENGTH}
        onChange={(event) => setField('title', event.target.value)}
        className={`${INLINE_INPUT_CLASS} font-semibold`}
      />
      <MemoTitleCounter title={values.title} className="self-end text-[11px]" />
      <textarea
        aria-label="메모 내용"
        placeholder="내용"
        value={values.content}
        onChange={(event) => setField('content', event.target.value)}
        rows={4}
        className={`${INLINE_INPUT_CLASS} resize-y leading-relaxed`}
      />
      {errorMessage && (
        <p role="alert" className="text-xs text-danger">
          {errorMessage}
        </p>
      )}
    </div>
  );
});

export default MemoInlineEditor;
