/**
 * 공개 문서·문의 (US-39, D-095 · 06 공개 화면 · 19 문서)
 * 약관·처리방침은 **승인된 판만** 여기에 넣는다 — 골격·TODO·가짜 조항을 넣지 않는다.
 * 승인된 판이 없으면 화면은 '아직 공개 전이에요', 아래 링크는 점선 '준비 중이에요'.
 * 판을 넣으면 /terms·/privacy와 모든 화면 아래 링크가 함께 열린다 (화면마다 복사본을 두지 않음).
 */

export interface PolicySection {
  /** 목차 연결용 (영문 소문자·하이픈) */
  id: string;
  heading: string;
  /** 문단들 */
  body: string[];
}

export interface PolicyVersion {
  /** 판 번호 (주소 ?version=) — 1부터 */
  version: number;
  /** 시행일 YYYY-MM-DD — 승인한 실제 날짜 (배포 날짜로 자동으로 덮지 않음) */
  effectiveDate: string;
  sections: PolicySection[];
}

export type PolicyKind = 'terms' | 'privacy';

export const POLICY_TITLE: Record<PolicyKind, string> = {
  terms: '이용약관',
  privacy: '개인정보처리방침',
};

export const POLICY_PATH: Record<PolicyKind, string> = {
  terms: '/terms',
  privacy: '/privacy',
};

/** 승인된 판 (오래된 판 → 최신 판). 아직 없음 */
export const POLICY_VERSIONS: Record<PolicyKind, PolicyVersion[]> = {
  terms: [],
  privacy: [],
};

/** 승인된 운영 문의 메일. 아직 없음 (null) */
export const CONTACT_EMAIL: string | null = null;

/** 최신 판 (없으면 null) */
export function latestPolicy(versions: readonly PolicyVersion[]): PolicyVersion | null {
  return versions.length ? versions[versions.length - 1] : null;
}

/** 주소의 ?version= 판, 없거나 모르는 번호면 최신 판 */
export function pickPolicy(versions: readonly PolicyVersion[], raw: string | null | undefined): PolicyVersion | null {
  const wanted = raw ? Number(raw) : NaN;
  return versions.find((v) => v.version === wanted) ?? latestPolicy(versions);
}

/** 시행일 표시 (예: 2026년 12월 1일) */
export function formatEffectiveDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
}
