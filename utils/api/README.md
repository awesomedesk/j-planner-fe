# API 사용 예시

## 📋 기본 설정

### 1. 환경변수 설정
`env/` 폴더의 환경별 파일에 백엔드 API URL을 설정하세요:

**로컬 환경 (`env/.env.local`):**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_AUTH_DOMAIN=localhost:3000
NEXT_PUBLIC_DEBUG_MODE=true
```

**테스트 환경 (`env/.env.test`):**
```env
NEXT_PUBLIC_API_BASE_URL=https://test-api.j-planner.com/api
NEXT_PUBLIC_AUTH_DOMAIN=test.j-planner.com
NEXT_PUBLIC_DEBUG_MODE=true
```

**프로덕션 환경 (`env/.env.production`):**
```env
NEXT_PUBLIC_API_BASE_URL=https://api.j-planner.com/api
NEXT_PUBLIC_AUTH_DOMAIN=j-planner.com
NEXT_PUBLIC_DEBUG_MODE=false
```

환경별 실행:
```bash
npm run dev:local    # 로컬 환경
npm run dev:test     # 테스트 환경
npm run build:prod   # 프로덕션 빌드
```

### 2. 환경별 설정 확인
```typescript
import { envConfig, isProduction, logger } from '@env/config';

// 현재 환경 확인
console.log('Current environment:', envConfig.appEnv);
console.log('API Base URL:', envConfig.apiBaseUrl);

// 환경별 로직
if (isProduction()) {
  logger.info('Running in production mode');
} else {
  logger.debug('Running in development mode');
}
```

### 3. 인증 토큰 설정 (필요시)
```typescript
import { apiClient } from '@utils/api';

// 로그인 후 토큰 설정
apiClient.setAuthToken('your-jwt-token');

// 로그아웃시 토큰 제거
apiClient.removeAuthToken();
```

## 🗓️ 달력 컴포넌트 사용

### 기존 달력 (샘플 데이터)
```typescript
import Calendar from '@components/calendar/Calendar';

function MyPage() {
  return (
    <Calendar 
      onDateSelect={(date) => console.log('선택된 날짜:', date)}
      initialDate={new Date()}
    />
  );
}
```

### API 연동 달력
```typescript
import CalendarWithAPI from '@components/calendar/CalendarWithAPI';

function MyPage() {
  return (
    <CalendarWithAPI 
      onDateSelect={(date) => console.log('선택된 날짜:', date)}
      initialDate={new Date()}
    />
  );
}
```

## 🔗 API 훅 사용 예시

### 1. 월별 일정 조회
```typescript
import { useMonthlySchedules } from '@utils/api';

function MonthlyScheduleList() {
  const { data: schedules, loading, error, refetch } = useMonthlySchedules({
    year: 2024,
    month: 8
  });

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>오류: {error}</div>;

  return (
    <ul>
      {schedules?.map(schedule => (
        <li key={schedule.id}>{schedule.title}</li>
      ))}
    </ul>
  );
}
```

### 2. 일정 생성/수정/삭제
```typescript
import { useScheduleMutations } from '@utils/api';

function ScheduleForm() {
  const { createSchedule, updateSchedule, deleteSchedule, loading, error } = useScheduleMutations();

  const handleCreate = async () => {
    const newSchedule = await createSchedule({
      title: '새 일정',
      startDate: new Date().toISOString(),
      color: 'blue',
      isAllDay: true,
    });

    if (newSchedule) {
      console.log('일정 생성 성공:', newSchedule);
    }
  };

  const handleUpdate = async (id: string) => {
    const updatedSchedule = await updateSchedule(id, {
      title: '수정된 일정'
    });

    if (updatedSchedule) {
      console.log('일정 수정 성공:', updatedSchedule);
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteSchedule(id);
    
    if (success) {
      console.log('일정 삭제 성공');
    }
  };

  return (
    <div>
      <button onClick={handleCreate} disabled={loading}>
        일정 생성
      </button>
      {error && <div>오류: {error}</div>}
    </div>
  );
}
```

### 3. 일정 검색
```typescript
import { useScheduleSearch } from '@utils/api';

function ScheduleSearchComponent() {
  const { data: schedules, loading, searchSchedules } = useScheduleSearch();

  const handleSearch = async () => {
    await searchSchedules({
      query: '회의',
      page: 1,
      limit: 10,
      dateFrom: '2024-08-01',
      dateTo: '2024-08-31',
      color: 'blue'
    });
  };

  return (
    <div>
      <button onClick={handleSearch}>검색</button>
      {loading && <div>검색 중...</div>}
      {schedules?.map(schedule => (
        <div key={schedule.id}>{schedule.title}</div>
      ))}
    </div>
  );
}
```

## 🛠️ 직접 API 호출

### 훅을 사용하지 않는 경우
```typescript
import { scheduleApi } from '@utils/api';

async function fetchSchedulesDirectly() {
  try {
    // 월별 일정 조회
    const monthlyResponse = await scheduleApi.getByMonth({
      year: 2024,
      month: 8
    });
    console.log('월별 일정:', monthlyResponse.data.schedules);

    // 일정 생성
    const createResponse = await scheduleApi.create({
      title: '새 일정',
      startDate: '2024-08-16T10:00:00Z',
      color: 'blue',
      isAllDay: false,
    });
    console.log('생성된 일정:', createResponse.data);

  } catch (error) {
    console.error('API 오류:', error);
  }
}
```

## 🔧 에러 처리

```typescript
import { ApiError } from '@utils/api';

try {
  const response = await scheduleApi.getAll();
  // 성공 처리
} catch (error) {
  const apiError = error as ApiError;
  
  switch (apiError.status) {
    case 401:
      // 인증 오류
      console.log('로그인이 필요합니다');
      break;
    case 403:
      // 권한 오류
      console.log('권한이 없습니다');
      break;
    case 500:
      // 서버 오류
      console.log('서버 오류가 발생했습니다');
      break;
    default:
      console.log('오류:', apiError.message);
  }
}
```

## 📝 타입 활용

```typescript
import type { ScheduleAPI, CreateScheduleRequest, ScheduleColor } from '@utils/api';

// 타입 안전한 일정 생성
const createScheduleData: CreateScheduleRequest = {
  title: '중요한 회의',
  description: '프로젝트 진행 상황 논의',
  startDate: '2024-08-16T14:00:00Z',
  endDate: '2024-08-16T15:00:00Z',
  color: 'blue' as ScheduleColor,
  isAllDay: false,
};

// API 응답 타입 활용
function processSchedule(schedule: ScheduleAPI) {
  console.log(`일정: ${schedule.title}`);
  console.log(`시작: ${new Date(schedule.startDate).toLocaleString()}`);
}
```
