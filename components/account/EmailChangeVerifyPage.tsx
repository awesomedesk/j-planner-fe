"use client";

import { useState } from 'react';

import ThemeButton from '@components/button/ThemeButton';
import { AuthFrame, AuthHeading, AuthText, ButtonLink, CardError } from '@components/auth/common/AuthFrame';
import { useAuthRequest } from '@components/auth/common/useAuthRequest';
import { useMailLinkToken } from '@components/auth/common/useMailLinkToken';
import { isApiError, meApi } from '@utils/api';
import { passLoginNotice } from '@utils/auth/handoff';
import { goTo } from '@utils/navigation';

type Step = 'ready' | 'invalid';

const INVALID_TEXT = '링크가 만료됐거나 이미 사용됐어요. 내 계정에서 이메일 변경을 다시 요청해 주세요.';

/**
 * EmailChangeVerifyPage - 새 이메일 인증 `/email/verify?token=…` (US-37, D-091 · 06 SITE-09a)
 * - 열자마자 보내지 않는다: [이메일 변경 인증하기]를 눌러야 보낸다 (메일 보안 검사기가 링크를 미리 열어 토큰을 써 버리지 않게)
 * - 로그인하지 않아도 열린다. 204면 모든 기기가 로그아웃됨 → /login + '이메일을 바꿨어요…' (자동 로그인 없음).
 *   /login은 페이지를 새로 열어 로그인 상태를 서버와 다시 맞춘다.
 * - 통신·500 오류는 토큰을 메모리에 두고 다시 누를 수 있다
 * - 메일 링크 화면이라 바깥 리소스를 부르지 않는다 (test/security/mailLinkPages)
 */
export default function EmailChangeVerifyPage() {
  const token = useMailLinkToken();
  const [invalidAfterSend, setInvalid] = useState(false);
  // token === null: 아직 hydration 중 — 화면을 정하지 않음 (서버·브라우저 첫 화면을 같게)
  const step: Step | null = invalidAfterSend ? 'invalid' : token === null ? null : token ? 'ready' : 'invalid';
  const request = useAuthRequest();

  const verify = async () => {
    const result = await request.send(
      () => meApi.verifyEmailChange({ token: token ?? '' }),
      (error) => {
        if (!isApiError(error) || error.code !== 'TOKEN_INVALID') return false;
        setInvalid(true);
        return true;
      }
    );
    if (!result.ok) return;
    passLoginNotice('emailChanged');
    goTo('/login');
  };

  return (
    <AuthFrame>
      {step === 'ready' && (
        <>
          <AuthHeading>이메일 변경을 마무리할게요</AuthHeading>
          <AuthText>인증을 마치면 모든 기기에서 로그아웃돼요. 새 이메일로 다시 로그인해 주세요.</AuthText>
          <CardError message={request.message} />
          <ThemeButton type="button" variant="primary" size="md" onClick={verify} disabled={request.locked} className="w-full justify-center disabled:opacity-60">
            {request.sending ? '보내는 중…' : '이메일 변경 인증하기'}
          </ThemeButton>
        </>
      )}

      {step === 'invalid' && (
        <>
          <AuthText>{INVALID_TEXT}</AuthText>
          <ButtonLink href="/login" variant="primary">
            로그인
          </ButtonLink>
        </>
      )}
    </AuthFrame>
  );
}
