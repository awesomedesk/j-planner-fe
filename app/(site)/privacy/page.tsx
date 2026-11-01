import PolicyDocument from "@components/public/PolicyDocument";
import PublicShell from "@components/public/PublicShell";
import { POLICY_VERSIONS } from "@utils/content/publicDocs";

/** 승인된 판이 없으면 검색에 나오지 않게 (골격을 운영 정책으로 게시하지 않음, 06 공개 화면) */
export const metadata = {
  title: "개인정보처리방침 · J's Planner",
  robots: POLICY_VERSIONS.privacy.length ? undefined : { index: false, follow: false },
};

/** 개인정보처리방침 (US-39, SITE-07) — 로그인 없이 열림. ?version=으로 이전 판 */
export default async function Privacy({ searchParams }: { searchParams: Promise<{ version?: string }> }) {
  const { version } = await searchParams;
  return (
    <PublicShell>
      <PolicyDocument kind="privacy" versions={POLICY_VERSIONS.privacy} version={version} />
    </PublicShell>
  );
}
