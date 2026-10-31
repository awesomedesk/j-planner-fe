"use client";

import { useId, useRef, useState, type FormEvent } from 'react';

import ThemeButton from '@components/button/ThemeButton';
import AuthField from '@components/auth/common/AuthField';
import { CardError } from '@components/auth/common/AuthFrame';
import { useAuthRequest } from '@components/auth/common/useAuthRequest';
import { isApiError, meApi, REAUTH_GOOGLE_PATH } from '@utils/api';
import { goTo } from '@utils/navigation';

import ModalShell from '../common/ModalShell';
import { markGoogleFlow } from '../utils/googleFlow';

export const REAUTH_TITLE = '본인 확인이 필요해요';
const WRONG_PASSWORD = '비밀번호가 맞지 않아요';

interface ReauthDialogProps {
  /** 비밀번호가 있으면 비밀번호 칸 */
  hasPassword: boolean;
  /** 구글이 연결돼 있으면 [Google로 본인 확인] */
  hasGoogle: boolean;
  onConfirmed: () => void;
  onCancel: () => void;
}

/**
 * 민감 작업 전 본인 확인 (US-37 AC2, D-085 · 06 SITE-09)
 * - 비밀번호: POST /me/reauth → 204면 onConfirmed. 400 REAUTH_FAILED는 칸 오류(로그인 만료 창 아님), 429는 대기 잠금
 * - 구글: /api/v1/me/reauth/google로 이동 → 돌아오면 사용자가 작업을 다시 고른다 (작업 내용은 저장하지 않음)
 * - 비밀번호는 이 창 안에만 두고 닫히면 버린다
 */
export default function ReauthDialog({ hasPassword, hasGoogle, onConfirmed, onCancel }: ReauthDialogProps) {
  const id = useId();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const request = useAuthRequest();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (request.locked) return;
    if (!password) {
      setError('비밀번호를 입력해 주세요.');
      passwordRef.current?.focus();
      return;
    }
    const result = await request.send(
      () => meApi.reauth({ password }),
      (e) => {
        if (!isApiError(e) || e.code !== 'REAUTH_FAILED') return false;
        setError(e.errors.find((f) => f.field === 'password')?.message || WRONG_PASSWORD);
        passwordRef.current?.focus();
        return true;
      }
    );
    if (result.ok) onConfirmed();
  };

  const withGoogle = () => {
    markGoogleFlow('reauth');
    goTo(REAUTH_GOOGLE_PATH);
  };

  return (
    <ModalShell title={REAUTH_TITLE} onCancel={onCancel} initialFocusRef={hasPassword ? passwordRef : undefined}>
      {hasPassword && (
        <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
          <AuthField
            id={`${id}-password`}
            label="현재 비밀번호"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setError(undefined);
            }}
            error={error}
            inputRef={passwordRef}
          />
          <CardError message={request.message} />
          <ThemeButton type="submit" variant="primary" size="md" disabled={request.locked} className="w-full justify-center disabled:opacity-60">
            확인
          </ThemeButton>
        </form>
      )}
      {hasGoogle && (
        <ThemeButton size="md" onClick={withGoogle} className="w-full justify-center">
          Google로 본인 확인
        </ThemeButton>
      )}
      <ThemeButton size="md" onClick={onCancel} className="w-full justify-center">
        취소
      </ThemeButton>
    </ModalShell>
  );
}
