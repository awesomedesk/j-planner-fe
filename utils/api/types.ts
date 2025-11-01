/**
 * AwesomeDesk API 공통 응답 형식
 *
 * 모든 백엔드 API 응답은 이 형식을 따릅니다.
 *
 * @template T - 실제 데이터의 타입 (예: ScheduleAPI[], UserAPI, etc.)
 *
 * @example
 * ```typescript
 * // 일정 목록 조회 응답
 * type ScheduleListResponse = AwesomeResponse<ScheduleAPI[]>;
 *
 * // 단일 사용자 조회 응답
 * type UserResponse = AwesomeResponse<UserAPI>;
 * ```
 */
export interface AwesomeResponse<T> {
  /** 실제 응답 데이터 */
  data: T;

  /** 데이터 개수 (배열인 경우) */
  dataCount: number;

  /** 사용자에게 표시할 메시지 */
  message: string | null;

  /** 디버깅용 로그 메시지 */
  logMessage: string | null;
}
