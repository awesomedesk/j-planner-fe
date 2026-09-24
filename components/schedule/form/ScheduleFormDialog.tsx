"use client";

import { useEffect, useId, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import type { Category, Id, Schedule } from '@/types/api';
import { greenColorTheme, type ThemeColor } from '@components/theme/theme_color';

import { useScheduleForm, type ScheduleFormTarget } from '../hooks/useScheduleForm';
import { SCHEDULE_COLOR_OPTIONS, TITLE_MAX_LENGTH, URL_MAX_LENGTH, findDefaultCategory } from '../utils/scheduleFormUtils';

export interface ScheduleFormDialogProps {
  /** 새 일정(선택한 날짜) 또는 수정할 일정 */
  target: ScheduleFormTarget;
  /** `GET /categories` 결과 (앱 시작 때 받아 둔 것) */
  categories: Category[];
  /** 색 테마. 설정(colorTheme)과 연결 전까지 녹색 */
  theme?: ThemeColor;
  onClose: () => void;
  onSaved?: (schedule: Schedule) => void;
  onDeleted?: (id: Id) => void;
}

const DANGER_COLOR = '#B42318';

/**
 * ScheduleFormDialog - 일정 추가·수정 창
 *
 * - PC·태블릿·폴드(600px 이상): 화면 가운데 창 (OV-01, D-017)
 * - 모바일(600px 미만): 전체 화면, 위에 ‹ 뒤로 / 제목 / 저장 (MO-08)
 * - 반복·이동시간은 첫 배포 이후라 자리만 표시 (D-008, D-021)
 */
export default function ScheduleFormDialog({
  target,
  categories,
  theme = greenColorTheme,
  onClose,
  onSaved,
  onDeleted,
}: ScheduleFormDialogProps) {
  const form = useScheduleForm({ target, onSaved, onDeleted });
  const { values, errors } = form;

  const titleId = useId();
  const titleInputRef = useRef<HTMLInputElement>(null);

  const defaultCategory = findDefaultCategory(categories);
  const selectedCategoryId = values.categoryId ?? defaultCategory?.id ?? '';
  const heading = form.isEdit ? '일정 수정' : '일정 추가';

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const colors = {
    surface: { backgroundColor: theme.Light, color: theme.Dark } satisfies CSSProperties,
    header: { backgroundColor: theme.Theme1, color: theme.Light } satisfies CSSProperties,
    input: { borderColor: theme.Theme2, backgroundColor: '#FFFFFF', color: theme.Dark } satisfies CSSProperties,
    secondary: { backgroundColor: theme.Theme3, color: theme.Theme1, borderColor: theme.Theme2 } satisfies CSSProperties,
    primary: { backgroundColor: theme.Theme1, color: theme.Light, borderColor: theme.Theme1 } satisfies CSSProperties,
    divider: { borderColor: theme.Theme2 } satisfies CSSProperties,
  };

  const inputClass = 'w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 disabled:opacity-60';
  const deleteLabel = form.isDeleteConfirming ? '삭제 확인' : '삭제';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void form.handleSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex fold:items-center fold:justify-center fold:p-6">
      {/* 바깥 영역: 누르면 입력 내용이 사라지므로 닫지 않는다 */}
      <div className="absolute inset-0 hidden bg-black/45 fold:block" aria-hidden="true" />

      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        noValidate
        className="relative flex h-full w-full flex-col overflow-hidden fold:h-auto fold:max-h-full fold:w-[552px] fold:rounded-2xl fold:shadow-2xl"
        style={colors.surface}
      >
        {/* 머리: 모바일 = ‹ 뒤로 / 제목 / 저장, 그 외 = 제목 / 닫기 */}
        <div className="flex h-[52px] shrink-0 items-center justify-between px-2 fold:h-auto fold:px-5 fold:py-4" style={colors.header}>
          <button
            type="button"
            onClick={onClose}
            aria-label="뒤로"
            className="inline-flex h-11 w-11 items-center justify-center fold:hidden"
          >
            <IconChevronLeft />
          </button>
          <h2 id={titleId} className="text-[17px] font-bold">
            {heading}
          </h2>
          <button
            type="submit"
            disabled={form.isSubmitting}
            className="h-11 min-w-11 px-2 text-[15px] font-bold disabled:opacity-60 fold:hidden"
          >
            저장
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="hidden h-8 w-8 items-center justify-center fold:inline-flex"
          >
            <IconClose />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-3 fold:px-5 fold:py-5">
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
              className={inputClass}
              style={colors.input}
            />
          </Field>

          {/* 시작·종료 (종일이면 시간 칸 숨김) */}
          <div className="flex gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-[13px] font-semibold">시작</span>
              <input
                type="date"
                aria-label="시작 날짜"
                value={values.startDate}
                onChange={(e) => form.setStart(e.target.value, values.startTime)}
                aria-invalid={Boolean(errors.startDate)}
                className={inputClass}
                style={colors.input}
              />
              {!values.allDay && (
                <input
                  type="time"
                  aria-label="시작 시간"
                  value={values.startTime}
                  onChange={(e) => form.setStart(values.startDate, e.target.value)}
                  aria-invalid={Boolean(errors.startTime)}
                  className={inputClass}
                  style={colors.input}
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
                className={inputClass}
                style={colors.input}
              />
              {!values.allDay && (
                <input
                  type="time"
                  aria-label="종료 시간"
                  value={values.endTime}
                  onChange={(e) => form.setField('endTime', e.target.value)}
                  aria-invalid={Boolean(errors.endTime)}
                  className={inputClass}
                  style={colors.input}
                />
              )}
              <FieldError message={errors.endDate ?? errors.endTime} />
            </div>
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
            <button
              type="button"
              role="switch"
              aria-checked={values.allDay}
              onClick={() => form.setField('allDay', !values.allDay)}
              className="relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors"
              style={{ backgroundColor: values.allDay ? theme.Theme1 : '#BDB79B' }}
            >
              <span
                className="absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-all"
                style={{ left: values.allDay ? 18 : 2 }}
              />
            </button>
            <span>종일</span>
          </label>

          <Field label="카테고리" htmlFor="schedule-category" error={errors.categoryId}>
            <div className="relative">
              <select
                id="schedule-category"
                value={selectedCategoryId}
                onChange={(e) => form.setField('categoryId', Number(e.target.value))}
                className={`${inputClass} appearance-none pr-9`}
                style={colors.secondary}
              >
                {categories.length === 0 && <option value="">미지정</option>}
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: theme.Theme1 }}>
                <IconChevronDown />
              </span>
            </div>
          </Field>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-[13px] font-semibold">일정 색</legend>
            <div className="flex flex-wrap items-center gap-2.5">
              <ColorSwatch
                label={`색 선택 안 함 (테마 기본색)`}
                color={null}
                selected={values.color === null}
                ringColor={theme.Theme1}
                onSelect={() => form.setField('color', null)}
              />
              {SCHEDULE_COLOR_OPTIONS.map((color) => (
                <ColorSwatch
                  key={color}
                  label={`색 ${color}`}
                  color={color}
                  selected={values.color?.toUpperCase() === color}
                  ringColor={color}
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
              className={inputClass}
              style={colors.input}
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
              className={inputClass}
              style={colors.input}
            />
          </Field>

          <Field label="메모" htmlFor="schedule-description" error={errors.description}>
            <textarea
              id="schedule-description"
              value={values.description}
              onChange={(e) => form.setField('description', e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
              style={colors.input}
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
            <p role="alert" className="whitespace-pre-line text-sm" style={{ color: DANGER_COLOR }}>
              {form.formError}
            </p>
          )}

          {/* 모바일: 삭제는 본문 맨 아래 (MO-08) */}
          {form.isEdit && (
            <div className="flex items-center gap-3 fold:hidden">
              <button
                type="button"
                onClick={() => void form.handleDelete()}
                disabled={form.isSubmitting}
                className="py-1 text-sm font-semibold disabled:opacity-60"
                style={{ color: DANGER_COLOR }}
              >
                {form.isDeleteConfirming ? '일정 삭제 확인' : '일정 삭제'}
              </button>
              {form.isDeleteConfirming && (
                <button type="button" onClick={form.cancelDeleteConfirm} className="py-1 text-sm">
                  그만두기
                </button>
              )}
            </div>
          )}
        </div>

        {/* 아래 버튼 줄 (600px 이상) */}
        <div className="hidden shrink-0 items-center justify-between border-t px-5 py-3.5 fold:flex" style={colors.divider}>
          <div className="flex items-center gap-3">
            {form.isEdit && (
              <button
                type="button"
                onClick={() => void form.handleDelete()}
                disabled={form.isSubmitting}
                className="text-sm font-semibold disabled:opacity-60"
                style={{ color: DANGER_COLOR }}
              >
                {deleteLabel}
              </button>
            )}
            {form.isDeleteConfirming && (
              <button type="button" onClick={form.cancelDeleteConfirm} className="text-sm">
                그만두기
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-semibold"
              style={colors.secondary}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={form.isSubmitting}
              className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-60"
              style={colors.primary}
            >
              {form.isSubmitting ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------- 작은 부품

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
    <p id={id} className="text-xs" style={{ color: DANGER_COLOR }}>
      {message}
    </p>
  );
}

interface ColorSwatchProps {
  label: string;
  /** null = 선택 안 함 */
  color: string | null;
  selected: boolean;
  ringColor: string;
  onSelect: () => void;
}

function ColorSwatch({ label, color, selected, ringColor, onSelect }: ColorSwatchProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onSelect}
      className="h-6 w-6 rounded-full"
      style={{
        backgroundColor: color ?? '#FFFFFF',
        border: color ? 0 : '1px dashed #9A957A',
        boxShadow: selected ? `0 0 0 2px #FFFFFF, 0 0 0 4px ${ringColor}` : undefined,
      }}
    />
  );
}

function LaterFeature({ label }: { label: string }) {
  return (
    <div
      className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2.5 text-[13px]"
      style={{ borderColor: '#BDB79B', color: '#5F6452' }}
      aria-disabled="true"
    >
      <span>{label}</span>
      <span className="rounded-full border px-2 py-0.5 text-[11px]" style={{ backgroundColor: '#F1F0DC', borderColor: '#DDD6B4' }}>
        첫 배포 이후
      </span>
    </div>
  );
}

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
