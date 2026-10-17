"use client";

import { useState } from 'react';

import ThemeButton from '@components/button/ThemeButton';
import { authApi, isApiError } from '@utils/api';
import { passLoginNotice } from '@utils/auth/handoff';
import { goTo } from '@utils/navigation';

import { AuthFrame, AuthHeading, AuthText, ButtonLink, CardError } from '../common/AuthFrame';
import { useAuthRequest } from '../common/useAuthRequest';
import { useMailLinkToken } from '../common/useMailLinkToken';
import { useSession } from '../useSession';

type Step = 'ready' | 'invalid' | 'doneSignedIn';

/**
 * VerifyEmailPage - 이메일 인증 `/signup/verify?token=…` (US-33, D-079 · 06 SITE-05d)
 * - 열자마자 보내지 않는다: [인증 끝내기]를 눌러야 보낸다 (메일 보안 검사기가 링크를 미리 열어 토큰을 써 버리지 않게)
 * - 로그인 여부와 상관없이 열린다 (확인이 끝나기 전에도). 201이면 자동 로그인 없이 /login + 초록 안내 (D-066),
 *   다른 계정으로 로그인 중이면 그대로 두고 '인증이 끝났어요' + [달력으로]
 * - 메일 링크 화면이라 바깥 리소스를 부르지 않는다 (test/security/mailLinkPages)
 */
export default function VerifyEmailPage() {
  const token = useMailLinkToken();
  const { status } = useSession();
  const [step, setStep] = useState<Step>(token ? 'ready' : 'invalid');
  const request = useAuthRequest();

  const verify = async () => {
    const result = await request.send(
      () => authApi.verifySignup({ token }),
      (error) => {
        if (!isApiError(error) || error.code !== 'TOKEN_INVALID') return false;
        setStep('invalid');
        return true;
      }
    );
    if (!result.ok) return;
    if (status === 'signedIn') {
      setStep('doneSignedIn');
      return;
    }
    passLoginNotice('verified');
    goTo('/login');
  };

  return (
    <AuthFrame>
      {step === 'ready' && (
        <>
          <AuthHeading>가입을 마무리할게요</AuthHeading>
          <AuthText>아래 버튼을 누르면 이메일 인증이 끝나요</AuthText>
          <CardError message={request.message} />
          <ThemeButton type="button" variant="primary" size="md" onClick={verify} disabled={request.locked} className="w-full justify-center disabled:opacity-60">
            {request.sending ? '보내는 중…' : '인증 끝내기'}
          </ThemeButton>
        </>
      )}

      {step === 'invalid' && (
        <>
          <AuthHeading>링크가 만료됐거나 이미 사용됐어요</AuthHeading>
          <AuthText small>이미 인증했다면 로그인하면 돼요</AuthText>
          <div className="flex flex-col gap-2">
            <ButtonLink href="/login" variant="primary">
              로그인
            </ButtonLink>
            <ButtonLink href="/signup">다시 가입하기</ButtonLink>
          </div>
        </>
      )}

      {step === 'doneSignedIn' && (
        <>
          <AuthHeading>인증이 끝났어요</AuthHeading>
          <ThemeButton type="button" variant="primary" size="md" onClick={() => goTo('/')} className="w-full justify-center">
            달력으로
          </ThemeButton>
        </>
      )}
    </AuthFrame>
  );
}
