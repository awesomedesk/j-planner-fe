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
import { safeNextPath } from '@utils/auth/nextPath';
import { goTo } from '@utils/navigation';

import { AuthFrame, AuthLinks, AuthNotice, LaterButton, OrDivider } from './common/AuthFrame';
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

  /** '비밀번호 찾기'로 넘길 지금 이메일 */
  const emailRef = useRef(initialEmail);

  return (
    <AuthFrame notice={notice && <AuthNotice>{LOGIN_NOTICE_TEXT[notice]}</AuthNotice>}>
      <LaterButton label="구글로 계속하기" onClick={notReady} block />

      <OrDivider />

      <LoginForm
        initialEmail={initialEmail}
        onEmailChange={(email) => (emailRef.current = email)}
        onSignedIn={() => goTo(safeNextPath(new URLSearchParams(window.location.search).get('next')))}
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
