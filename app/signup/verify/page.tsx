import VerifyEmailPage from "@components/auth/signup/VerifyEmailPage";

/**
 * 메일 링크 화면 — 주소에 토큰이 있다 (US-33, D-079 · SITE-05d)
 * (site) 묶음 밖이라 바깥 리소스(글꼴)를 부르지 않는다. Referer로 토큰이 새지 않게
 * 응답 헤더(next.config.mjs)와 <meta name="referrer"> 둘 다 no-referrer.
 */
export const metadata = { title: "이메일 인증 · J's Planner", referrer: "no-referrer" };

export default function VerifyEmail() {
  return <VerifyEmailPage />;
}
