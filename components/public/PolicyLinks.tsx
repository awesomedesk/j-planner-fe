"use client";

import { useAppDispatch } from '@/app/hooks';
import { LaterButton, NOT_READY_MESSAGE } from '@components/auth/common/AuthFrame';
import { showNotice } from '@store/slices/noticeSlice';
import { POLICY_PATH, POLICY_TITLE, POLICY_VERSIONS, type PolicyKind, type PolicyVersion } from '@utils/content/publicDocs';

const KINDS: PolicyKind[] = ['terms', 'privacy'];

/**
 * 이용약관·개인정보처리방침 링크 (US-39 AC2, 06 공개 화면) — 모든 화면 아래·로그인·가입·계정 메뉴가 같이 쓴다.
 * 승인된 판이 있으면 /terms·/privacy 링크, 없으면 점선 자리 '준비 중이에요' (#340 ①).
 * @param versions 테스트용 — 기본은 publicDocs의 승인된 판
 */
export default function PolicyLinks({ versions = POLICY_VERSIONS }: { versions?: Record<PolicyKind, readonly PolicyVersion[]> }) {
  const dispatch = useAppDispatch();
  return (
    <>
      {KINDS.map((kind) =>
        versions[kind].length ? (
          <a key={kind} href={POLICY_PATH[kind]} className="rounded-lg px-3 py-2 text-[13px] text-tp-muted underline-offset-2 hover:underline">
            {POLICY_TITLE[kind]}
          </a>
        ) : (
          <LaterButton key={kind} label={POLICY_TITLE[kind]} onClick={() => dispatch(showNotice(NOT_READY_MESSAGE, 'info'))} />
        )
      )}
    </>
  );
}
