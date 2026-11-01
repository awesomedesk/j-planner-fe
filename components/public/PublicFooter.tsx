import type { PolicyKind, PolicyVersion } from '@utils/content/publicDocs';

import PolicyLinks from './PolicyLinks';

/** 공개 화면 공통 아래 줄 (US-39 AC2) — 소개 · 문의 · 이용약관 · 개인정보처리방침 */
export default function PublicFooter({ versions }: { versions?: Record<PolicyKind, readonly PolicyVersion[]> }) {
  return (
    <footer className="flex flex-wrap items-center justify-center gap-2 px-4 py-6 text-[13px] text-tp-muted">
      <a href="/about" className="rounded-lg px-3 py-2 underline-offset-2 hover:underline">
        소개
      </a>
      <a href="/contact" className="rounded-lg px-3 py-2 underline-offset-2 hover:underline">
        문의
      </a>
      <PolicyLinks versions={versions} />
    </footer>
  );
}
