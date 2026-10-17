"use client";

import { useId, useRef, useState, type FormEvent } from 'react';

import ThemeButton from '@components/button/ThemeButton';
import { authApi, isApiError } from '@utils/api';
import { checkNewPassword, fieldErrorsOf } from '@utils/auth/authRules';
import { passLoginNotice } from '@utils/auth/handoff';
import { goTo } from '@utils/navigation';

import { AuthFrame, AuthHeading, AuthText, ButtonLink, CardError } from '../common/AuthFrame';
import NewPasswordField from '../common/NewPasswordField';
import { useAuthRequest } from '../common/useAuthRequest';
import { useMailLinkToken } from '../common/useMailLinkToken';
import { useSession } from '../useSession';

/**
 * ResetPasswordPage - 새 비밀번호 `/password/reset?token=…` (US-35, D-079 · 06 SITE-05f)
 * - 로그인 여부와 상관없이 열린다. 새 비밀번호를 쓰고 버튼을 눌러야 보내므로 메일 보안 검사기 문제는 없다
 * - 204 → 모든 기기가 로그아웃되므로 이 브라우저의 로그인 정보도 지우고(POST /auth/logout, 실패해도 넘어감) /login + 초록 안내
 * - 비밀번호 거절은 같은 링크로 다시 입력, 링크 무효면 [다시 찾기]
 * - 메일 링크 화면이라 바깥 리소스를 부르지 않는다 (test/security/mailLinkPages)
 */
export default function ResetPasswordPage() {
  const token = useMailLinkToken();
  const [invalid, setInvalid] = useState(!token);

  return <AuthFrame>{invalid ? <LinkInvalid /> : <ResetForm token={token} onInvalid={() => setInvalid(true)} />}</AuthFrame>;
}

function ResetForm({ token, onInvalid }: { token: string; onInvalid: () => void }) {
  const { status } = useSession();
  const id = `${useId()}-password`;
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);
  const request = useAuthRequest();

  const showError = (message: string) => {
    setError(message);
    inputRef.current?.focus();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (request.locked) return;
    const local = checkNewPassword(password);
    if (local) {
      showError(local);
      return;
    }
    const result = await request.send(
      () => authApi.resetPassword({ token, newPassword: password }),
      (e) => {
        if (isApiError(e) && e.code === 'TOKEN_INVALID') {
          onInvalid();
          return true;
        }
        const message = fieldErrorsOf(e).newPassword;
        if (!message) return false;
        showError(message);
        return true;
      }
    );
    if (!result.ok) return;
    if (status === 'signedIn') {
      try {
        await authApi.logout();
      } catch {
        // 서버에서는 이미 모든 세션이 끝났다 — 실패해도 로그인 화면으로
      }
    }
    passLoginNotice('passwordReset');
    goTo('/login');
  };

  return (
    <>
      <AuthHeading>새 비밀번호 만들기</AuthHeading>
      <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
        <NewPasswordField
          id={id}
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

        <ThemeButton type="submit" variant="primary" size="md" disabled={request.locked} className="w-full justify-center disabled:opacity-60">
          {request.sending ? '보내는 중…' : '비밀번호 바꾸기'}
        </ThemeButton>
      </form>
    </>
  );
}

/** 링크 무효 (만료 30분·이미 사용·새 요청으로 무효) 또는 토큰 없음 */
function LinkInvalid() {
  return (
    <>
      <AuthHeading>링크가 만료됐거나 이미 사용됐어요</AuthHeading>
      <AuthText small>링크는 30분 동안 한 번만 쓸 수 있어요</AuthText>
      <ButtonLink href="/password/forgot" variant="primary">
        다시 찾기
      </ButtonLink>
    </>
  );
}
