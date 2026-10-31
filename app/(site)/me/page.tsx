import MyAccountPage from "@components/account/MyAccountPage";
import RequireLogin from "@components/auth/RequireLogin";

export const metadata = { title: "내 계정 · J's Planner" };

/** 내 계정 (US-37, D-091 · SITE-09). 로그인해야 보인다 — 아니면 /login?next=/me */
export default function MyAccount() {
  return (
    <RequireLogin>
      <MyAccountPage />
    </RequireLogin>
  );
}
