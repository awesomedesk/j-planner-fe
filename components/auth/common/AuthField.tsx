import type { InputHTMLAttributes, ReactNode, Ref } from 'react';

import { INPUT_CLASS } from '@components/form/formStyles';

export interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'onChange'> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** 칸 바로 아래 한 줄 (BE errors의 message 그대로) */
  error?: string;
  /** 칸 아래 도움말 */
  hint?: ReactNode;
  /** 도움말 줄 오른쪽 (글자 수 등) */
  hintAside?: ReactNode;
  /** 칸 안 오른쪽 (보기 버튼 등) */
  trailing?: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
}

/** 오류 칸 테두리 빨강 */
const ERROR_INPUT_CLASS = INPUT_CLASS.replace('border-tp-line', 'border-danger');

/** 칸 아래 오류·도움말을 화면 읽기에 이어 준다 (aria-describedby) */
export const describedBy = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(' ') || undefined;

/**
 * AuthField - 가입·비밀번호 화면의 입력 칸 (06 SITE-05 공통 규칙, D-079)
 * 라벨 · 칸 · (오류 한 줄) · (도움말). 오류면 테두리 빨강 + aria-invalid.
 */
export default function AuthField({ id, label, value, onChange, error, hint, hintAside, trailing, inputRef, ...input }: AuthFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          {...input}
          id={id}
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(!!error && errorId, !!hint && hintId)}
          className={`${error ? ERROR_INPUT_CLASS : INPUT_CLASS} ${trailing ? 'pr-16' : ''}`}
        />
        {trailing}
      </div>
      {error && (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      )}
      {(hint || hintAside) && (
        <div className="flex items-start justify-between gap-2 text-xs text-tp-muted">
          {hint && <p id={hintId}>{hint}</p>}
          {hintAside}
        </div>
      )}
    </div>
  );
}
