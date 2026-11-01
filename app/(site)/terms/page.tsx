import PolicyDocument from "@components/public/PolicyDocument";
import PublicShell from "@components/public/PublicShell";
import { POLICY_VERSIONS } from "@utils/content/publicDocs";

/** 승인된 판이 없으면 검색에 나오지 않게 (골격을 운영 정책으로 게시하지 않음, 06 공개 화면) */
export const metadata = {
  title: "이용약관 · J's Planner",
  robots: POLICY_VERSIONS.terms.length ? undefined : { index: false, follow: false },
};

/** 이용약관 (US-39, SITE-06) — 로그인 없이 열림. ?version=으로 이전 판 */
export default async function Terms({ searchParams }: { searchParams: Promise<{ version?: string }> }) {
  const { version } = await searchParams;
  return (
    <PublicShell>
      <PolicyDocument kind="terms" versions={POLICY_VERSIONS.terms} version={version} />
    </PublicShell>
  );
}
