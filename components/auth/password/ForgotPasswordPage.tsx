"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';

import ThemeButton from '@components/button/ThemeButton';
import { authApi } from '@utils/api';
import { checkEmail, fieldErrorsOf } from '@utils/auth/authRules';
import { clearHandoffEmail, peekHandoffEmail } from '@utils/auth/handoff';
import { useCountdown } from '@utils/hooks/useCountdown';
import { goTo } from '@utils/navigation';

import AuthField from '../common/AuthField';
import { AuthFrame, AuthHeading, AuthLinks, AuthText, ButtonLink, CardError } from '../common/AuthFrame';
import { useAuthRequest } from '../common/useAuthRequest';
import { RESEND_SECONDS } from '../signup/SignupPage';
import { useSession } from '../useSession';

/**
 * ForgotPasswordPage - 비밀번호 찾기 `/password/forgot` (US-35, D-079 · 06 SITE-05e)
 * - 로그인한 채로 오면 달력으로
 * - 로그인·가입 화면에서 넘긴 이메일을 채워서 연다 (sessionStorage, 읽고 지움 — 주소에 넣지 않음)
 * - 202는 늘 같다 → 같은 주소에서 늘 같은 안내 (가입 여부를 드러내지 않음) + [다시 보내기] 60초 잠금
 */
export default function ForgotPasswordPage() {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'signedIn') goTo('/');
  }, [status]);

  if (status !== 'signedOut' && status !== 'error') return null;

  return <ForgotFlow />;
}

function ForgotFlow() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  return <AuthFrame>{sentTo === null ? <ForgotForm onSent={setSentTo} /> : <MailSent email={sentTo} />}</AuthFrame>;
}

function ForgotForm({ onSent }: { onSent: (email: string) => void }) {
  const id = `${useId()}-email`;
  const [email, setEmail] = useState(peekHandoffEmail);
  const [error, setError] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);
  const request = useAuthRequest();

  useEffect(() => {
    clearHandoffEmail();
  }, []);

  const showError = (message: string) => {
    setError(message);
    inputRef.current?.focus();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (request.locked) return;
    const local = checkEmail(email);
    if (local) {
      showError(local);
      return;
    }
    const sentEmail = email.trim();
    const result = await request.send(
      () => authApi.forgotPassword({ email: sentEmail }),
      (e) => {
        const message = fieldErrorsOf(e).email;
        if (!message) return false;
        showError(message);
        return true;
      }
    );
    if (result.ok) onSent(sentEmail);
  };

  return (
    <>
      <AuthHeading>비밀번호 찾기</AuthHeading>
      <AuthText>가입한 이메일을 쓰면 비밀번호를 새로 만드는 링크를 보내 드려요</AuthText>

      <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
        <AuthField
          id={id}
          label="이메일"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(value) => {
            setEmail(value);
            setError(undefined);
          }}
          error={error}
          inputRef={inputRef}
        />

        <CardError message={request.message} />

        <ThemeButton type="submit" variant="primary" size="md" disabled={request.locked} className="w-full justify-center disabled:opacity-60">
          {request.sending ? '보내는 중…' : '재설정 메일 보내기'}
        </ThemeButton>
      </form>

      <AuthLinks links={[{ label: '로그인으로 돌아가기', href: '/login' }]} />
    </>
  );
}

/** 보낸 뒤 안내 — 가입돼 있든 아니든 같은 말 */
function MailSent({ email }: { email: string }) {
  const request = useAuthRequest();
  const [cooldown, setCooldown] = useCountdown();
  const [resent, setResent] = useState(false);

  const resend = async () => {
    if (cooldown > 0) return;
    const result = await request.send(() => authApi.forgotPassword({ email }));
    if (result.ok) {
      setResent(true);
      setCooldown(RESEND_SECONDS);
    }
  };

  return (
    <>
      <AuthHeading>메일을 확인해 주세요</AuthHeading>
      <AuthText>
        <b className="font-semibold break-all">{email}</b>로 가입돼 있다면 메일을 보냈어요. 30분 안에 링크를 눌러 주세요.
      </AuthText>

      <div className="flex flex-col items-center gap-1">
        <ThemeButton type="button" size="md" onClick={resend} disabled={request.locked || cooldown > 0} className="w-full justify-center disabled:opacity-60">
          다시 보내기
        </ThemeButton>
        {resent && (
          <p role="status" className="text-[13px] text-success">
            다시 보냈어요
          </p>
        )}
        {cooldown > 0 && <p className="text-xs text-tp-muted">{cooldown}초 뒤 다시 보낼 수 있어요</p>}
      </div>

      <CardError message={request.message} />

      <ButtonLink href="/login" variant="primary">
        로그인으로
      </ButtonLink>
    </>
  );
}
