import type { ScheduleAPI } from '../types/types';
import type { Schedule } from '../types';

/**
 * API 데이터를 Schedule 타입으로 변환
 * @param apiSchedule - API에서 받은 일정 데이터
 * @returns Schedule 타입으로 변환된 데이터
 */
export const convertApiScheduleToSchedule = (apiSchedule: ScheduleAPI): Schedule => ({
  id: String(apiSchedule.id),
  title: apiSchedule.title,
  startDateTime: new Date(apiSchedule.startDatetime),
  endDateTime: new Date(apiSchedule.endDatetime || apiSchedule.startDatetime),
  allDay: apiSchedule.allDay,
  description: apiSchedule.description,
  color: apiSchedule.color,
});

/**
 * 날짜를 ISO 8601 형식으로 변환 (YYYY-MM-DDTHH:mm:ss)
 * API 요청 파라미터로 사용
 * @param date - 변환할 Date 객체
 * @returns ISO 8601 형식 문자열
 */
export const formatToISODateTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};
