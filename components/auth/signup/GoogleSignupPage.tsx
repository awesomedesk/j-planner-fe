"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';

import type { GoogleSignupInfo } from '@/types/api';
import { useAppDispatch } from '@/app/hooks';
import ThemeButton from '@components/button/ThemeButton';
import { showNotice } from '@store/slices/noticeSlice';
import { authApi, isApiError } from '@utils/api';
import { cardErrorOf, fieldErrorsOf, firstErrorField, type FieldErrors } from '@utils/auth/authRules';
import { passEmail } from '@utils/auth/handoff';
import { safeNextPath } from '@utils/auth/nextPath';
import { goTo } from '@utils/navigation';

import AuthField, { describedBy } from '../common/AuthField';
import { AuthFrame, AuthHeading, AuthText, CardError, LaterButton } from '../common/AuthFrame';
import GoogleStartButton from '../common/GoogleStartButton';
import { useAuthRequest } from '../common/useAuthRequest';
import { NOT_READY_MESSAGE } from '../LoginPage';
import { useSession } from '../useSession';
import { RegisteredActions } from './SignupPage';

/** 이름 최대 글자 수 (BE GoogleSignupService NAME_MAX) */
export const NAME_MAX = 50;

/** 대기 정보가 없음 (10분 지남·다른 창에서 로그인·로그아웃·이미 가입) */
const EXPIRED = 'GOOGLE_SIGNUP_EXPIRED';

type GoogleSignupField = 'email' | 'name' | 'ageOver14';
const FIELD_ORDER: readonly GoogleSignupField[] = ['email', 'name', 'ageOver14'];

/** 화면 검사: 이름 비어 있음·50자 넘음, 14세 미체크 (SITE-05g). 50자 넘음 문구는 BE와 같게 */
export function checkGoogleSignup(input: { name: string; ageOver14: boolean }): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  if (!name) errors.name = '이름을 입력해 주세요.';
  else if (Array.from(name).length > NAME_MAX) errors.name = `이름은 1~${NAME_MAX}자로 입력해 주세요.`;
  if (!input.ageOver14) errors.ageOver14 = '만 14세 이상만 가입할 수 있어요.';
  return errors;
}

type Load = { kind: 'loading' } | { kind: 'ready'; info: GoogleSignupInfo } | { kind: 'expired' } | { kind: 'failed'; message: string };

/**
 * GoogleSignupPage - 구글 가입 확인 화면 `/signup/google` (US-36, D-083 · 06 SITE-05g)
 * 처음 보는 구글 계정이면 BE가 이 화면으로 보낸다(회원은 아직 없음, 10분 안).
 * GET으로 이메일·이름을 채우고 [가입하기] → 201이면 로그인된 채 next 또는 달력으로 페이지를 새로 연다.
 * 이미 로그인한 채로 오면 달력으로.
 */
export default function GoogleSignupPage() {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'signedIn') goTo('/');
  }, [status]);

  if (status !== 'signedOut' && status !== 'error') return null;

  return <GoogleSignupFlow />;
}

function GoogleSignupFlow() {
  const [load, setLoad] = useState<Load>({ kind: 'loading' });

  useEffect(() => {
    let alive = true;
    authApi.googleSignupInfo().then(
      (info) => alive && setLoad({ kind: 'ready', info }),
      (error) => {
        if (!alive) return;
        setLoad(isApiError(error) && error.code === EXPIRED ? { kind: 'expired' } : { kind: 'failed', message: cardErrorOf(error) });
      }
    );
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AuthFrame>
      {load.kind === 'ready' && <GoogleSignupForm info={load.info} onExpired={() => setLoad({ kind: 'expired' })} />}
      {load.kind === 'expired' && <Expired />}
      {load.kind === 'failed' && <CardError message={load.message} />}
    </AuthFrame>
  );
}

function GoogleSignupForm({ info, onExpired }: { info: GoogleSignupInfo; onExpired: () => void }) {
  const dispatch = useAppDispatch();
  const notReady = () => dispatch(showNotice(NOT_READY_MESSAGE, 'info'));
  const baseId = useId();
  const ids = { email: `${baseId}-email`, name: `${baseId}-name`, ageOver14: `${baseId}-age` };

  const [name, setName] = useState(info.name);
  const [ageOver14, setAgeOver14] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  /** 409 기다리는 사이 같은 이메일로 가입된 계정이 생김: 그 계정의 로그인 방법 */
  const [registered, setRegistered] = useState<('EMAIL' | 'GOOGLE')[] | null>(null);
  const request = useAuthRequest();

  const emailRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);

  const clearError = (field: GoogleSignupField) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const showErrors = (next: FieldErrors) => {
    setErrors(next);
    const first = firstErrorField(FIELD_ORDER, next) as GoogleSignupField | undefined;
    if (!first) return;
    const refs = { email: emailRef, name: nameRef, ageOver14: ageRef };
    refs[first].current?.focus();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (request.locked) return;
    const local = checkGoogleSignup({ name, ageOver14 });
    if (Object.keys(local).length > 0) {
      showErrors(local);
      return;
    }
    setRegistered(null);
    const result = await request.send(
      () => authApi.completeGoogleSignup({ name: name.trim(), ageOver14: true }),
      (error) => {
        if (!isApiError(error)) return false;
        if (error.code === EXPIRED) {
          onExpired();
          return true;
        }
        if (error.code === 'EMAIL_ALREADY_REGISTERED') {
          setRegistered(error.problem?.loginMethods ?? ['EMAIL']);
          showErrors({ email: error.message || '이미 가입된 이메일이에요' });
          return true;
        }
        const fields = fieldErrorsOf(error);
        if (Object.keys(fields).length === 0) return false;
        showErrors(fields);
        return true;
      }
    );
    // 로그인됨(새 세션·새 CSRF 쿠키) → 페이지를 새로 연다
    if (result.ok) goTo(safeNextPath(info.next));
  };

  const goWithEmail = (path: string) => {
    passEmail(info.email);
    goTo(path);
  };

  return (
    <>
      <AuthText>거의 다 됐어요</AuthText>
      <AuthHeading>구글 계정으로 가입해요</AuthHeading>

      <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
        <div className="flex flex-col gap-2">
          <AuthField
            id={ids.email}
            label="이메일"
            name="email"
            type="email"
            value={info.email}
            onChange={() => {}}
            readOnly
            error={errors.email}
            inputRef={emailRef}
          />
          {registered && <RegisteredActions methods={registered} onEmailPath={goWithEmail} />}
        </div>

        <AuthField
          id={ids.name}
          label="이름"
          name="name"
          autoComplete="nickname"
          value={name}
          onChange={(value) => {
            setName(value);
            clearError('name');
          }}
          error={errors.name}
          hint="달력에 보일 이름이에요. 별명도 괜찮아요"
          inputRef={nameRef}
        />

        <div className="flex flex-col gap-1">
          <label htmlFor={ids.ageOver14} className="flex items-center gap-2 text-sm">
            <input
              id={ids.ageOver14}
              ref={ageRef}
              type="checkbox"
              name="ageOver14"
              checked={ageOver14}
              onChange={(e) => {
                setAgeOver14(e.target.checked);
                clearError('ageOver14');
              }}
              aria-invalid={errors.ageOver14 ? true : undefined}
              aria-describedby={describedBy(!!errors.ageOver14 && `${ids.ageOver14}-error`)}
              className="h-4 w-4 accent-tp-primary"
            />
            만 14세 이상이에요
          </label>
          {errors.ageOver14 && (
            <p id={`${ids.ageOver14}-error`} className="text-xs text-danger">
              {errors.ageOver14}
            </p>
          )}
        </div>

        <CardError message={request.message} />

        <ThemeButton type="submit" variant="primary" size="md" disabled={request.locked} className="w-full justify-center disabled:opacity-60">
          {request.sending ? '보내는 중…' : '가입하기'}
        </ThemeButton>
      </form>

      {/* 약관 문구·링크는 가입 화면(SITE-05b)과 같음 — US-39 전까지 점선 자리 */}
      <AuthText small>가입하면 이용약관과 개인정보처리방침에 동의하는 것으로 봐요</AuthText>
      <div className="flex justify-center gap-2">
        <LaterButton label="이용약관" onClick={notReady} />
        <LaterButton label="개인정보처리방침" onClick={notReady} />
      </div>

      <p className="text-center text-[13px] text-tp-muted">
        <a href="/signup" className="font-semibold text-ink underline-offset-2 hover:underline">
          다른 방법으로 가입하기
        </a>
      </p>
    </>
  );
}

/** 대기 정보가 없을 때: 처음부터 다시 (구글 시작 때 next는 이미 사라짐) */
function Expired() {
  return (
    <>
      <AuthHeading>시간이 지나 다시 해야 해요</AuthHeading>
      <GoogleStartButton />
    </>
  );
}
