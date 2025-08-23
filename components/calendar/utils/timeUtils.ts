/**
 * 시간 관련 유틸리티 함수들
 */

/**
 * Date 객체를 한국어 12시간 형식으로 변환
 * @param date - 변환할 Date 객체
 * @returns 포맷된 시간 문자열 (예: "오후 2시", "오전 9시 30분")
 */
export function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  // 12시간 형식으로 변환
  const period = hours >= 12 ? '오후' : '오전';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  // 00분인 경우 분 생략
  if (minutes === 0) {
    return `${period} ${displayHours}시`;
  }
  
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${period} ${displayHours}시 ${displayMinutes}분`;
}

/**
 * 시간 범위를 포맷팅 (시작시간 - 종료시간)
 * @param startDate - 시작 시간
 * @param endDate - 종료 시간
 * @returns 포맷된 시간 범위 문자열
 */
export function formatTimeRange(startDate: Date, endDate: Date): string {
  return `${formatTime(startDate)} - ${formatTime(endDate)}`;
}