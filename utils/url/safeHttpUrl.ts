/**
 * 사용자가 넣은 링크(일정 url)를 그리기 직전에 한 번 더 확인한다 (#417 US-44 A05).
 * 입력 검사(SCH-13)·BE 검사·React 19의 `javascript:` 차단이 있어도, `data:`·`vbscript:` 같은 주소는
 * 그리는 쪽에서 막는다 — http(s) 절대 주소만 돌려주고, 아니면 null(링크를 그리지 않음).
 */
export const safeHttpUrl = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const { protocol } = new URL(trimmed);
    return protocol === 'http:' || protocol === 'https:' ? trimmed : null;
  } catch {
    return null;
  }
};
