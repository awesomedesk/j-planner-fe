import AppDataLoader from "@components/app/AppDataLoader";
import RequireLogin from "@components/auth/RequireLogin";
import AppShell from "@components/layouts/app/AppShell";
import HomeGate from "@components/public/HomeGate";

/** 첫 화면: 로그인 안 했으면 메인(US-39 SITE-01), 했으면 월간 달력 (D-009, US-34) */
export default function Home() {
  return (
    <HomeGate>
      <RequireLogin>
        <AppShell />
        <AppDataLoader />
      </RequireLogin>
    </HomeGate>
  );
}
