# API Utils

HTTP 클라이언트와 공통 API 타입 정의

## 📁 구조

```
utils/api/
├── client.ts    # HTTP 클라이언트 (fetch 래퍼)
├── types.ts     # 공통 API 응답 타입 (AwesomeResponse)
└── index.ts     # public exports
```

## 🔧 사용법

### 1. API 클라이언트 사용

```typescript
import { apiClient } from '@utils/api';

// GET 요청 - 자동으로 AwesomeResponse<T> 형식으로 반환
const response = await apiClient.get<ScheduleAPI[]>('/endpoint', { param: 'value' });
// response.data: ScheduleAPI[]
// response.dataCount: number
// response.message: string | null

// POST 요청
const response = await apiClient.post<ScheduleAPI>('/endpoint', { title: 'New' });

// PUT, DELETE도 동일
```

### 2. AwesomeResponse 타입

**모든 메서드는 자동으로 `AwesomeResponse<T>` 형식으로 응답합니다:**

```typescript
import { apiClient } from '@utils/api';

interface ScheduleAPI {
  id: number;
  title: string;
}

// apiClient.get<T>는 Promise<AwesomeResponse<T>>를 반환
const response = await apiClient.get<ScheduleAPI[]>('/api/schedules');

// 타입 안전하게 접근
const schedules = response.data;      // ScheduleAPI[]
const count = response.dataCount;     // number
const message = response.message;     // string | null
```

### 3. API 함수 작성 예시

```typescript
import { apiClient } from '@utils/api';

export const scheduleApi = {
  // T만 지정하면 자동으로 AwesomeResponse<T> 반환
  getList: (params) =>
    apiClient.get<ScheduleAPI[]>('/api/schedules', params),

  getById: (id: number) =>
    apiClient.get<ScheduleAPI>(`/api/schedules/${id}`),

  create: (data) =>
    apiClient.post<ScheduleAPI>('/api/schedules', data),
};
```

## 📝 타입 정의

### AwesomeResponse<T>
백엔드 API의 공통 응답 형식:
```typescript
{
  data: T;
  dataCount: number;
  message: string | null;
  logMessage: string | null;
}
```

### ApiError
에러 응답:
```typescript
{
  message: string;
  status: number;
  code?: string;
}
```

## 🌍 환경변수

`.env.local`, `.env.test`, `.env.production` 파일에서 설정:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

자세한 내용은 프로젝트 루트의 `.env.example` 참조.

## 📚 관련 문서

- 환경변수 설정: `/docs/env-README.md`
- 캘린더 API: `/components/calendar/types/schedule.ts`
