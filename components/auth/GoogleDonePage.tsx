"use client";

import { useEffect } from 'react';

import { postGoogleDone, toGoogleResultCode } from '@utils/auth/googleLogin';
import { goTo } from '@utils/navigation';

import { AuthFrame, AuthText } from './common/AuthFrame';

/**
 * GoogleDonePage - 다시 로그인 창이 연 구글 팝업의 끝 화면 `/login/google-done(?error=코드)` (US-36 AC4, D-072·D-077)
 * 원래 창에 결과를 알리고 스스로 닫는다. 같은 계정인지는 원래 창이 GET /me로 확인한다.
 * 원래 창이 없으면(주소를 직접 열었을 때) 성공은 달력, 실패는 로그인 화면 안내로 (제가 정한 부분).
 */
export default function GoogleDonePage() {
  useEffect(() => {
    const rawError = new URLSearchParams(window.location.search).get('error');
    if (postGoogleDone(rawError)) {
      window.close();
      return;
    }
    const code = toGoogleResultCode(rawError);
    goTo(code ? `/login?error=${code}` : '/');
  }, []);

  return (
    <AuthFrame>
      <AuthText>이 창은 닫아도 돼요</AuthText>
    </AuthFrame>
  );
}
