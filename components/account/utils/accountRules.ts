/** 내 계정 화면 규칙 (US-37, 06 SITE-09). 문구는 BE 검사 문구와 같게 */

/** 이름 최대 글자 수 (BE NAME_MAX) */
export const NAME_MAX = 50;

/** 이름: 앞뒤 공백을 지운 뒤 1~50자(코드 포인트) */
export function checkName(name: string): string | undefined {
  const value = name.trim();
  if (!value) return '이름을 입력해 주세요';
  if (Array.from(value).length > NAME_MAX) return `이름은 1~${NAME_MAX}자로 입력해 주세요`;
  return undefined;
}

const TIME_FORMAT = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
});
const DATE_FORMAT = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' });

/** 서버 시각(LocalDateTime, 한국 시간 08 1절) → Date */
const fromServerTime = (value: string) => new Date(`${value}+09:00`);

/** 기기 시각: 사용자 현지 시각 + 시간대 (예: '2026. 10. 31. 오후 3:20 GMT+9') */
export const formatDeviceTime = (value: string) => TIME_FORMAT.format(fromServerTime(value));

/** 연결일 (날짜만) */
export const formatLinkedDate = (value: string) => DATE_FORMAT.format(fromServerTime(value));
