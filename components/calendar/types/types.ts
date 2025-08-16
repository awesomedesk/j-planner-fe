// 기존 달력 타입 확장
export type ScheduleColor = 'blue' | 'purple' | 'pink' | 'lightpurple';

// API 응답용 일정 타입
export interface ScheduleAPI {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO 8601 format
  endDate?: string;
  color: ScheduleColor;
  isAllDay: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// 일정 생성/수정용 타입
export interface CreateScheduleRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  color: ScheduleColor;
  isAllDay: boolean;
}

export interface UpdateScheduleRequest extends Partial<CreateScheduleRequest> {}

// API 응답 타입들
export interface MonthlySchedulesResponse {
  year: number;
  month: number;
  schedules: ScheduleAPI[];
  totalCount: number;
}

export interface DailySchedulesResponse {
  date: string;
  schedules: ScheduleAPI[];
  totalCount: number;
}

export interface ScheduleSearchResponse {
  query: string;
  schedules: ScheduleAPI[];
  totalCount: number;
  page: number;
  limit: number;
}

// 사용자 설정 타입
export interface CalendarSettings {
  defaultView: 'month' | 'week' | 'day';
  weekStartsOn: 0 | 1; // 0: Sunday, 1: Monday
  defaultColor: ScheduleColor;
  timezone: string;
  notifications: boolean;
}

// 페이지네이션 파라미터
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 검색 파라미터
export interface SearchParams extends PaginationParams {
  query: string;
  dateFrom?: string;
  dateTo?: string;
  color?: ScheduleColor;
}

// 월별 조회 파라미터
export interface MonthlyParams {
  year: number;
  month: number; // 1-12
}

// 일별 조회 파라미터
export interface DailyParams {
  date: string; // YYYY-MM-DD
}
