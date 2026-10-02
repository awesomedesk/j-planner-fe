"use client";

import type { FocusEvent } from 'react';

import type { Id, Memo } from '@/types/api';

import { useMemoAutosave } from './hooks/useMemoAutosave';
import MemoTitleCounter from './MemoTitleCounter';
import { MEMO_TITLE_MAX_LENGTH } from './utils/memoUtils';

interface MemoInlineEditorProps {
  memo: Memo;
  onSaved: (memo: Memo) => void;
  onDeleted: (id: Id) => void;
}

const INLINE_INPUT_CLASS = 'w-full rounded-md border border-tp-line bg-white px-2 py-1.5 text-[13px] text-ink outline-none focus:ring-2 focus:ring-tp-theme2';

/**
 * MemoInlineEditor - 사이드바에서 펼친 메모의 제목·내용 칸 (D-057)
 * 자동 저장은 useMemoAutosave. 칸 밖을 누르면 바로 저장한다.
 */
export default function MemoInlineEditor({ memo, onSaved, onDeleted }: MemoInlineEditorProps) {
  const { values, setField, saveNow } = useMemoAutosave({ memo, onSaved, onDeleted });

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
    </div>
  );
}
