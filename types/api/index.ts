/**
 * J-planner API 타입 (화면 코드는 이 파일에서 가져다 쓴다)
 *
 * - `schema.d.ts`는 `npm run api:types`로 `j-planner-product/08-openapi.yaml`에서 만든 파일이다. 손으로 고치지 않는다.
 * - 이 파일은 생성된 타입을 화면에서 쓰기 좋게 다시 묶는다.
 *   08-openapi.yaml의 일부 스키마는 필수 필드를 `allOf` + `required`만 있는 객체로 적어서
 *   생성 결과가 `Record<string, never>`(쓸 수 없는 타입)나 모두 선택(?) 필드가 된다.
 *   그래서 08-api-design.md(기준 문서) 규칙에 맞게 여기서 필수 여부를 다시 정한다.
 *   → BE 창에 명세 수정 요청함. 명세가 고쳐지면 아래 보정을 걷어낸다.
 */
import type { components } from './schema';

type Schemas = components['schemas'];

/** 필드를 모두 필수로 (응답은 값이 없어도 null로 항상 온다, 08-api-design 2-2) */
type Complete<T> = { [K in keyof T]-?: Exclude<T[K], undefined> };

// ---------------------------------------------------------------- 공통
export type Id = Schemas['Id'];
/** `#RRGGBB` */
export type HexColor = Schemas['Color'];
/** `YYYY-MM-DD` */
export type LocalDate = string;
/** `YYYY-MM-DDTHH:mm:ss` (Asia/Seoul, 시간대 표시 없음) */
export type LocalDateTime = Schemas['LocalDateTime'];
/** `HH:mm` */
export type LocalTime = Schemas['LocalTime'];
/** 순서 이동 `PUT /…/{id}/position` */
export type PositionRequest = Schemas['PositionRequest'];

// ---------------------------------------------------------------- 카테고리
export type Category = Schemas['Category'];
export type CategoryCreateRequest = Schemas['CategoryCreateRequest'];
export type CategoryUpdateRequest = Schemas['CategoryUpdateRequest'];

// ---------------------------------------------------------------- 일정
export type ScheduleLocation = Schemas['Location'];
type ScheduleFields = Schemas['ScheduleFields'];

export type Schedule = Complete<ScheduleFields> & { id: Id };
/** 추가: title·allDay·start·end 필수 (08-api-design 4절) */
export type ScheduleCreateRequest = Complete<Pick<ScheduleFields, 'title' | 'allDay' | 'start' | 'end'>> &
  Omit<ScheduleFields, 'title' | 'allDay' | 'start' | 'end'>;
/** 수정: JSON Merge Patch, 보낸 필드만 바뀜 */
export type ScheduleUpdateRequest = Schemas['ScheduleUpdateRequest'];

// ---------------------------------------------------------------- Todo
export type TodoType = Schemas['TodoType'];
export type TodoTime = Schemas['TodoTime'];
type TodoFields = Schemas['TodoFields'];

export type Todo = Complete<TodoFields> & Omit<Schemas['Todo'], keyof TodoFields>;
export type TodoCreateRequest = Complete<Pick<TodoFields, 'title' | 'type' | 'startDate' | 'endDate'>> &
  Omit<TodoFields, 'title' | 'type' | 'startDate' | 'endDate'>;
export type TodoUpdateRequest = Schemas['TodoUpdateRequest'];

// ---------------------------------------------------------------- D-Day
export type DdayCountType = Schemas['DdayCountType'];
export type DdayDisplay = Schemas['DdayDisplay'];
type DdayFields = Schemas['DdayFields'];

export type Dday = Complete<DdayFields> & Omit<Schemas['Dday'], keyof DdayFields>;
export type DdayCreateRequest = Complete<Pick<DdayFields, 'title' | 'targetDate'>> &
  Omit<DdayFields, 'title' | 'targetDate'>;
export type DdayUpdateRequest = Schemas['DdayUpdateRequest'];
export type DdayMark = Schemas['DdayMark'];

// ---------------------------------------------------------------- 일기
export type Diary = Schemas['Diary'];
export type DiaryPutRequest = Schemas['DiaryPutRequest'];

// ---------------------------------------------------------------- 메모
export type Memo = Schemas['Memo'];
export type MemoRequest = Schemas['MemoRequest'];

// ---------------------------------------------------------------- 설정
type SettingsFields = Schemas['SettingsFields'];
export type Settings = Complete<SettingsFields>;
export type SettingsUpdateRequest = Schemas['SettingsUpdateRequest'];
export type SidebarItem = Schemas['SidebarItem'];
