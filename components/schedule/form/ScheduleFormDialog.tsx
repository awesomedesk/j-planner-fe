"use client";

import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

import type { Category, Id, Schedule } from '@/types/api';
import ThemeButton from '@components/button/ThemeButton';
import { getCategoryListColor } from '@components/category/utils/categoryUtils';
import DialogFrame, { useDialogRequestClose } from '@components/dialog/DialogFrame';

import { useScheduleForm, type ScheduleFormTarget } from '../hooks/useScheduleForm';
import { SCHEDULE_COLOR_OPTIONS, TITLE_MAX_LENGTH, URL_MAX_LENGTH } from '../utils/scheduleFormUtils';

export interface ScheduleFormDialogProps {
  /** 새 일정(고른 날짜, 시간표에서 누른 시각) 또는 수정할 일정 */
  target: ScheduleFormTarget;
  /** 카테고리 목록 (미지정 맨 위 + 사용자 순서) */
  categories: Category[];
  onClose: () => void;
  onSaved?: (schedule: Schedule) => void;
  onDeleted?: (id: Id) => void;
}

const INPUT_CLASS =
  'w-full rounded-lg border border-tp-line bg-white px-3 py-2.5 text-sm text-[#26301F] outline-none focus:ring-2 focus:ring-tp-theme2 disabled:opacity-60';

/**
 * ScheduleFormDialog - 일정 추가·수정 창
 *
 * - 600px 이상: 화면 가운데 창 (OV-01, D-017)
 * - 600px 미만: 전체 화면, 위에 ‹ 뒤로 / 제목 / 저장 (MO-08)
 * - 바꾼 것이 있으면 닫기 전에 "작성을 취소할까요?" (D-037)
 * - 반복·이동시간은 첫 배포 이후라 자리만 표시 (D-008, D-021)
 */
export default function ScheduleFormDialog({ target, categories, onClose, onSaved, onDeleted }: ScheduleFormDialogProps) {
  const form = useScheduleForm({ target, onSaved, onDeleted });
  const { values, errors } = form;
  const formId = useId();
  const titleInputRef = useRef<HTMLInputElement>(null);

  const defaultCategory = categories.find((c) => c.isDefault) ?? null;
  const selectedCategoryId = values.categoryId ?? defaultCategory?.id ?? '';
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null;

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  return (
    <DialogFrame
      title={form.isEdit ? '일정 수정' : '일정 추가'}
      onClose={onClose}
      isDirty={form.isDirty}
      mobileHeaderAction={
        <button type="submit" form={formId} disabled={form.isSubmitting} className="h-11 min-w-11 px-2 text-[15px] font-bold disabled:opacity-60">
          저장
        </button>
      }
      footer={<ScheduleFormFooter formId={formId} form={form} />}
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
        <Field label="제목" htmlFor="schedule-title" error={errors.title}>
          <input
            ref={titleInputRef}
            id="schedule-title"
            type="text"
            value={values.title}
            maxLength={TITLE_MAX_LENGTH}
            onChange={(e) => form.setField('title', e.target.value)}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'schedule-title-error' : undefined}
            className={INPUT_CLASS}
          />
        </Field>

        {/* 시작·종료 (종일이면 시간 칸 숨김). 시작을 바꾸면 종료도 따라 움직인다 */}
        <div className="flex gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-[13px] font-semibold">시작</span>
            <input
              type="date"
              aria-label="시작 날짜"
              value={values.startDate}
              onChange={(e) => form.setStart(e.target.value, values.startTime)}
              aria-invalid={Boolean(errors.startDate)}
              className={INPUT_CLASS}
            />
            {!values.allDay && (
              <input
                type="time"
                aria-label="시작 시간"
                value={values.startTime}
                onChange={(e) => form.setStart(values.startDate, e.target.value)}
                aria-invalid={Boolean(errors.startTime)}
                className={INPUT_CLASS}
              />
            )}
            <FieldError message={errors.startDate ?? errors.startTime} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-[13px] font-semibold">종료</span>
            <input
              type="date"
              aria-label="종료 날짜"
              value={values.endDate}
              min={values.startDate}
              onChange={(e) => form.setField('endDate', e.target.value)}
              aria-invalid={Boolean(errors.endDate)}
              className={INPUT_CLASS}
            />
            {!values.allDay && (
              <input
                type="time"
                aria-label="종료 시간"
                value={values.endTime}
                onChange={(e) => form.setField('endTime', e.target.value)}
                aria-invalid={Boolean(errors.endTime)}
                className={INPUT_CLASS}
              />
            )}
            <FieldError message={errors.endDate ?? errors.endTime} />
          </div>
        </div>

        <div className="flex w-fit items-center gap-2 text-sm">
          <button
            type="button"
            role="switch"
            aria-checked={values.allDay}
            aria-label="종일"
            onClick={() => form.setField('allDay', !values.allDay)}
            className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${values.allDay ? 'bg-tp-primary' : 'bg-[#BDB79B]'}`}
          >
            <span className="absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-all" style={{ left: values.allDay ? 18 : 2 }} />
          </button>
          <span aria-hidden="true">종일</span>
        </div>

        <Field label="카테고리" htmlFor="schedule-category" error={errors.categoryId}>
          <div className="relative">
            {selectedCategory && (
              <span
                className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full"
                style={{ backgroundColor: getCategoryListColor(selectedCategory) }}
                aria-hidden="true"
              />
            )}
            <select
              id="schedule-category"
              value={selectedCategoryId}
              onChange={(e) => form.setField('categoryId', Number(e.target.value))}
              className="w-full appearance-none rounded-lg border border-tp-secondary-line bg-tp-secondary py-2.5 pl-8 pr-9 text-sm font-medium text-tp-on-secondary outline-none focus:ring-2 focus:ring-tp-theme2"
            >
              {categories.length === 0 && <option value="">미지정</option>}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-tp-on-secondary"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </Field>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-[13px] font-semibold">일정 색</legend>
          <div className="flex flex-wrap items-center gap-2.5">
            <ColorSwatch label="색 선택 안 함 (테마 기본색)" color={null} selected={values.color === null} onSelect={() => form.setField('color', null)} />
            {SCHEDULE_COLOR_OPTIONS.map((color) => (
              <ColorSwatch
                key={color}
                label={`색 ${color}`}
                color={color}
                selected={values.color?.toUpperCase() === color}
                onSelect={() => form.setField('color', color)}
              />
            ))}
          </div>
          <FieldError message={errors.color} />
        </fieldset>

        <Field label="장소" htmlFor="schedule-location" error={errors.locationName}>
          <input
            id="schedule-location"
            type="text"
            value={values.locationName}
            onChange={(e) => form.setField('locationName', e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="URL" htmlFor="schedule-url" error={errors.url}>
          <input
            id="schedule-url"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={values.url}
            maxLength={URL_MAX_LENGTH}
            onChange={(e) => form.setField('url', e.target.value)}
            aria-invalid={Boolean(errors.url)}
            aria-describedby={errors.url ? 'schedule-url-error' : undefined}
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="메모" htmlFor="schedule-description" error={errors.description}>
          <textarea
            id="schedule-description"
            value={values.description}
            onChange={(e) => form.setField('description', e.target.value)}
            rows={3}
            className={`${INPUT_CLASS} resize-none`}
          />
        </Field>

        {/* 첫 배포 이후 기능: 자리만 (D-008) */}
        <div className="flex flex-col gap-1.5">
          <LaterFeature label="반복" />
          <div className="hidden fold:block">
            <LaterFeature label="이동시간 (앞 / 뒤)" />
          </div>
        </div>

        {form.formError && (
          <p role="alert" className="whitespace-pre-line text-sm text-danger">
            {form.formError}
          </p>
        )}

        {/* 모바일: 삭제는 본문 맨 아래 (MO-08) */}
        {form.isEdit && (
          <div className="flex items-center gap-3 fold:hidden">
            <ThemeButton variant="danger" className="px-0" onClick={() => void form.handleDelete()} disabled={form.isSubmitting}>
              {form.isDeleteConfirming ? '일정 삭제 확인' : '일정 삭제'}
            </ThemeButton>
            {form.isDeleteConfirming && <ThemeButton onClick={form.cancelDeleteConfirm}>취소</ThemeButton>}
          </div>
        )}
      </form>
    </DialogFrame>
  );
}

// ---------------------------------------------------------------- 작은 부품

type ScheduleForm = ReturnType<typeof useScheduleForm>;

/** 아래 버튼 줄 (600px 이상): 삭제 | 취소 · 저장 */
function ScheduleFormFooter({ formId, form }: { formId: string; form: ScheduleForm }) {
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
        <ThemeButton type="submit" form={formId} size="md" variant="primary" disabled={form.isSubmitting}>
          {form.isSubmitting ? '저장 중…' : '저장'}
        </ThemeButton>
      </div>
    </>
  );
}

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}

function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold">
        {label}
      </label>
      {children}
      <FieldError id={`${htmlFor}-error`} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-danger">
      {message}
    </p>
  );
}

interface ColorSwatchProps {
  label: string;
  /** null = 선택 안 함 (테마 Theme2) */
  color: string | null;
  selected: boolean;
  onSelect: () => void;
}

function ColorSwatch({ label, color, selected, onSelect }: ColorSwatchProps) {
  const ringColor = color ?? 'var(--tp-theme1)';
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onSelect}
      className={`h-6 w-6 rounded-full ${color ? '' : 'border border-dashed border-tp-muted bg-white'}`}
      style={{
        backgroundColor: color ?? undefined,
        boxShadow: selected ? `0 0 0 2px #FFFFFF, 0 0 0 4px ${ringColor}` : undefined,
      }}
    />
  );
}

function LaterFeature({ label }: { label: string }) {
  return (
    <div
      className="flex items-center justify-between rounded-lg border border-dashed border-tp-line px-3 py-2.5 text-[13px] text-tp-muted"
      aria-disabled="true"
    >
      <span>{label}</span>
      <span className="rounded-full border border-tp-line bg-tp-panel px-2 py-0.5 text-[11px]">첫 배포 이후</span>
    </div>
  );
}
