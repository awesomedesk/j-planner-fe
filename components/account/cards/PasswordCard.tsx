"use client";

import { useId, useState, type FormEvent, type RefObject } from 'react';

import type { Me } from '@/types/api';
import ThemeButton from '@components/button/ThemeButton';
import { CardError } from '@components/auth/common/AuthFrame';
import NewPasswordField from '@components/auth/common/NewPasswordField';
import { useAuthRequest } from '@components/auth/common/useAuthRequest';
import { meApi } from '@utils/api';
import { checkNewPassword, fieldErrorsOf } from '@utils/auth/authRules';

import { AccountCard, CardSuccess, CardText } from '../common/AccountCard';
import { REAUTH_CANCELLED, useReauth } from '../reauth/ReauthContext';

interface PasswordCardProps {
  me: Me;
  /** 로그인 수단 카드의 [비밀번호 추가]가 이 칸으로 초점을 옮긴다 */
  inputRef: RefObject<HTMLInputElement | null>;
  /** 성공하면: 내 정보·기기 목록 다시 받기 */
  onChanged: () => void;
}

/**
 * 비밀번호 바꾸기·추가 (US-37 AC3·AC4, 06 SITE-09) — hasPassword로 제목·버튼이 바뀐다.
 * 재인증 뒤 PUT /me/password. 이 기기는 그대로, 다른 기기 로그아웃.
 * 새 비밀번호는 성공하거나 본인 확인을 취소하면 지운다 (실패하면 고쳐 쓰게 남김, SITE-09 공통).
 */
export default function PasswordCard({ me, inputRef, onChanged }: PasswordCardProps) {
  const id = useId();
  const { ensureReauth, retryOnReauth } = useReauth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState<string | null>(null);
  const request = useAuthRequest();
  const title = me.hasPassword ? '비밀번호 바꾸기' : '비밀번호 추가';

  const showError = (message: string) => {
    setError(message);
    inputRef.current?.focus();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (request.locked) return;
    setDone(null);
    const local = checkNewPassword(password);
    if (local) {
      showError(local);
      return;
    }
    if (!(await ensureReauth())) {
      setPassword('');
      return;
    }
    const adding = !me.hasPassword;
    const result = await request.send(
      () => retryOnReauth(() => meApi.changePassword({ newPassword: password })),
      (e) => {
        const message = fieldErrorsOf(e).newPassword;
        if (!message) return false;
        showError(message);
        return true;
      }
    );
    if (result.ok && result.value === REAUTH_CANCELLED) setPassword('');
    if (!result.ok || result.value === REAUTH_CANCELLED) return;
    setPassword('');
    setDone(adding ? '비밀번호를 추가했어요. 다른 기기에서 로그아웃했어요' : '비밀번호를 바꿨어요. 다른 기기에서 로그아웃했어요');
    onChanged();
  };

  return (
    <AccountCard title={title}>
      <CardText>완료하면 다른 기기에서 로그아웃돼요. 이 기기는 계속 사용할 수 있어요.</CardText>
      <form className="flex flex-col gap-2" onSubmit={submit} noValidate>
        <NewPasswordField
          id={`${id}-new-password`}
          label="새 비밀번호"
          name="newPassword"
          value={password}
          onChange={(value) => {
            setPassword(value);
            setError(undefined);
          }}
          error={error}
          inputRef={inputRef}
        />
        <CardError message={request.message} />
        <CardSuccess message={done} />
        <ThemeButton type="submit" variant="primary" size="md" disabled={request.locked} className="self-start disabled:opacity-60">
          {request.sending ? '보내는 중…' : title}
        </ThemeButton>
      </form>
    </AccountCard>
  );
}
