"use client";

import ThemeButton from '@components/button/ThemeButton';
import { startGoogleLogin } from '@utils/auth/googleLogin';

/**
 * [구글로 계속하기] — 구글 로그인으로 브라우저 이동 (US-36, D-082 · D-083에서 점선 해제)
 * 처음 보는 구글이면 BE가 가입 확인 화면 `/signup/google`로 보낸다.
 * 모양은 보조 버튼 (구글 브랜드 버튼은 US-39).
 * @param next 성공 뒤 갈 화면 (사이트 안 경로만, `googleStartPath`가 거름)
 */
export default function GoogleStartButton({ label = '구글로 계속하기', next }: { label?: string; next?: string | null }) {
  return (
    <ThemeButton type="button" variant="secondary" size="md" onClick={() => startGoogleLogin(next)} className="w-full justify-center">
      {label}
    </ThemeButton>
  );
}
