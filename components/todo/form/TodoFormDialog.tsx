"use client";

import { useEffect, useId, useRef } from 'react';

import type { Category, Id, Todo, TodoType } from '@/types/api';
import ThemeButton from '@components/button/ThemeButton';
import DialogFrame, { useDialogRequestClose } from '@components/dialog/DialogFrame';
import CategorySelect from '@components/form/CategorySelect';
import { ColorPicker, Field, FieldError, LaterFeature } from '@components/form/FormParts';
import { INPUT_CLASS } from '@components/form/formStyles';

import { formatShortDay } from '@utils/date/dateUtils';

import { useTodoForm, type TodoForm, type TodoFormTarget } from '../hooks/useTodoForm';
import { TODO_COLOR_OPTIONS, TODO_TITLE_MAX_LENGTH, TODO_TYPES, TODO_TYPE_LABEL, TODO_TYPE_SHORT_LABEL } from '../utils/todoFormUtils';

export interface TodoFormDialogProps {
  /** 새 Todo(고른 날짜, D-015) 또는 수정할 Todo */
  target: TodoFormTarget;
  /** 카테고리 목록 (미지정 맨 위 + 사용자 순서) */
  categories: Category[];
  onClose: () => void;
  onSaved?: (todo: Todo) => void;
  onDeleted?: (id: Id) => void;
}

/**
 * TodoFormDialog - Todo 추가·수정 창 (US-12)
 * - 600px 이상: 화면 가운데 창 (OV-02, D-017). 아래 줄 삭제 | 취소 · 저장
 * - 600px 미만: 전체 화면, 위에 ‹ 뒤로 / 제목 / 저장, 수정이면 본문 맨 아래 'Todo 삭제' (MO-09, D-030)
 * - 종류: 하루 / 기간(시작일~마감일) / 주간 목표(그 주) / 월간 목표(그 달) (D-007)
 * - 시간 지정을 켜면 시간표에 블록 (TODO-10, 시간표 표시는 US-15)
 * - 즐겨찾기·완성도는 첫 배포 이후 자리만 (D-008·D-021)
 */
export default function TodoFormDialog({ target, categories, onClose, onSaved, onDeleted }: TodoFormDialogProps) {
  const form = useTodoForm({ target, onSaved, onDeleted });
  const { values, errors } = form;
  const formId = useId();
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  return (
    <DialogFrame
      title={form.isEdit ? 'Todo 수정' : 'Todo 추가'}
      onClose={onClose}
      isDirty={form.isDirty}
      mobileHeaderAction={
        <button data-save-button type="submit" form={formId} disabled={form.isSubmitting} className="h-11 min-w-11 px-2 text-[15px] font-bold disabled:opacity-60">
          저장
        </button>
      }
      footer={<TodoFormFooter formId={formId} form={form} />}
    >
      <form
        id={formId}
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <Field label="제목" htmlFor="todo-title" error={errors.title}>
          <input
            ref={titleInputRef}
            id="todo-title"
            type="text"
            value={values.title}
            maxLength={TODO_TITLE_MAX_LENGTH}
            onChange={(e) => form.setField('title', e.target.value)}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'todo-title-error' : undefined}
            className={INPUT_CLASS}
          />
        </Field>

        <TypeSelect value={values.type} onChange={form.setType} />

        <DateFields form={form} />

        {/* 시간 지정 → 시간표 블록 (TODO-10) */}
        <div className="flex flex-col gap-2.5 rounded-[10px] border border-tp-line bg-tp-panel p-3">
          <div className="flex w-fit items-center gap-2 text-sm">
            <button
              type="button"
              role="switch"
              aria-checked={values.hasTime}
              aria-label="시간 지정"
              onClick={() => form.setField('hasTime', !values.hasTime)}
              className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${values.hasTime ? 'bg-tp-primary' : 'bg-switch-off'}`}
            >
              <span className="absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-all" style={{ left: values.hasTime ? 18 : 2 }} />
            </button>
            <span aria-hidden="true">시간 지정 → 시간표에 표시</span>
          </div>
          {values.hasTime && (
            <>
              <div className="flex gap-3">
                <TimeInput label="시작" ariaLabel="시작 시간" value={values.startTime} invalid={Boolean(errors.startTime)} onChange={(v) => form.setField('startTime', v)} />
                <TimeInput label="종료" ariaLabel="종료 시간" value={values.endTime} invalid={Boolean(errors.endTime)} onChange={(v) => form.setField('endTime', v)} />
              </div>
              <FieldError message={errors.startTime ?? errors.endTime} />
            </>
          )}
        </div>

        <Field label="카테고리" htmlFor="todo-category" error={errors.categoryId}>
          <CategorySelect id="todo-category" categories={categories} value={values.categoryId} onChange={(id) => form.setField('categoryId', id)} />
        </Field>

        <ColorPicker legend="Todo 색" options={TODO_COLOR_OPTIONS} value={values.color} onChange={(color) => form.setField('color', color)} error={errors.color} />

        {/* 첫 배포 이후 기능: 자리만 (D-008, D-021) */}
        <div className="flex flex-col gap-1.5">
          <LaterFeature label="즐겨찾기" />
          <LaterFeature label="완성도 (% / 분수)" />
        </div>

        {form.formError && (
          <p role="alert" className="whitespace-pre-line text-sm text-danger">
            {form.formError}
          </p>
        )}

        {/* 모바일: 삭제는 본문 맨 아래 'Todo 삭제' (MO-09, D-030) */}
        {form.isEdit && (
          <div className="flex items-center gap-3 fold:hidden">
            <ThemeButton variant="danger" className="px-0" onClick={() => void form.handleDelete()} disabled={form.isSubmitting}>
              {form.isDeleteConfirming ? 'Todo 삭제 확인' : 'Todo 삭제'}
            </ThemeButton>
            {form.isDeleteConfirming && <ThemeButton onClick={form.cancelDeleteConfirm}>취소</ThemeButton>}
          </div>
        )}
      </form>
    </DialogFrame>
  );
}

// ---------------------------------------------------------------- 작은 부품

/** 종류: 하루 / 기간 / 주간 목표 / 월간 목표 (모바일은 주간·월간으로 줄여 씀) */
function TypeSelect({ value, onChange }: { value: TodoType; onChange: (type: TodoType) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span id="todo-type-label" className="text-[13px] font-semibold">
        종류
      </span>
      <div role="radiogroup" aria-labelledby="todo-type-label" className="inline-flex w-fit gap-0.5 rounded-[10px] border border-tp-line bg-tp-panel p-[3px]">
        {TODO_TYPES.map((type) => {
          const isActive = type === value;
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={TODO_TYPE_LABEL[type]}
              onClick={() => onChange(type)}
              className={`rounded-[7px] px-3.5 py-[7px] text-[13px] ${isActive ? 'bg-tp-primary font-semibold text-tp-on-primary' : 'font-medium text-tp-text'}`}
            >
              <span className="fold:hidden">{TODO_TYPE_SHORT_LABEL[type]}</span>
              <span className="hidden fold:inline">{TODO_TYPE_LABEL[type]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 종류에 따라 바뀌는 날짜 칸 (OV-02 ②) */
function DateFields({ form }: { form: TodoForm }) {
  const { values, errors } = form;
  const dateError = errors.startDate ?? errors.endDate;

  if (values.type === 'PERIOD') {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-3">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-[13px] font-semibold">
            시작일
            <input type="date" value={values.startDate} onChange={(e) => form.setDate(e.target.value)} className={INPUT_CLASS} />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-[13px] font-semibold">
            마감일
            <input
              type="date"
              value={values.endDate}
              min={values.startDate}
              onChange={(e) => form.setField('endDate', e.target.value)}
              aria-invalid={Boolean(errors.endDate)}
              className={INPUT_CLASS}
            />
          </label>
        </div>
        <FieldError message={dateError} />
      </div>
    );
  }

  if (values.type === 'MONTH') {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
          달
          <input type="month" value={values.startDate.slice(0, 7)} onChange={(e) => e.target.value && form.setDate(`${e.target.value}-01`)} className={INPUT_CLASS} />
        </label>
        <FieldError message={dateError} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
        날짜
        <input type="date" value={values.startDate} onChange={(e) => form.setDate(e.target.value)} className={INPUT_CLASS} />
      </label>
      {values.type === 'WEEK' && (
        <p className="text-[13px] text-tp-muted">
          {formatShortDay(values.startDate)} ~ {formatShortDay(values.endDate)}
        </p>
      )}
      <FieldError message={dateError} />
    </div>
  );
}

interface TimeInputProps {
  label: string;
  ariaLabel: string;
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
}

function TimeInput({ label, ariaLabel, value, invalid, onChange }: TimeInputProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-[13px] font-semibold" aria-hidden="true">
        {label}
      </span>
      <input type="time" aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} className={INPUT_CLASS} />
    </div>
  );
}

/** 아래 버튼 줄 (600px 이상): 삭제 | 취소 · 저장 */
function TodoFormFooter({ formId, form }: { formId: string; form: TodoForm }) {
  const requestClose = useDialogRequestClose();
  return (
    <>
      <div className="flex items-center gap-3">
        {form.isEdit && (
          <ThemeButton variant="danger" className="px-0" onClick={() => void form.handleDelete()} disabled={form.isSubmitting}>
            {form.isDeleteConfirming ? '삭제 확인' : '삭제'}
          </ThemeButton>
        )}
        {form.isDeleteConfirming && <ThemeButton onClick={form.cancelDeleteConfirm}>취소</ThemeButton>}
      </div>
      <div className="flex gap-2">
        <ThemeButton size="md" onClick={requestClose}>
          취소
        </ThemeButton>
        <ThemeButton data-save-button type="submit" form={formId} size="md" variant="primary" disabled={form.isSubmitting}>
          {form.isSubmitting ? '저장 중…' : '저장'}
        </ThemeButton>
      </div>
    </>
  );
}
