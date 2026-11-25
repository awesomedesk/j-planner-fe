"use client";

import { useEffect, useId, useRef, type ReactNode } from 'react';

import type { Dday, Id } from '@/types/api';
import ThemeButton from '@components/button/ThemeButton';
import DialogFrame, { useDialogRequestClose } from '@components/dialog/DialogFrame';
import { Field, FieldError } from '@components/form/FormParts';
import { INPUT_CLASS } from '@components/form/formStyles';

import DdayDeleteConfirm from '../DdayDeleteConfirm';
import { useDdayForm, type DdayForm, type DdayFormTarget } from '../hooks/useDdayForm';
import {
  DDAY_COUNT_TYPES,
  DDAY_COUNT_TYPE_TEXT,
  DDAY_FORM_FIELD_ORDER,
  DDAY_TITLE_MAX_LENGTH,
  type DdayDayOptionValue,
  type DdayFormErrors,
  type DdayFormField,
} from '../utils/ddayFormUtils';

export interface DdayFormDialogProps {
  target: DdayFormTarget;
  onClose: () => void;
  onSaved?: (dday: Dday) => void;
  onDeleted?: (id: Id) => void;
}

/**
 * DdayFormDialog - D-Day 추가·수정 창 (US-22, 06 D-Day 입력 창 · D-012 · D-020)
 * - 600px 이상: 가운데 창, 아래 줄 [삭제] | [취소] [저장]. 600px 미만: 전체 화면 '<' 뒤로 + 머리 [저장], 수정이면 본문 아래 'D-Day 삭제'
 * - 제목 → 날짜 → 세는 방법(남은 날 기본) → 달력에 표시(목표 날짜는 항상, 그 기준의 옵션만)
 * - 저장: 첫 오류 칸에 초점, 저장 중 잠금, 실패하면 입력 그대로 + 창 안 오류 (D-079)
 * - 삭제는 확인 창을 거친다. 닫히면 창을 연 버튼·행으로 초점을 돌린다
 */
export default function DdayFormDialog({ target, onClose, onSaved, onDeleted }: DdayFormDialogProps) {
  const form = useDdayForm({ target, onSaved, onDeleted });
  const { values, errors } = form;
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  /** 칸은 data-dday-field로 찾는다 (제목 첫 초점, 첫 오류 칸 초점) */
  const focusField = (field: DdayFormField) => formRef.current?.querySelector<HTMLElement>(`[data-dday-field="${field}"]`)?.focus();

  // 연 버튼·행을 기억했다가 닫힐 때 돌려준다 (06: 연 버튼/행으로 초점). 제목 칸 초점보다 먼저 기억해야 한다
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    formRef.current?.querySelector<HTMLElement>('[data-dday-field="title"]')?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  const focusFirstError = (found: DdayFormErrors) => {
    const field = DDAY_FORM_FIELD_ORDER.find((key) => found[key]);
    if (field) focusField(field);
  };
  const submit = async () => focusFirstError(await form.handleSubmit());

  const isCountdown = values.countType === 'COUNTDOWN';

  return (
    <DialogFrame
      title={form.isEdit ? 'D-Day 수정' : 'D-Day 추가'}
      onClose={onClose}
      isDirty={form.isDirty}
      mobileHeaderAction={
        <button data-save-button type="submit" form={formId} disabled={form.isSubmitting} className="h-11 min-w-11 px-2 text-[15px] font-bold disabled:opacity-60">
          저장
        </button>
      }
      footer={<DdayFormFooter formId={formId} form={form} />}
    >
      <form
        ref={formRef}
        id={formId}
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Field label="제목" htmlFor="dday-title" error={errors.title}>
          <input
            data-dday-field="title"
            id="dday-title"
            type="text"
            value={values.title}
            maxLength={DDAY_TITLE_MAX_LENGTH}
            onChange={(e) => form.update({ title: e.target.value }, ['title'])}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'dday-title-error' : undefined}
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="날짜" htmlFor="dday-date" error={errors.targetDate}>
          <input
            data-dday-field="targetDate"
            id="dday-date"
            type="date"
            value={values.targetDate}
            onChange={(e) => form.update({ targetDate: e.target.value }, ['targetDate'])}
            aria-invalid={Boolean(errors.targetDate)}
            aria-describedby={errors.targetDate ? 'dday-date-error' : undefined}
            className={INPUT_CLASS}
          />
        </Field>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-[13px] font-semibold">세는 방법</legend>
          {DDAY_COUNT_TYPES.map((type) => (
            <div key={type} className="flex flex-col gap-0.5">
              <label className="flex w-fit items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="dday-count-type"
                  checked={values.countType === type}
                  onChange={() => form.setCountType(type)}
                  aria-describedby={`dday-count-${type}-example`}
                  className="h-4 w-4 accent-tp-primary"
                />
                {DDAY_COUNT_TYPE_TEXT[type].label}
              </label>
              <span id={`dday-count-${type}-example`} className="pl-6 text-xs text-tp-muted">
                {DDAY_COUNT_TYPE_TEXT[type].example}
              </span>
            </div>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-2 rounded-[10px] border border-tp-line bg-tp-panel p-3">
          <legend className="px-1 text-[13px] font-semibold">달력에 표시</legend>
          <OptionCheck label="목표 날짜" checked disabled onChange={() => undefined} />
          <DaysOption
            label="N일 단위"
            daysLabel="N일 단위 일 수"
            unit="일"
            option={values.interval}
            error={errors.intervalDays}
            field="intervalDays"
            onChange={(interval) => form.update({ interval }, ['intervalDays'])}
          />
          {isCountdown && (
            <>
              <DaysOption
                label="마지막 N일은 매일"
                daysLabel="마지막 N일 일 수"
                unit="일"
                option={values.lastDays}
                error={errors.lastDaysDays}
                field="lastDaysDays"
                onChange={(lastDays) => form.update({ lastDays }, ['lastDaysDays'])}
              />
              <OptionCheck label="매일" checked={values.daily} onChange={(daily) => form.update({ daily })} />
            </>
          )}
          {!isCountdown && <OptionCheck label="매년" checked={values.yearly} onChange={(yearly) => form.update({ yearly })} />}
        </fieldset>

        {form.formError && (
          <p role="alert" className="whitespace-pre-line text-sm text-danger">
            {form.formError}
          </p>
        )}

        {/* 모바일: 삭제는 본문 맨 아래 (MO-08·09와 같게, D-030) */}
        {form.isEdit && (
          <div className="fold:hidden">
            <ThemeButton variant="danger" className="px-0" onClick={form.requestDelete} disabled={form.isSubmitting}>
              D-Day 삭제
            </ThemeButton>
          </div>
        )}
      </form>

      {form.isDeleteConfirming && <DdayDeleteConfirm onCancel={form.cancelDelete} onConfirm={() => void form.confirmDelete()} />}
    </DialogFrame>
  );
}

// ---------------------------------------------------------------- 작은 부품

interface OptionCheckProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  children?: ReactNode;
}

function OptionCheck({ label, checked, disabled = false, onChange, children }: OptionCheckProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <label className={`flex items-center gap-2 ${disabled ? 'text-tp-muted' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-tp-primary"
        />
        {label}
      </label>
      {children}
    </div>
  );
}

interface DaysOptionProps {
  label: string;
  daysLabel: string;
  unit: string;
  option: DdayDayOptionValue;
  error?: string;
  field: DdayFormField;
  onChange: (option: DdayDayOptionValue) => void;
}

/** 켜기 + 일 수 (켰을 때만 입력, 끄면 값은 남겨 둔다) */
function DaysOption({ label, daysLabel, unit, option, error, field, onChange }: DaysOptionProps) {
  const errorId = useId();
  return (
    <div className="flex flex-col gap-1">
      <OptionCheck label={label} checked={option.enabled} onChange={(enabled) => onChange({ ...option, enabled })}>
        <span className="flex items-center gap-1">
          <input
            data-dday-field={field}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            aria-label={daysLabel}
            value={option.days}
            disabled={!option.enabled}
            onChange={(e) => onChange({ ...option, days: e.target.value })}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={`${INPUT_CLASS} !w-20 !py-1.5`}
          />
          <span aria-hidden="true" className="text-tp-muted">
            {unit}
          </span>
        </span>
      </OptionCheck>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

/** 아래 버튼 줄 (600px 이상): [삭제] | [취소] [저장] */
function DdayFormFooter({ formId, form }: { formId: string; form: DdayForm }) {
  const requestClose = useDialogRequestClose();
  return (
    <>
      <div className="flex items-center gap-3">
        {form.isEdit && (
          <ThemeButton variant="danger" className="px-0" onClick={form.requestDelete} disabled={form.isSubmitting}>
            삭제
          </ThemeButton>
        )}
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
