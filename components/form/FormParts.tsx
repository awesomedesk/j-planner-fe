"use client";

import type { ReactNode } from 'react';

import type { HexColor } from '@/types/api';

/**
 * 입력 창 작은 부품 (일정·Todo 입력 창 OV-01·02, MO-08·09 공통)
 */

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}

/** 이름표 + 칸 + 칸 아래 오류 */
export function Field({ label, htmlFor, error, children }: FieldProps) {
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

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-danger">
      {message}
    </p>
  );
}

interface ColorPickerProps {
  legend: string;
  options: readonly HexColor[];
  /** null = 선택 안 함 → 테마 Theme2 (D-030) */
  value: HexColor | null;
  onChange: (color: HexColor | null) => void;
  error?: string;
}

/** 항목 색 고르기: '선택 안 함' + 6색 (D-030) */
export function ColorPicker({ legend, options, value, onChange, error }: ColorPickerProps) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-[13px] font-semibold">{legend}</legend>
      <div className="flex flex-wrap items-center gap-2.5">
        <ColorSwatch label="색 선택 안 함 (테마 기본색)" color={null} selected={value === null} onSelect={() => onChange(null)} />
        {options.map((color) => (
          <ColorSwatch
            key={color}
            label={`색 ${color}`}
            color={color}
            selected={value?.toUpperCase() === color}
            onSelect={() => onChange(color)}
          />
        ))}
      </div>
      <FieldError message={error} />
    </fieldset>
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

/** 첫 배포 이후 기능: 점선 자리만 (D-008) */
export function LaterFeature({ label }: { label: string }) {
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
