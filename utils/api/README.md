# API Utils

BE REST API를 부르는 HTTP 클라이언트와 공통 타입.

- API 규칙: `j-planner-product/08-api-design.md`, 명세: `08-openapi.yaml`
- **순수 REST (D-031)**: 성공 응답은 감싸기 없이 리소스 JSON 그대로, 오류는 Problem Details(RFC 9457)

## 구조

```
utils/api/
├── client.ts    # apiClient (fetch 래퍼), ApiError
├── types.ts     # ProblemDetail, 오류 코드, 쿼리 파라미터 타입
└── index.ts     # public exports
```

## 사용법

```typescript
import { apiClient, isApiError } from '@utils/api';

// 주소는 /api/v1 뒤의 경로만 쓴다 (API_PREFIX가 자동으로 붙음)
const todos = await apiClient.get<Todo[]>('/todos', { date: '2026-09-24' });

// 배열 파라미터는 반복된다 → ?from=…&to=…&categoryId=1&categoryId=3
const schedules = await apiClient.get<Schedule[]>('/schedules', {
  from: '2026-09-01',
  to: '2026-10-05',
  categoryId: [1, 3],
});

const created = await apiClient.post<Todo>('/todos', { title: '기획서 초안', type: 'DAY', startDate: '2026-09-24', endDate: '2026-09-24' });
const done = await apiClient.patch<Todo>(`/todos/${created.id}`, { completed: true }); // 보낸 필드만 바뀜
await apiClient.put<Todo>(`/todos/${created.id}/position`, { afterId: 12 });           // 순서 이동
await apiClient.delete(`/todos/${created.id}`);                                        // 204 → undefined
```

| 메서드 | 반환 |
|---|---|
| `get<T>(path, params?)` | `Promise<T>` |
| `post<T>(path, body?)` | `Promise<T>` (201 + 만든 리소스) |
| `put<T>(path, body?)` | `Promise<T>` |
| `patch<T>(path, body)` | `Promise<T>` (수정된 리소스 전체) |
| `delete(path)` | `Promise<void>` (204) |

## 오류 처리

실패하면 `ApiError`를 던진다.

```typescript
try {
  await apiClient.post<Category>('/categories', { name: '공부', color: '#2F62A8' });
} catch (e) {
  if (isApiError(e)) {
    if (e.code === 'CATEGORY_NAME_DUPLICATED') {
      showFieldError('name', e.message);          // e.message = 서버 detail (한국어)
    } else if (e.code === 'VALIDATION_FAILED') {
      e.errors.forEach(({ field, message }) => showFieldError(field, message));
    } else {
      toast(e.message);
    }
  }
}
```

| 필드 | 내용 |
|---|---|
| `status` | HTTP 상태 코드. 응답을 못 받으면 0 |
| `code` | 서버 오류 코드(`VALIDATION_FAILED`, `NOT_FOUND` 등) 또는 FE 코드(`TIMEOUT`, `NETWORK_ERROR`, `UNKNOWN_ERROR`) |
| `message` | 화면에 보여줄 한국어 |
| `errors` | 입력값 오류일 때 `[{ field, message }]` |
| `problem` | 서버가 보낸 Problem Details 원본 |

## 환경변수

`.env.local`, `.env.test`, `.env.production`에서 서버 주소만 설정한다 (`/api/v1`은 붙이지 않는다).

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

## 리소스별 API 함수 (`resources/`)

화면 코드는 `apiClient`를 직접 부르지 않고 리소스별 함수를 쓴다. 타입은 `@/types/api`에서 가져온다.

```typescript
import { scheduleApi, categoryApi } from '@utils/api';

const categories = await categoryApi.getList();
const schedules = await scheduleApi.getList({ from: '2026-09-01', to: '2026-10-05', categoryId: [2] });
const saved = await scheduleApi.update(1, { color: null }); // 바뀐 필드만
```

| 파일 | 리소스 |
|---|---|
| `categoryApi.ts` | `/categories` |
| `scheduleApi.ts` | `/schedules` |

나머지(todos, ddays, dday-marks, diaries, memos, settings)는 그 화면을 만들 때 추가한다.

## 타입 생성

`types/api/schema.d.ts`는 명세에서 만든다. 명세(`../j-planner-product/08-openapi.yaml`)가 바뀌면:

```bash
npm run api:types
```

화면에서는 `types/api/index.ts`의 이름(`Schedule`, `Category` …)을 쓴다.
