"use client";

import { useEffect, useRef, useState } from 'react';

import { useAppDispatch } from '@/app/hooks';
import { showNotice } from '@store/slices/noticeSlice';
import {
  clearHandoffEmail,
  clearLoginNotice,
  LOGIN_NOTICE_TEXT,
  passEmail,
  peekHandoffEmail,
  peekLoginNotice,
} from '@utils/auth/handoff';
import { googleResultMessage, toGoogleResultCode, type GoogleResultCode } from '@utils/auth/googleLogin';
import { safeNextPath } from '@utils/auth/nextPath';
import { withRestored } from '@utils/auth/restored';
import { goTo } from '@utils/navigation';

import { AuthFrame, AuthLinks, AuthNotice, LaterButton, OrDivider } from './common/AuthFrame';
import GoogleStartButton from './common/GoogleStartButton';
import LoginForm from './LoginForm';
import { useSession } from './useSession';

/** 아직 없는 기능 자리를 눌렀을 때 (D-008 방식, D-072) */
export const NOT_READY_MESSAGE = '준비 중이에요';

/**
 * LoginPage - 로그인 화면 `/login` (US-34, D-072 · 06 SITE-05a, D-079)
 * 가운데 카드(모바일은 전체 폭). 성공하면 `?next=`(사이트 안 경로만) 또는 달력으로 페이지를 새로 연다.
 */
export default function LoginPage() {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'signedIn') goTo('/');
  }, [status]);

  if (status !== 'signedOut' && status !== 'error') return null;

  return <LoginCard />;
}

function LoginCard() {
  const dispatch = useAppDispatch();
  const notReady = () => dispatch(showNotice(NOT_READY_MESSAGE, 'info'));

  // 다른 화면에서 넘겨준 것: 초록 안내(인증 끝·재설정 끝), 이메일(가입 화면 409 [로그인]) — D-079
  const [notice] = useState(peekLoginNotice);
  const [initialEmail] = useState(peekHandoffEmail);
  useEffect(() => {
    clearLoginNotice();
    clearHandoffEmail();
  }, []);

  // 구글 결과 안내 (US-36, D-082): BE가 /login?error=코드로 보냄. 읽은 뒤 주소에서 error만 지운다 (제가 정한 부분)
  const [googleResult] = useState(() => toGoogleResultCode(new URLSearchParams(window.location.search).get('error')));
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('error')) return;
    params.delete('error');
    const rest = params.toString();
    window.history.replaceState(null, '', rest ? `${window.location.pathname}?${rest}` : window.location.pathname);
  }, []);

  /** 구글로 로그인해도 같은 화면으로 돌아가게 (D-082 6) */
  const [next] = useState(() => new URLSearchParams(window.location.search).get('next'));

  /** '비밀번호 찾기'로 넘길 지금 이메일 */
  const emailRef = useRef(initialEmail);

  return (
    <AuthFrame notice={notice && <AuthNotice>{LOGIN_NOTICE_TEXT[notice]}</AuthNotice>}>
      {googleResult && <GoogleResultLine code={googleResult} />}

      <GoogleStartButton next={next} />

      <OrDivider />

      <LoginForm
        initialEmail={initialEmail}
        onEmailChange={(email) => (emailRef.current = email)}
        onSignedIn={(_, restored) => {
          const target = safeNextPath(new URLSearchParams(window.location.search).get('next'));
          goTo(restored ? withRestored(target) : target);
        }}
      />

      <AuthLinks
        links={[
          { label: '비밀번호 찾기', href: '/password/forgot', onClick: () => passEmail(emailRef.current) },
          { label: '가입하기', href: '/signup' },
        ]}
      />

      <div className="flex justify-center gap-2 pt-2">
        <LaterButton label="이용약관" onClick={notReady} />
        <LaterButton label="개인정보처리방침" onClick={notReady} />
      </div>
    </AuthFrame>
  );
}

/** 구글 결과 안내 한 줄 (06 SITE-05a). 같은 이메일 계정이 있으면 [비밀번호 찾기]도 */
function GoogleResultLine({ code }: { code: GoogleResultCode }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-1 text-center text-[13px] text-danger">
      <p>{googleResultMessage(code)}</p>
      {code === 'GOOGLE_EMAIL_ACCOUNT_EXISTS' && (
        <a href="/password/forgot" className="font-medium text-ink underline">
          비밀번호 찾기
        </a>
      )}
    </div>
  );
}
