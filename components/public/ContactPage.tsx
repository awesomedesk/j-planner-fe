import { CONTACT_EMAIL } from '@utils/content/publicDocs';

import PublicShell from './PublicShell';

/**
 * 문의 `/contact` (US-39, 06 SITE-02) — 승인된 운영 메일만 보여 준다. 없으면 안내만 (#340 ②).
 * 문의 게시판·파일 올리기 없음. 비밀번호·인증 링크를 보내 달라고 하지 않는다.
 * @param email 테스트용 — 기본은 publicDocs의 승인된 메일
 */
export default function ContactPage({ email = CONTACT_EMAIL }: { email?: string | null }) {
  return (
    <PublicShell>
      <article className="flex max-w-[640px] flex-col gap-4 rounded-2xl border border-tp-line bg-white p-5 text-ink fold:p-8">
        <h1 className="text-xl font-bold">문의</h1>
        {email ? (
          <p className="text-sm leading-relaxed">
            서비스·계정·보안 문의는{' '}
            <a href={`mailto:${email}`} className="break-all font-semibold underline underline-offset-2">
              {email}
            </a>
            로 보내 주세요.
          </p>
        ) : (
          <p className="text-sm leading-relaxed">문의 메일은 정해지면 이곳에 알려 드려요.</p>
        )}
        <p className="text-[13px] leading-relaxed text-tp-muted">
          로그인이 안 되면 로그인 화면의 &lsquo;비밀번호 찾기&rsquo;를 먼저 써 보세요. 계정을 확인하려고 비밀번호나 인증 링크는 보내지 마세요. 저희도 묻지
          않아요.
        </p>
      </article>
    </PublicShell>
  );
}
