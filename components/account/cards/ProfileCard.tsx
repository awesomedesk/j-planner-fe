"use client";

import { useId, useRef, useState, type FormEvent } from 'react';

import { useAppDispatch } from '@/app/hooks';
import type { Me } from '@/types/api';
import ThemeButton from '@components/button/ThemeButton';
import AuthField from '@components/auth/common/AuthField';
import { CardError } from '@components/auth/common/AuthFrame';
import { useAuthRequest } from '@components/auth/common/useAuthRequest';
import { meUpdated } from '@store/slices/authSlice';
import { isApiError, meApi } from '@utils/api';
import { checkEmail, fieldErrorsOf } from '@utils/auth/authRules';

import { AccountCard, CardSuccess } from '../common/AccountCard';
import { REAUTH_CANCELLED, useReauth } from '../reauth/ReauthContext';
import { checkName } from '../utils/accountRules';

const EMAIL_HINT = '새 이메일을 인증하기 전까지 지금 이메일을 써요. 인증을 마치면 모든 기기에서 로그아웃돼요.';
const EMAIL_SENT =
  '새 이메일로 인증 메일을 보냈어요. 24시간 안에 메일의 링크를 눌러 주세요. 기존 이메일에도 변경 요청을 알려 드렸어요.';

/** 기본 정보: 이름(재인증 없음) · 이메일 바꾸기(재인증, 인증 전까지 지금 이메일 유지 D-066) — 06 SITE-09 */
export default function ProfileCard({ me }: { me: Me }) {
  return (
    <AccountCard title="기본 정보">
      <NameForm me={me} />
      <EmailChange me={me} />
    </AccountCard>
  );
}

function NameForm({ me }: { me: Me }) {
  const dispatch = useAppDispatch();
  const id = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(me.name);
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState<string | null>(null);
  const request = useAuthRequest();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (request.locked) return;
    setDone(null);
    const local = checkName(name);
    if (local) {
      setError(local);
      nameRef.current?.focus();
      return;
    }
    const result = await request.send(
      () => meApi.updateName({ name: name.trim() }),
      (e) => {
        const message = fieldErrorsOf(e).name;
        if (!message) return false;
        setError(message);
        nameRef.current?.focus();
        return true;
      }
    );
    if (!result.ok) return;
    dispatch(meUpdated(result.value));
    setName(result.value.name);
    setDone('이름을 바꿨어요');
  };

  return (
    <form className="flex flex-col gap-2" onSubmit={submit} noValidate>
      <AuthField
        id={`${id}-name`}
        label="이름"
        name="name"
        autoComplete="nickname"
        value={name}
        onChange={(value) => {
          setName(value);
          setError(undefined);
        }}
        error={error}
        inputRef={nameRef}
      />
      <CardError message={request.message} />
      <CardSuccess message={done} />
      <ThemeButton type="submit" size="md" disabled={request.locked} className="self-start disabled:opacity-60">
        {request.sending ? '보내는 중…' : '이름 저장'}
      </ThemeButton>
    </form>
  );
}

type EmailStep = 'view' | 'form' | 'sent';

function EmailChange({ me }: { me: Me }) {
  const id = useId();
  const { ensureReauth, retryOnReauth } = useReauth();
  const newEmailRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<EmailStep>('view');
  /** 한 번 보낸 뒤 다시 요청하면 이전 링크는 쓸 수 없다고 알려 준다 */
  const [requestedBefore, setRequestedBefore] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const request = useAuthRequest();

  const showError = (message: string) => {
    setError(message);
    newEmailRef.current?.focus();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (request.locked) return;
    const local = checkEmail(newEmail);
    if (local) {
      showError(local);
      return;
    }
    if (!(await ensureReauth())) return;
    const result = await request.send(
      () => retryOnReauth(() => meApi.changeEmail({ email: newEmail.trim() })),
      (e) => {
        if (isApiError(e) && e.code === 'EMAIL_ALREADY_REGISTERED') {
          // 다른 사람 계정의 로그인 수단은 보여 주지 않는다 (SITE-09)
          showError('이미 가입된 이메일이에요');
          return true;
        }
        const message = fieldErrorsOf(e).email;
        if (!message) return false;
        showError(message);
        return true;
      }
    );
    if (!result.ok || result.value === REAUTH_CANCELLED) return;
    setStep('sent');
    setRequestedBefore(true);
  };

  return (
    <div className="flex flex-col gap-2 border-t border-tp-line pt-3">
      <AuthField id={`${id}-email`} label="이메일" name="email" type="email" value={me.email} onChange={() => {}} readOnly />

      {step === 'view' && (
        <ThemeButton size="md" onClick={() => setStep('form')} className="self-start">
          이메일 바꾸기
        </ThemeButton>
      )}

      {step === 'form' && (
        <form className="flex flex-col gap-2" onSubmit={submit} noValidate>
          <AuthField
            id={`${id}-new-email`}
            label="새 이메일"
            name="newEmail"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={newEmail}
            onChange={(value) => {
              setNewEmail(value);
              setError(undefined);
            }}
            error={error}
            hint={EMAIL_HINT}
            inputRef={newEmailRef}
            autoFocus
          />
          {requestedBefore && <p className="text-xs text-tp-muted">새로 요청하면 이전 링크는 쓸 수 없어요.</p>}
          <CardError message={request.message} />
          <div className="flex flex-wrap gap-2">
            <ThemeButton type="submit" variant="primary" size="md" disabled={request.locked} className="disabled:opacity-60">
              {request.sending ? '보내는 중…' : '인증 메일 보내기'}
            </ThemeButton>
            <ThemeButton
              size="md"
              onClick={() => {
                setStep('view');
                setNewEmail('');
                setError(undefined);
              }}
            >
              취소
            </ThemeButton>
          </div>
        </form>
      )}

      {step === 'sent' && (
        <>
          <p role="status" className="text-[13px] leading-relaxed text-success">
            {EMAIL_SENT}
          </p>
          <ThemeButton
            size="md"
            onClick={() => {
              setNewEmail('');
              setStep('form');
            }}
            className="self-start"
          >
            다른 이메일로 요청
          </ThemeButton>
        </>
      )}
    </div>
  );
}
