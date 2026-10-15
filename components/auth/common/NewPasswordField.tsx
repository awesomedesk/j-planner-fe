"use client";

import { useState, type Ref } from 'react';

import { PASSWORD_MIN, passwordLength } from '@utils/auth/authRules';

import AuthField from './AuthField';

interface NewPasswordFieldProps {
  id: string;
  label: string;
  /** 서버로 보내는 칸 이름 (가입 password, 재설정 newPassword) */
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * NewPasswordField - 새 비밀번호 칸 (06 SITE-05 공통 규칙, D-079)
 * - 보기 버튼, 확인용 두 번째 칸은 없음(보기 버튼으로 대신)
 * - 안내 '15자 이상이면 돼요…' + 글자 수 n/15 (15자가 되면 ✓)
 * - autocomplete new-password (비밀번호 관리자가 새 비밀번호를 만들어 줄 수 있게)
 */
export default function NewPasswordField({ id, label, name, value, onChange, error, inputRef }: NewPasswordFieldProps) {
  const [show, setShow] = useState(false);
  const length = passwordLength(value);
  const enough = length >= PASSWORD_MIN;

  return (
    <AuthField
      id={id}
      label={label}
      name={name}
      type={show ? 'text' : 'password'}
      autoComplete="new-password"
      value={value}
      onChange={onChange}
      error={error}
      inputRef={inputRef}
      hint="15자 이상이면 돼요. 띄어쓰기를 넣은 긴 문장도 좋아요"
      hintAside={
        <span className={`shrink-0 tabular-nums ${enough ? 'font-semibold text-success' : ''}`}>
          <span>
            {length}/{PASSWORD_MIN}
          </span>
          {enough && <span aria-hidden="true"> ✓</span>}
        </span>
      }
      trailing={
        <button
          type="button"
          aria-pressed={show}
          aria-label="비밀번호 보기"
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-0 right-2 my-auto h-7 rounded px-2 text-xs text-tp-muted"
        >
          {show ? '숨기기' : '보기'}
        </button>
      }
    />
  );
}
