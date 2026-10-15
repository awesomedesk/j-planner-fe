import type { Me } from '@/types/api';

/** 같은 계정인가 — 이메일을 앞뒤 공백·대소문자 무시하고 비교 (US-34, D-072 다른 계정이면 이어서 저장 안 함) */
export function isSameAccount(a: Pick<Me, 'email'>, b: Pick<Me, 'email'>): boolean {
  return a.email.trim().toLowerCase() === b.email.trim().toLowerCase();
}
