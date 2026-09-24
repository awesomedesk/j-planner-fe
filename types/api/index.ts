/**
 * J-planner API 타입 (화면 코드는 이 파일에서 가져다 쓴다)
 *
 * - `schema.d.ts`는 `npm run api:types`로 `j-planner-product/08-openapi.yaml`에서 만든 파일이다. 손으로 고치지 않는다.
 * - 이 파일은 생성된 타입에 화면에서 쓰기 좋은 이름을 붙인다.
 */
import type { components } from './schema';

type Schemas = components['schemas'];

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
/** color가 null이면 색을 고르지 않은 것 → 첫 색(#2F62A8)으로 표시 (D-037) */
export type Category = Schemas['Category'];
export type CategoryCreateRequest = Schemas['CategoryCreateRequest'];
export type CategoryUpdateRequest = Schemas['CategoryUpdateRequest'];

// ---------------------------------------------------------------- 일정
export type ScheduleLocation = Schemas['Location'];
export type Schedule = Schemas['Schedule'];
export type ScheduleCreateRequest = Schemas['ScheduleCreateRequest'];
/** 수정: JSON Merge Patch, 보낸 필드만 바뀜 */
export type ScheduleUpdateRequest = Schemas['ScheduleUpdateRequest'];

// ---------------------------------------------------------------- Todo
export type TodoType = Schemas['TodoType'];
export type TodoTime = Schemas['TodoTime'];
export type Todo = Schemas['Todo'];
export type TodoCreateRequest = Schemas['TodoCreateRequest'];
export type TodoUpdateRequest = Schemas['TodoUpdateRequest'];

// ---------------------------------------------------------------- D-Day
export type DdayCountType = Schemas['DdayCountType'];
export type DdayDisplay = Schemas['DdayDisplay'];
export type Dday = Schemas['Dday'];
export type DdayCreateRequest = Schemas['DdayCreateRequest'];
export type DdayUpdateRequest = Schemas['DdayUpdateRequest'];
export type DdayMark = Schemas['DdayMark'];

// ---------------------------------------------------------------- 일기
export type Diary = Schemas['Diary'];
export type DiaryPutRequest = Schemas['DiaryPutRequest'];

// ---------------------------------------------------------------- 메모
export type Memo = Schemas['Memo'];
export type MemoRequest = Schemas['MemoRequest'];

// ---------------------------------------------------------------- 설정
export type Settings = Schemas['Settings'];
export type SettingsUpdateRequest = Schemas['SettingsUpdateRequest'];
export type SidebarItem = Schemas['SidebarItem'];
