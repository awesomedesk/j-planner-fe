"use client";

import { useEffect } from 'react';

import { postGoogleDone, toGoogleResultCode } from '@utils/auth/googleLogin';
import { withRestored } from '@utils/auth/restored';
import { goTo } from '@utils/navigation';

import { AuthFrame, AuthText } from './common/AuthFrame';

/**
 * GoogleDonePage - 다시 로그인 창이 연 구글 팝업의 끝 화면 `/login/google-done(?error=코드)` (US-36 AC4, D-072·D-077)
 * 원래 창에 결과를 알리고 스스로 닫는다. 같은 계정인지는 원래 창이 GET /me로 확인한다.
 * 원래 창이 없으면(주소를 직접 열었을 때) 성공은 달력, 실패는 로그인 화면 안내로 (제가 정한 부분).
 * 휴면에서 복원됐으면(`?restored=1`, US-38) 원래 창에 함께 알리고, 원래 창이 없으면 달력에 `restored=1`을 넘긴다.
 */
export default function GoogleDonePage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawError = params.get('error');
    const restored = params.get('restored') === '1';
    if (postGoogleDone(rawError, restored)) {
      window.close();
      return;
    }
    const code = toGoogleResultCode(rawError);
    goTo(code ? `/login?error=${code}` : restored ? withRestored('/') : '/');
  }, []);

  return (
    <AuthFrame>
      <AuthText>이 창은 닫아도 돼요</AuthText>
    </AuthFrame>
  );
}
