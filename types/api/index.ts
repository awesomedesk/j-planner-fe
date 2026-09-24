/**
 * J-planner API 타입 (화면 코드는 이 파일에서 가져다 쓴다)
 *
 * - `schema.d.ts`는 `npm run api:types`로 `j-planner-product/08-openapi.yaml`에서 만든 파일이다. 손으로 고치지 않는다.
 * - 이 파일은 생성된 타입에 화면에서 쓰기 좋은 이름을 붙인다.
 * - 명세와 다르게 보정한 곳은 아래 "보정" 표시가 있다. 명세가 바뀌면 보정을 걷어낸다.
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
/**
 * 보정 (D-037): 새 카테고리는 색을 고르지 않으면 null로 저장한다.
 * 08-openapi.yaml은 아직 color가 필수(#RRGGBB)라서 null을 받을 수 있게 넓혀 둔다. → BE 창에 명세 수정 요청함
 */
export type Category = Omit<Schemas['Category'], 'color'> & { color: HexColor | null };
export type CategoryCreateRequest = Omit<Schemas['CategoryCreateRequest'], 'color'> & { color: HexColor | null };
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
