"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';

import { useAppDispatch } from '@/app/hooks';
import ThemeButton from '@components/button/ThemeButton';
import { showNotice } from '@store/slices/noticeSlice';
import { authApi, isApiError } from '@utils/api';
import { checkSignup, fieldErrorsOf, firstErrorField, type FieldErrors } from '@utils/auth/authRules';
import { passEmail } from '@utils/auth/handoff';
import { useCountdown } from '@utils/hooks/useCountdown';
import { goTo } from '@utils/navigation';

import AuthField, { describedBy } from '../common/AuthField';
import { AuthFrame, AuthHeading, AuthText, CardError, LaterButton, OrDivider } from '../common/AuthFrame';
import NewPasswordField from '../common/NewPasswordField';
import { useAuthRequest } from '../common/useAuthRequest';
import { NOT_READY_MESSAGE } from '../LoginPage';
import { useSession } from '../useSession';

/** 인증 메일 다시 보내기 간격 (BE 60초, D-061) */
export const RESEND_SECONDS = 60;

type SignupField = 'email' | 'name' | 'password' | 'ageOver14';
const FIELD_ORDER: readonly SignupField[] = ['email', 'name', 'password', 'ageOver14'];

/**
 * SignupPage - 가입 화면 `/signup` (US-33, D-079 · 06 SITE-05b·c)
 * 로그인한 채로 오면 달력으로. 202면 같은 주소에서 '메일을 확인해 주세요'(SITE-05c)로 바뀐다.
 * 보낸 이메일은 이 화면의 메모리에만 둔다(주소·저장소에 남기지 않음) — 새로고침하면 빈 가입 화면.
 */
export default function SignupPage() {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'signedIn') goTo('/');
  }, [status]);

  if (status !== 'signedOut' && status !== 'error') return null;

  return <SignupFlow />;
}

function SignupFlow() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  return (
    <AuthFrame>
      {sentTo === null ? (
        <SignupForm key={formKey} onSent={setSentTo} />
      ) : (
        <MailSent
          email={sentTo}
          onRestart={() => {
            setSentTo(null);
            setFormKey((k) => k + 1);
          }}
        />
      )}
    </AuthFrame>
  );
}

function SignupForm({ onSent }: { onSent: (email: string) => void }) {
  const dispatch = useAppDispatch();
  const notReady = () => dispatch(showNotice(NOT_READY_MESSAGE, 'info'));
  const baseId = useId();
  const ids = { email: `${baseId}-email`, name: `${baseId}-name`, password: `${baseId}-password`, ageOver14: `${baseId}-age` };

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [ageOver14, setAgeOver14] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  /** 409 이미 가입: 그 계정의 로그인 방법 (EMAIL → [로그인]/[비밀번호 찾기]) */
  const [registered, setRegistered] = useState<('EMAIL' | 'GOOGLE')[] | null>(null);
  const request = useAuthRequest();

  const emailRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);

  /** 칸에 다시 쓰면 그 칸 오류는 지운다 */
  const clearError = (field: SignupField) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (field === 'email') setRegistered(null);
  };

  const showErrors = (next: FieldErrors) => {
    setErrors(next);
    const first = firstErrorField(FIELD_ORDER, next) as SignupField | undefined;
    if (!first) return;
    const refs = { email: emailRef, name: nameRef, password: passwordRef, ageOver14: ageRef };
    refs[first].current?.focus();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (request.locked) return;
    const local = checkSignup({ email, name, password, ageOver14 });
    if (Object.keys(local).length > 0) {
      showErrors(local);
      return;
    }
    setRegistered(null);
    const sentEmail = email.trim();
    const result = await request.send(
      () => authApi.signup({ email: sentEmail, password, name: name.trim(), ageOver14: true }),
      (error) => {
        if (!isApiError(error)) return false;
        if (error.code === 'EMAIL_ALREADY_REGISTERED') {
          setPassword('');
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
    if (result.ok) onSent(sentEmail);
  };

  /** 409 [로그인]·[비밀번호 찾기]: 이메일을 채워서 (URL이 아니라 sessionStorage로) */
  const goWithEmail = (path: string) => {
    passEmail(email);
    goTo(path);
  };

  return (
    <>
      <LaterButton label="구글로 계속하기" onClick={notReady} block />
      <OrDivider />

      <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
        <div className="flex flex-col gap-2">
          <AuthField
            id={ids.email}
            label="이메일"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(value) => {
              setEmail(value);
              clearError('email');
            }}
            error={errors.email}
            inputRef={emailRef}
          />
          {registered?.includes('EMAIL') && (
            <div className="flex gap-2">
              <ThemeButton type="button" onClick={() => goWithEmail('/login')}>
                로그인
              </ThemeButton>
              <ThemeButton type="button" onClick={() => goWithEmail('/password/forgot')}>
                비밀번호 찾기
              </ThemeButton>
            </div>
          )}
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

        <NewPasswordField
          id={ids.password}
          label="비밀번호"
          name="password"
          value={password}
          onChange={(value) => {
            setPassword(value);
            clearError('password');
          }}
          error={errors.password}
          inputRef={passwordRef}
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

      {/* 약관 문구는 US-39 법 검토 때 확정, 링크는 그때까지 점선 자리 (D-079) */}
      <AuthText small>가입하면 이용약관과 개인정보처리방침에 동의하는 것으로 봐요</AuthText>
      <div className="flex justify-center gap-2">
        <LaterButton label="이용약관" onClick={notReady} />
        <LaterButton label="개인정보처리방침" onClick={notReady} />
      </div>

      <p className="text-center text-[13px] text-tp-muted">
        이미 계정이 있나요?{' '}
        <a href="/login" className="font-semibold text-ink underline-offset-2 hover:underline">
          로그인
        </a>
      </p>
    </>
  );
}

/** SITE-05c 메일 확인 안내 */
function MailSent({ email, onRestart }: { email: string; onRestart: () => void }) {
  const request = useAuthRequest();
  const [cooldown, setCooldown] = useCountdown();
  const [resent, setResent] = useState(false);

  const resend = async () => {
    if (cooldown > 0) return;
    const result = await request.send(() => authApi.resendSignupMail({ email }));
    if (result.ok) {
      setResent(true);
      setCooldown(RESEND_SECONDS);
    }
  };

  return (
    <>
      <AuthHeading>메일을 확인해 주세요</AuthHeading>
      <AuthText>
        <b className="font-semibold break-all">{email}</b>로 인증 메일을 보냈어요. 24시간 안에 메일의 링크를 눌러 주세요.
      </AuthText>

      {email && (
        <div className="flex flex-col items-center gap-1">
          <ThemeButton type="button" size="md" onClick={resend} disabled={request.locked || cooldown > 0} className="w-full justify-center disabled:opacity-60">
            인증 메일 다시 보내기
          </ThemeButton>
          {resent && (
            <p role="status" className="text-[13px] text-success">
              다시 보냈어요
            </p>
          )}
          {cooldown > 0 && <p className="text-xs text-tp-muted">{cooldown}초 뒤 다시 보낼 수 있어요</p>}
        </div>
      )}

      <CardError message={request.message} />

      <p className="text-center text-xs leading-relaxed text-tp-muted">
        메일이 안 왔나요? 스팸함을 확인해 주세요. 이메일을 잘못 썼다면{' '}
        <button type="button" onClick={onRestart} className="font-semibold text-ink underline underline-offset-2">
          다시 가입하기
        </button>
      </p>
    </>
  );
}
