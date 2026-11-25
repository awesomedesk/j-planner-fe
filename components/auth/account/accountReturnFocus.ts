/**
 * 내 계정(/me)을 다녀온 뒤 초점을 둘 '설정 및 계정' 진입 버튼 (D-117)
 * - [내 계정]을 누를 때 어느 버튼(⚙ / 모바일 ≡)으로 들어왔는지 기억하고, 달력이 다시 그려지면 그 버튼에 한 번 초점을 둔다.
 * - 같은 앱 세션(앱 안 이동)에서만 쓴다. 새로 고침하면 사라진다 — 주소·영구 저장소에 남기지 않는다 (D-117).
 * - 진입 버튼은 `data-account-entry="gear" | "menu"`로 표시한다.
 */
export type AccountEntry = 'gear' | 'menu';

let pending: AccountEntry | null = null;

export const rememberAccountReturn = (entry: AccountEntry): void => {
  pending = entry;
};

export const peekAccountReturn = (): AccountEntry | null => pending;

/** 꺼내면서 지운다 (한 번만 쓰기) */
export const takeAccountReturn = (): AccountEntry | null => {
  const entry = pending;
  pending = null;
  return entry;
};

/** 그 진입 버튼에 초점. 보이는 것을 먼저 고르고(같은 표시가 PC·모바일 머리에 다 있을 수 있음), 없으면 false */
export const focusAccountEntry = (entry: AccountEntry): boolean => {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(`[data-account-entry="${entry}"]`));
  const target = candidates.find((el) => el.getClientRects().length > 0) ?? candidates[0];
  if (!target) return false;
  target.focus();
  return true;
};
