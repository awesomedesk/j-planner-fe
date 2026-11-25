import type { Dday, DdayCountType, DdayCreateRequest, DdayDisplay, DdayUpdateRequest, LocalDate } from '@/types/api';

/**
 * D-Day 입력 창 규칙 (US-22, 06 D-Day 입력 창 · D-012 · D-020 · 08 6절)
 * 화면 상태는 글자(입력 칸 그대로), 서버로 보낼 때 숫자로 바꾼다.
 */

export const DDAY_TITLE_MAX_LENGTH = 255;
export const DEFAULT_INTERVAL_DAYS = 100;
export const DEFAULT_LAST_DAYS = 7;

/** 켜기/끄기 + 일 수(입력 칸 글자). 끄더라도 일 수는 남겨 둔다 (06: 끄면 값은 보존하되 보내지 않음) */
export interface DdayDayOptionValue {
  enabled: boolean;
  days: string;
}

export interface DdayFormValues {
  title: string;
  targetDate: LocalDate;
  countType: DdayCountType;
  /** N일 단위 (두 기준 공통) */
  interval: DdayDayOptionValue;
  /** 마지막 N일은 매일 (남은 날만) */
  lastDays: DdayDayOptionValue;
  /** 매일 (남은 날만) */
  daily: boolean;
  /** 매년 (지난 날만) */
  yearly: boolean;
}

export type DdayFormField = 'title' | 'targetDate' | 'intervalDays' | 'lastDaysDays';
export type DdayFormErrors = Partial<Record<DdayFormField, string>>;

/** 오류 칸 순서 = 화면 순서 (첫 오류 칸에 초점) */
export const DDAY_FORM_FIELD_ORDER: readonly DdayFormField[] = ['title', 'targetDate', 'intervalDays', 'lastDaysDays'];

/** 서버 VALIDATION_FAILED 필드 → 입력 칸 */
export const DDAY_API_FIELD_TO_FORM_FIELD: Record<string, DdayFormField> = {
  title: 'title',
  targetDate: 'targetDate',
  'display.interval': 'intervalDays',
  'display.interval.days': 'intervalDays',
  'display.lastDays': 'lastDaysDays',
  'display.lastDays.days': 'lastDaysDays',
};

export const DDAY_COUNT_TYPES: readonly DdayCountType[] = ['COUNTDOWN', 'COUNTUP'];

/** 세는 방법 이름과 회색 예시 한 줄 (06) */
export const DDAY_COUNT_TYPE_TEXT: Record<DdayCountType, { label: string; example: string }> = {
  COUNTDOWN: { label: '남은 날 세기 (당일 D-Day)', example: 'D-3 → D-Day → D+2' },
  COUNTUP: { label: '지난 날 세기 (당일 1일)', example: '1일 → 100일 → 1주년' },
};

/** 기준별 달력 표시 기본값 (D-020): 남은 날 = 목표 날짜만, 지난 날 = 100일 단위 + 매년 */
const defaultDisplayValues = (countType: DdayCountType): Pick<DdayFormValues, 'interval' | 'lastDays' | 'daily' | 'yearly'> => ({
  interval: { enabled: countType === 'COUNTUP', days: String(DEFAULT_INTERVAL_DAYS) },
  lastDays: { enabled: false, days: String(DEFAULT_LAST_DAYS) },
  daily: false,
  yearly: countType === 'COUNTUP',
});

/** 새 D-Day: 기준 날짜(사이드바 기준 날짜), 남은 날 세기(D-012) */
export const createEmptyDdayValues = (baseDate: LocalDate): DdayFormValues => ({
  title: '',
  targetDate: baseDate,
  countType: 'COUNTDOWN',
  ...defaultDisplayValues('COUNTDOWN'),
});

const optionValue = (option: DdayDisplay['interval'], fallback: number): DdayDayOptionValue => ({
  enabled: option?.enabled ?? false,
  days: String(option?.days ?? fallback),
});

export const ddayToFormValues = (dday: Dday): DdayFormValues => ({
  title: dday.title,
  targetDate: dday.targetDate,
  countType: dday.countType,
  interval: optionValue(dday.display.interval, DEFAULT_INTERVAL_DAYS),
  lastDays: optionValue(dday.display.lastDays, DEFAULT_LAST_DAYS),
  daily: dday.display.daily ?? false,
  yearly: dday.display.yearly ?? false,
});

/**
 * 세는 방법 바꾸기 (06)
 * - 새로 만드는 중: 그 기준의 기본값으로 다시 채운다 (D-020)
 * - 수정 중: 두 기준 공통인 N일 단위는 그대로, 새 기준에만 있는 옵션은 꺼진 채 (일 수는 남김)
 */
export const changeDdayCountType = (values: DdayFormValues, countType: DdayCountType, mode: 'create' | 'edit'): DdayFormValues => {
  if (values.countType === countType) return values;
  if (mode === 'create') return { ...values, countType, ...defaultDisplayValues(countType) };
  return {
    ...values,
    countType,
    lastDays: { ...values.lastDays, enabled: false },
    daily: false,
    yearly: false,
  };
};

const DAYS_ERROR = '1 이상의 숫자를 입력해 주세요.';
const isPositiveInteger = (text: string) => /^\d+$/.test(text.trim()) && Number(text) >= 1;

export const validateDdayForm = (values: DdayFormValues): DdayFormErrors => {
  const errors: DdayFormErrors = {};
  const title = values.title.trim();
  if (!title) errors.title = '제목을 입력해 주세요.';
  else if (title.length > DDAY_TITLE_MAX_LENGTH) errors.title = `제목은 ${DDAY_TITLE_MAX_LENGTH}자까지 쓸 수 있어요.`;
  if (!values.targetDate) errors.targetDate = '날짜를 골라 주세요.';
  if (values.interval.enabled && !isPositiveInteger(values.interval.days)) errors.intervalDays = DAYS_ERROR;
  if (values.countType === 'COUNTDOWN' && values.lastDays.enabled && !isPositiveInteger(values.lastDays.days)) errors.lastDaysDays = DAYS_ERROR;
  return errors;
};

const toOption = (option: DdayDayOptionValue) => (option.enabled ? { enabled: true, days: Number(option.days) } : { enabled: false });

/** 그 기준의 옵션만 (남은 날: N일 단위·마지막 N일·매일 / 지난 날: N일 단위·매년) */
const toDisplay = (values: DdayFormValues): DdayDisplay =>
  values.countType === 'COUNTDOWN'
    ? { interval: toOption(values.interval), lastDays: toOption(values.lastDays), daily: values.daily }
    : { interval: toOption(values.interval), yearly: values.yearly };

export const toDdayCreateRequest = (values: DdayFormValues): DdayCreateRequest => ({
  title: values.title.trim(),
  targetDate: values.targetDate,
  countType: values.countType,
  display: toDisplay(values),
});

/**
 * 수정 요청: 바뀐 것만 (Merge Patch)
 * 옵션이나 기준이 바뀌면 그 기준의 display 전체. 기준이 바뀌면 새 기준에 없는 옵션을 꺼서 함께 보낸다 (08 6절, 안 끄면 400)
 */
export const toDdayUpdateRequest = (dday: Dday, values: DdayFormValues): DdayUpdateRequest => {
  const before = ddayToFormValues(dday);
  const patch: DdayUpdateRequest = {};
  const title = values.title.trim();
  if (title !== before.title) patch.title = title;
  if (values.targetDate !== before.targetDate) patch.targetDate = values.targetDate;
  const countTypeChanged = values.countType !== before.countType;
  if (countTypeChanged) patch.countType = values.countType;
  const display = toDisplay(values);
  if (countTypeChanged || JSON.stringify(display) !== JSON.stringify(toDisplay(before))) {
    patch.display = countTypeChanged
      ? values.countType === 'COUNTDOWN'
        ? { ...display, yearly: false }
        : { ...display, lastDays: { enabled: false }, daily: false }
      : display;
  }
  return patch;
};

export const isDdayFormChanged = (initial: DdayFormValues, values: DdayFormValues) => JSON.stringify(initial) !== JSON.stringify(values);
