/** 내 계정을 다녀온 뒤 초점을 둘 '설정 및 계정' 진입 버튼 (D-117) — 테스트 컴파일용 자리, 구현은 Feat에서 */
export type AccountEntry = 'gear' | 'menu';

export const rememberAccountReturn = (_entry: AccountEntry): void => undefined;
export const takeAccountReturn = (): AccountEntry | null => null;
