"use client";

import type { Ref } from 'react';

import type { LocalDate } from '@/types/api';
import { useAppSelector } from '@/app/hooks';
import { getCategoryListColor } from '@components/category/utils/categoryUtils';
import { FieldError } from '@components/form/FormParts';
import { INPUT_CLASS } from '@components/form/formStyles';
import { selectCategoriesById } from '@store/slices/categorySlice';

import { useCompletedTodos } from './hooks/useCompletedTodos';
import type { DiaryForm } from './hooks/useDiaryForm';

interface DiaryEditorProps {
  date: LocalDate;
  form: DiaryForm;
  /** 아직 그날 일기를 받는 중 (입력 잠금) */
  isLoading: boolean;
  textareaRef?: Ref<HTMLTextAreaElement>;
}

/**
 * 일기 창 본문 (OV-05 · MO-11 공통): 내용 → 이날 완료한 Todo(읽기 전용, DIARY-04) → 창 안 오류
 */
export default function DiaryEditor({ date, form, isLoading, textareaRef }: DiaryEditorProps) {
  const { todos, isLoaded } = useCompletedTodos(date);
  const categoriesById = useAppSelector(selectCategoriesById);
  const errorId = `diary-${date}-error`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <textarea
          ref={textareaRef}
          aria-label="일기 내용"
          data-diary-content=""
          value={form.content}
          disabled={isLoading}
          onChange={(e) => form.change(e.target.value)}
          aria-invalid={Boolean(form.error)}
          aria-describedby={form.error ? errorId : undefined}
          rows={8}
          placeholder="오늘 하루는 어땠나요?"
          className={`${INPUT_CLASS} min-h-40 resize-y leading-relaxed`}
        />
        <FieldError id={errorId} message={form.error ?? undefined} />
      </div>

      <section aria-labelledby={`diary-${date}-done`} className="flex flex-col gap-1.5">
        <h3 id={`diary-${date}-done`} className="text-[13px] font-semibold">
          이날 완료한 Todo
        </h3>
        {!isLoaded ? null : todos.length === 0 ? (
          <p className="text-[13px] text-tp-muted">이날 완료한 Todo가 없어요.</p>
        ) : (
          <ul aria-label="이날 완료한 Todo" className="flex flex-col gap-1">
            {todos.map((todo) => {
              const category = categoriesById.get(todo.categoryId);
              return (
                <li key={todo.id} className="flex items-center gap-2 rounded-lg border border-tp-line bg-white px-2 py-1.5 text-[13px] text-ink">
                  <span
                    aria-hidden="true"
                    className="h-4 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: category ? getCategoryListColor(category) : 'var(--tp-theme2)' }}
                  />
                  <span className="min-w-0 truncate">{todo.title}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {form.formError && (
        <p role="alert" className="text-sm text-danger">
          {form.formError}
        </p>
      )}
    </div>
  );
}
