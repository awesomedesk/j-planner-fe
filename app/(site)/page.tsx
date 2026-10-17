import AppDataLoader from "@components/app/AppDataLoader";
import RequireLogin from "@components/auth/RequireLogin";
import AppShell from "@components/layouts/app/AppShell";

/** 첫 화면 = 월간 (D-009). 로그인해야 보인다 (US-34) */
export default function Home() {
  return (
    <RequireLogin>
      <AppShell />
      <AppDataLoader />
    </RequireLogin>
  );
}
