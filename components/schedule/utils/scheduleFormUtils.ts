import type {
  Category,
  HexColor,
  Id,
  LocalDate,
  Schedule,
  ScheduleCreateRequest,
  ScheduleUpdateRequest,
} from '@/types/api';
import { ITEM_COLOR_OPTIONS } from '@components/theme/itemColorOptions';

/**
 * 일정 입력 창(OV-01, MO-08)의 폼 값 ⇄ API 변환·검사
 *
 * 날짜·시간은 Date 객체로 바꾸지 않고 문자열 그대로 다룬다.
 * (API는 Asia/Seoul 기준 시간대 없는 문자열, 08-api-design 2-2)
 */

/** 일정 색 선택지 (화면기획서 OV-01 ③). null = 선택 안 함 → 테마 Theme2 (D-030) */
export const SCHEDULE_COLOR_OPTIONS = ITEM_COLOR_OPTIONS;

export const TITLE_MAX_LENGTH = 255;
export const URL_MAX_LENGTH = 2048;
/** 새 일정의 기본 길이 (분). 빠른 추가와 같게 1시간 (D-017) */
export const DEFAULT_DURATION_MINUTES = 60;

export interface ScheduleFormValues {
  title: string;
  allDay: boolean;
  startDate: LocalDate;
  /** `HH:mm`. 종일이면 쓰지 않음 */
  startTime: string;
  endDate: LocalDate;
  endTime: string;
  /** null = 미지정 (서버가 미지정으로 넣음) */
  categoryId: Id | null;
  color: HexColor | null;
  locationName: string;
  url: string;
  description: string;
}

export type ScheduleFormField = keyof ScheduleFormValues;
export type ScheduleFormErrors = Partial<Record<ScheduleFormField, string>>;

// ---------------------------------------------------------------- 날짜·시간 문자열

const pad = (n: number) => String(n).padStart(2, '0');

/** Date → `YYYY-MM-DD` (브라우저 시간 기준) */
export const toLocalDateString = (date: Date): LocalDate =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** `YYYY-MM-DDTHH:mm:ss` → { date, time(HH:mm) } */
export const splitDateTime = (value: string) => ({
  date: value.slice(0, 10),
  time: value.slice(11, 16),
});

/** { date, time(HH:mm) } → `YYYY-MM-DDTHH:mm:00` */
export const joinDateTime = (date: LocalDate, time: string) => `${date}T${time}:00`;

/** `YYYY-MM-DD` + `HH:mm`을 분 단위 숫자로 (비교·길이 계산용, 시간대와 무관) */
const toMinutes = (date: LocalDate, time: string) => {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) / 60000;
};

/** 분 단위 숫자 → { date, time } */
const fromMinutes = (minutes: number) => {
  const d = new Date(minutes * 60000);
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  };
};

// ---------------------------------------------------------------- 초기값

/**
 * '지금 이후 가장 가까운 정각' (D-037). 정각이면 그 시각. 14:17 → 15:00
 * @returns 시(0~24). 24면 다음 날 00:00
 */
export const nextTopOfHour = (now: Date) => {
  const isExactHour = now.getMinutes() === 0 && now.getSeconds() === 0 && now.getMilliseconds() === 0;
  return isExactHour ? now.getHours() : now.getHours() + 1;
};

/**
 * 새 일정의 초기값 (D-037)
 * - 시간표의 시간을 눌러 열면(startTime 있음): 누른 시각부터 1시간
 * - 추가 버튼으로 열면: 고른 날짜의 '지금 이후 가장 가까운 정각'부터 1시간. 밤 11시대면 다음 날 00:00~01:00
 * @param baseDate 고른 날짜 (기본 오늘)
 */
export const createEmptyFormValues = (
  baseDate: LocalDate,
  startTime?: string,
  now: Date = new Date()
): ScheduleFormValues => {
  const start = startTime
    ? { date: baseDate, time: startTime }
    : fromMinutes(toMinutes(baseDate, '00:00') + nextTopOfHour(now) * 60);
  const end = fromMinutes(toMinutes(start.date, start.time) + DEFAULT_DURATION_MINUTES);

  return {
    title: '',
    allDay: false,
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    categoryId: null,
    color: null,
    locationName: '',
    url: '',
    description: '',
  };
};

/** 처음 값과 달라졌는가 → 닫을 때 "작성을 취소할까요?" (D-037) */
export const isFormChanged = (initial: ScheduleFormValues, current: ScheduleFormValues) =>
  (Object.keys(initial) as ScheduleFormField[]).some((key) => initial[key] !== current[key]);

/** 수정할 일정 → 폼 값 */
export const scheduleToFormValues = (schedule: Schedule): ScheduleFormValues => {
  const start = splitDateTime(schedule.start);
  const end = splitDateTime(schedule.end);
  return {
    title: schedule.title,
    allDay: schedule.allDay,
    startDate: start.date,
    startTime: schedule.allDay ? '09:00' : start.time,
    endDate: end.date,
    endTime: schedule.allDay ? '10:00' : end.time,
    categoryId: schedule.categoryId,
    color: schedule.color,
    locationName: schedule.location?.name ?? '',
    url: schedule.url ?? '',
    description: schedule.description ?? '',
  };
};

/** 시작을 바꾸면 종료도 같은 길이만큼 따라 움직인다 */
export const shiftEndWithStart = (
  prev: ScheduleFormValues,
  nextStartDate: LocalDate,
  nextStartTime: string
): Pick<ScheduleFormValues, 'endDate' | 'endTime'> => {
  const prevStart = toMinutes(prev.startDate, prev.startTime);
  const prevEnd = toMinutes(prev.endDate, prev.endTime);
  const duration = Math.max(prevEnd - prevStart, 0);
  const next = fromMinutes(toMinutes(nextStartDate, nextStartTime) + duration);
  return { endDate: next.date, endTime: next.time };
};

// ---------------------------------------------------------------- 검사

const isHttpUrl = (value: string) => /^https?:\/\/\S+$/i.test(value);

/** 서버와 같은 규칙으로 먼저 검사한다 (08-api-design 4절). 서버 오류도 따로 받아서 보여준다 */
export const validateScheduleForm = (values: ScheduleFormValues): ScheduleFormErrors => {
  const errors: ScheduleFormErrors = {};
  const title = values.title.trim();

  if (!title) errors.title = '제목을 입력하세요';
  else if (title.length > TITLE_MAX_LENGTH) errors.title = `제목은 ${TITLE_MAX_LENGTH}자까지 쓸 수 있어요`;

  if (!values.startDate) errors.startDate = '시작 날짜를 고르세요';
  if (!values.endDate) errors.endDate = '종료 날짜를 고르세요';

  if (values.startDate && values.endDate) {
    if (values.allDay) {
      if (values.endDate < values.startDate) errors.endDate = '종료 날짜가 시작 날짜보다 빨라요';
    } else if (!values.startTime || !values.endTime) {
      if (!values.startTime) errors.startTime = '시작 시간을 고르세요';
      if (!values.endTime) errors.endTime = '종료 시간을 고르세요';
    } else if (toMinutes(values.endDate, values.endTime) <= toMinutes(values.startDate, values.startTime)) {
      errors.endTime = '종료가 시작보다 늦어야 해요';
    }
  }

  const url = values.url.trim();
  if (url) {
    if (!isHttpUrl(url)) errors.url = 'http:// 또는 https://로 시작하는 주소를 입력하세요';
    else if (url.length > URL_MAX_LENGTH) errors.url = `주소는 ${URL_MAX_LENGTH}자까지 쓸 수 있어요`;
  }

  return errors;
};

/** 서버 오류의 field 이름(API 필드) → 폼 칸 */
export const API_FIELD_TO_FORM_FIELD: Record<string, ScheduleFormField> = {
  title: 'title',
  allDay: 'allDay',
  start: 'startTime',
  end: 'endTime',
  categoryId: 'categoryId',
  color: 'color',
  description: 'description',
  location: 'locationName',
  'location.name': 'locationName',
  url: 'url',
};

// ---------------------------------------------------------------- 폼 값 → API 요청

const emptyToNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

/** 종일이면 서버 규칙과 같게 00:00:00 ~ 23:59:59로 보낸다 (서버도 맞춰 줌) */
const toStartEnd = (values: ScheduleFormValues) =>
  values.allDay
    ? { start: `${values.startDate}T00:00:00`, end: `${values.endDate}T23:59:59` }
    : {
        start: joinDateTime(values.startDate, values.startTime),
        end: joinDateTime(values.endDate, values.endTime),
      };

export const toCreateRequest = (values: ScheduleFormValues): ScheduleCreateRequest => {
  const locationName = emptyToNull(values.locationName);
  return {
    title: values.title.trim(),
    allDay: values.allDay,
    ...toStartEnd(values),
    ...(values.categoryId !== null ? { categoryId: values.categoryId } : {}),
    color: values.color,
    description: emptyToNull(values.description),
    location: locationName ? { name: locationName, latitude: null, longitude: null } : null,
    url: emptyToNull(values.url),
  };
};

/**
 * 수정 요청: 바뀐 필드만 담는다 (JSON Merge Patch, 08-api-design 2-4)
 * 바뀐 것이 없으면 빈 객체
 */
export const toUpdateRequest = (original: Schedule, values: ScheduleFormValues): ScheduleUpdateRequest => {
  const next = toCreateRequest(values);
  const patch: ScheduleUpdateRequest = {};

  if (next.title !== original.title) patch.title = next.title;
  if (next.allDay !== original.allDay) patch.allDay = next.allDay;
  if (next.start !== original.start) patch.start = next.start;
  if (next.end !== original.end) patch.end = next.end;
  if (values.categoryId !== null && values.categoryId !== original.categoryId) patch.categoryId = values.categoryId;
  if (next.color !== original.color) patch.color = next.color;
  if (next.description !== (original.description ?? null)) patch.description = next.description;
  if (next.url !== (original.url ?? null)) patch.url = next.url;

  // 장소 이름이 바뀔 때만 보낸다. 좌표는 입력 칸이 없으므로 이름이 바뀌면 지운다
  const originalLocationName = original.location?.name ?? null;
  const nextLocationName = next.location?.name ?? null;
  if (nextLocationName !== originalLocationName) patch.location = next.location;

  return patch;
};

