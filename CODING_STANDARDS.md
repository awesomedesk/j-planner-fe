# Coding Standards

This document defines the coding standards and best practices for the J's Planner project.

## Table of Contents
- [Naming Conventions](#naming-conventions)
- [Component Structure](#component-structure)
- [URL Navigation](#url-navigation)
- [State Management](#state-management)
- [Styling](#styling)
- [TypeScript](#typescript)
- [Hooks](#hooks)
- [Git Commits](#git-commits)
- [Pull Requests](#pull-requests)

---

## Naming Conventions

### 명명 규칙의 중요성
**역할을 명확히 표현하는 이름을 사용하세요.** 리뷰어와 미래의 개발자가 코드를 읽고 즉시 이해할 수 있도록 해야 합니다.

### 파일 명명 규칙

#### 컴포넌트 파일
- **형식**: `snake_case` for files, `PascalCase` for exports
- **원칙**: 파일명은 컴포넌트의 역할을 명확히 표현
  ```
  ✅ components/calendar/monthly/CalendarMonthly.tsx  (월간 캘린더 뷰)
  ✅ components/calendar/hooks/useCalendarNavigation.ts  (캘린더 네비게이션 로직)
  ❌ components/calendar/monthly/calendar-monthly.tsx  (케밥 케이스 사용)
  ❌ components/calendar/monthly/Cal.tsx  (축약형, 역할 불명확)
  ```

#### 유틸리티 파일
- **형식**: `camelCase` for files and exports
- **원칙**: 파일명은 제공하는 기능을 설명
  ```
  ✅ utils/hooks/useNavigation.ts  (네비게이션 훅)
  ✅ utils/store/slices/mainThemeSlice.ts  (메인 테마 상태 슬라이스)
  ✅ components/calendar/utils/dateUtils.ts  (날짜 관련 유틸리티)
  ❌ utils/helpers.ts  (너무 일반적)
  ❌ utils/util.ts  (역할 불명확)
  ```

### 컴포넌트 명명 규칙

#### 컴포넌트 이름
- **형식**: `PascalCase`
- **원칙**: 컴포넌트의 역할과 책임을 명확히 표현
  ```tsx
  // ✅ Good: 역할이 명확함
  export default function CalendarMonthly() { }
  export default function ScheduleItem() { }
  export default function CalendarHeader() { }

  // ❌ Bad: 역할이 불명확하거나 너무 일반적
  export default function Calendar() { }  // 어떤 뷰인지 불명확
  export default function Item() { }  // 무엇의 Item인지 불명확
  export default function Component1() { }  // 의미 없는 이름
  ```

#### Props 인터페이스
- **형식**: `ComponentNameProps`
- **원칙**: 어떤 컴포넌트의 Props인지 명확히 표현
  ```tsx
  // ✅ Good
  interface CalendarMonthlyProps {
    viewDate: Date;
    onDateSelect?: (date: Date) => void;
  }

  // ❌ Bad
  interface Props { }  // 어떤 컴포넌트인지 불명확
  interface CalendarProps { }  // 너무 일반적
  ```

### 함수 명명 규칙

#### 이벤트 핸들러
- **형식**: `handle[Action]` 또는 `on[Action]`
- **원칙**: 어떤 이벤트를 처리하는지 명확히 표현
  ```tsx
  // ✅ Good: 역할이 명확함
  const handleDateClick = (date: Date) => { }
  const handleNextMonth = () => { }
  const handleViewModeChange = (mode: ViewMode) => { }

  // ❌ Bad: 역할이 불명확
  const onClick = () => { }  // 무엇을 클릭하는지 불명확
  const handle = () => { }  // 무엇을 처리하는지 불명확
  const dateClick = () => { }  // 핸들러임이 불명확
  ```

#### 유틸리티 함수
- **형식**: `동사 + 명사` 형태로 동작을 명확히 표현
- **원칙**: 함수가 무엇을 하는지 이름만으로 이해 가능하도록
  ```tsx
  // ✅ Good: 동작이 명확함
  function formatUrlDate(date: Date): string { }
  function generateCalendarDays(viewDate: Date): CalendarDay[] { }
  function getScheduleColors(schedule: Schedule, themeColor: string) { }
  function calculateCellHeight(windowHeight: number): number { }

  // ❌ Bad: 동작이 불명확
  function format(date: Date) { }  // 무엇을 포맷하는지 불명확
  function get(schedule: Schedule) { }  // 무엇을 가져오는지 불명확
  function process(data: any) { }  // 무엇을 처리하는지 불명확
  ```

#### Boolean 함수/변수
- **형식**: `is/has/should/can + 형용사/명사`
- **원칙**: true/false를 반환하는 것이 명확해야 함
  ```tsx
  // ✅ Good: Boolean임이 명확
  const isActive = true;
  const hasSchedules = schedules.length > 0;
  const shouldShowMore = daySchedules.length > maxCount;
  const canNavigate = viewMode !== null;
  function isDifferentMonth(date: Date, viewDate: Date): boolean { }
  function isSameDate(date1: Date, date2: Date): boolean { }

  // ❌ Bad: Boolean임이 불명확
  const active = true;  // Boolean인지 상태값인지 불명확
  const schedules = true;  // 일정 배열과 혼동 가능
  function differentMonth(date: Date) { }  // 반환 타입 불명확
  ```

### 변수 명명 규칙

#### 일반 변수
- **형식**: `camelCase`
- **원칙**: 변수가 담고 있는 데이터를 명확히 표현
  ```tsx
  // ✅ Good: 역할이 명확함
  const viewDate = new Date();
  const selectedDate = null;
  const scheduleColors = getScheduleColors(schedule);
  const maxSchedulesCount = 5;

  // ❌ Bad: 역할이 불명확
  const date = new Date();  // 어떤 날짜인지 불명확
  const temp = null;  // 무엇을 담는지 불명확
  const data = getData();  // 어떤 데이터인지 불명확
  const n = 5;  // 무엇의 숫자인지 불명확
  ```

#### 상수
- **형식**: `UPPER_SNAKE_CASE` (설정 상수) 또는 `PascalCase` (객체 상수)
- **원칙**: 용도와 값의 의미를 명확히 표현
  ```tsx
  // ✅ Good: 용도가 명확함
  export const MONTHLY_VIEW_CONSTANTS = {
    MAIN_HEADER_HEIGHT: 60,
    DAY_NAMES_ROW_HEIGHT: 40,
    MIN_CELL_HEIGHT: 80,
  };

  const MAX_SCHEDULES_PER_DAY = 5;
  const DEFAULT_VIEW_MODE = 'month';

  // ❌ Bad: 용도가 불명확
  const CONSTANTS = { HEIGHT: 60 };  // 무엇의 상수인지 불명확
  const MAX = 5;  // 무엇의 최대값인지 불명확
  const DEFAULT = 'month';  // 무엇의 기본값인지 불명확
  ```

### 타입/인터페이스 명명 규칙

#### 인터페이스
- **형식**: `PascalCase`, 설명적인 이름 사용
- **원칙**: 데이터 구조의 역할을 명확히 표현
  ```tsx
  // ✅ Good: 역할이 명확함
  interface Schedule {
    id: string;
    title: string;
    startDateTime: Date;
    endDateTime: Date;
  }

  interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    schedules: Schedule[];
  }

  // ❌ Bad: 역할이 불명확
  interface Data { }  // 무엇의 데이터인지 불명확
  interface Item { }  // 무엇의 아이템인지 불명확
  interface Obj { }  // 의미 없는 이름
  ```

#### 타입 별칭
- **형식**: `PascalCase` 또는 `type + 설명`
- **원칙**: 타입의 용도를 명확히 표현
  ```tsx
  // ✅ Good: 용도가 명확함
  type CalendarViewMode = 'day' | 'week' | 'month';
  type ScheduleColors = {
    background: string;
    border: string;
    text: string;
  };

  // ❌ Bad: 용도가 불명확
  type Mode = 'day' | 'week' | 'month';  // 무엇의 모드인지 불명확
  type Colors = { };  // 무엇의 색상인지 불명확
  ```

### 명명 규칙 체크리스트

이름을 지을 때 다음을 확인하세요:
- [ ] 이름만 보고도 역할/용도를 이해할 수 있는가?
- [ ] 약어를 사용했다면 팀 내에서 일반적으로 통용되는가?
- [ ] 너무 일반적이거나 모호한 이름은 아닌가? (data, temp, item 등)
- [ ] 비슷한 역할의 다른 코드와 일관된 명명 패턴을 따르는가?
- [ ] Boolean 값은 is/has/should/can으로 시작하는가?
- [ ] 함수 이름은 동사로 시작하여 동작을 표현하는가?

### 좋은 명명의 예시

```tsx
// ✅ 컴포넌트: 역할이 명확
function CalendarMonthly({ viewDate, onDateSelect }: CalendarMonthlyProps) {
  // ✅ 상태: 무엇을 저장하는지 명확
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ 계산된 값: 무엇을 나타내는지 명확
  const calendarDays = useMemo(() =>
    generateCalendarDays(viewDate), [viewDate]
  );

  // ✅ 핸들러: 어떤 이벤트를 처리하는지 명확
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  // ✅ Boolean: true/false 값임이 명확
  const hasSchedules = schedules.length > 0;
  const shouldShowMoreButton = schedules.length > MAX_VISIBLE_SCHEDULES;

  return (
    <div>
      {calendarDays.map(day => (
        <div
          key={day.date.toISOString()}
          onClick={() => handleDateClick(day.date)}
        >
          {/* ... */}
        </div>
      ))}
    </div>
  );
}
```

---

## Component Structure

### 1. Client Components
Always specify `"use client"` at the top for components using React hooks or browser APIs.

```tsx
"use client";

import { useState } from 'react';
// ... other imports

export default function MyComponent() {
  // Component logic
}
```

### 2. Import Order
```tsx
"use client";

// 1. React imports
import { useState, useEffect } from 'react';

// 2. Next.js imports
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 3. Third-party libraries
import { useSelector, useDispatch } from 'react-redux';

// 4. Internal components
import MyComponent from '@components/MyComponent';

// 5. Types
import { MyType } from './types';

// 6. Utils & hooks
import { useMyHook } from '@utils/hooks/useMyHook';

// 7. Styles (if any)
import './styles.css';
```

### 3. Component Documentation
Add JSDoc comments for complex components:

```tsx
/**
 * CalendarMonthly - Client-side monthly calendar view component
 * This component uses Redux and browser APIs, so it must be rendered client-side only
 * Wrapped by CalendarMonthlyWrapper to handle SSR/hydration
 */
export default function CalendarMonthly() {
  // ...
}
```

---

## URL Navigation

### Overview
Use the appropriate method based on the use case:

| Use Case | Method | Example |
|----------|--------|---------|
| Initial redirects | `router.replace` | Redirect `/calendar` to `/calendar/monthly/today` |
| Legacy URL handling | `router.replace` | Redirect `/calender` to `/calendar` |
| User navigation (buttons) | Custom hooks | `useCalendarNavigation()` |
| Static clickable links | `<Link>` | Logo, "Show +" button |

### 1. Router.replace (Redirects Only)
Use **only** for initial page loads and redirects:

```tsx
// ✅ Good: Initial redirect
useEffect(() => {
  router.replace(`/calendar/monthly/${today}`);
}, [router]);

// ❌ Bad: User interaction
<button onClick={() => router.push('/calendar/daily/2025-01-01')}>
```

### 2. Custom Navigation Hooks
**Always** use custom hooks for user-triggered navigation:

```tsx
// ✅ Good: Using custom hook
const { navigateInCurrentView } = useCalendarNavigation();

const handleNext = () => {
  const newDate = calculateNextDate();
  navigateInCurrentView(newDate, viewMode);
};

// ❌ Bad: Direct router.push
const handleNext = () => {
  router.push(`/calendar/monthly/${newDate}`);
};
```

### 3. Link Component
Use `<Link>` for all clickable elements that navigate:

```tsx
// ✅ Good: Static link
<Link href="/">
  <h2>Home</h2>
</Link>

// ✅ Good: Dynamic link with onClick for additional logic
<Link
  href={`/calendar/daily/${formatUrlDate(date)}`}
  onClick={(e) => e.stopPropagation()}
>
  View Details
</Link>

// ❌ Bad: div with onClick
<div onClick={() => router.push('/page')}>
  Click me
</div>
```

### 4. Navigation Hook Structure

#### Generic Hook (utils/hooks/)
Place reusable, generic navigation logic in `utils/hooks/`:

```tsx
// utils/hooks/useNavigation.ts
export const useNavigation = <T extends string>(config: {
  basePath: string;
  viewModeMap: Record<T, string>;
  formatDate: (date: Date) => string;
}) => {
  const router = useRouter();
  // Generic navigation logic
};
```

#### Feature-Specific Hook (components/[feature]/hooks/)
Extend generic hooks for specific features:

```tsx
// components/calendar/hooks/useCalendarNavigation.ts
export const useCalendarNavigation = () => {
  const dispatch = useDispatch();
  const { navigateToDate: baseNavigateToDate } = useNavigation<CalendarViewMode>({
    basePath: '/calendar',
    viewModeMap: { day: 'daily', week: 'weekly', month: 'monthly' },
    formatDate: formatUrlDate,
  });

  const navigateToDate = (date: Date, viewMode: CalendarViewMode) => {
    // Update Redux state (feature-specific)
    dispatch(setViewMode(viewMode));

    // Use base navigation
    baseNavigateToDate(date, viewMode);
  };

  return { navigateToDate, /* ... */ };
};
```

---

## State Management

### Redux Store Structure
```
utils/store/
  ├── store.ts          # Store configuration
  ├── provider.tsx      # Store provider
  └── slices/
      ├── mainThemeSlice.ts
      ├── mainMenuSlice.ts
      └── calendarViewSlice.ts
```

### Usage
```tsx
// ✅ Good: Typed selectors
const themeColor = useSelector(getThemeColor);
const viewMode = useSelector(getCalendarViewMode);

// ✅ Good: Dispatch with actions
dispatch(setViewMode('day'));

// ❌ Bad: Direct state access
const state = useSelector(state => state.calendar.viewMode);
```

---

## Styling

### Tailwind CSS
Use Tailwind for layout and common styles:

```tsx
// ✅ Good
<div className="flex items-center justify-between p-4">

// ❌ Bad: Inline styles for common layouts
<div style={{ display: 'flex', padding: '1rem' }}>
```

### Dynamic Styles
Use inline styles for theme-dependent colors:

```tsx
// ✅ Good: Theme colors via inline styles
<div
  className="p-4 rounded-lg"
  style={{
    backgroundColor: colors.background,
    color: colors.text
  }}
>

// ❌ Bad: Hardcoded colors in Tailwind
<div className="bg-blue-500 text-white">
```

### Style Priority
1. **Tailwind** for layout, spacing, typography
2. **Inline styles** for dynamic theme colors
3. **CSS modules** for complex component-specific styles (if needed)

---

## TypeScript

### Type Definitions
- Define types in separate files: `types.ts` or `types/index.ts`
- Use interfaces for object shapes
- Use type aliases for unions/intersections

```tsx
// types.ts
export interface CalendarProps {
  initialDate?: Date;
  onDateSelect?: (date: Date) => void;
}

export type CalendarViewMode = 'day' | 'week' | 'month';
```

### Component Props
```tsx
// ✅ Good: Defined interface
interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export default function MyComponent({ title, onClick }: MyComponentProps) {
  // ...
}

// ❌ Bad: Inline type
export default function MyComponent({ title, onClick }: { title: string, onClick?: () => void }) {
  // ...
}
```

### Generic Types
Use generics for reusable logic:

```tsx
// ✅ Good
export const useNavigation = <T extends string>(config: NavigationConfig<T>) => {
  // ...
};
```

---

## Hooks

### Custom Hook Naming
- Always prefix with `use`
- Use descriptive names: `useCalendarNavigation`, not `useNav`

### Custom Hook Structure
```tsx
// hooks/useMyHook.ts
export const useMyHook = () => {
  // 1. Other hooks
  const router = useRouter();
  const dispatch = useDispatch();

  // 2. State
  const [state, setState] = useState();

  // 3. Effects
  useEffect(() => {
    // ...
  }, []);

  // 4. Handlers
  const handleAction = () => {
    // ...
  };

  // 5. Return
  return {
    state,
    handleAction,
  };
};
```

### Hook Location
```
Generic/Reusable hooks    → utils/hooks/
Feature-specific hooks    → components/[feature]/hooks/
```

---

## Comments & Documentation

### When to Comment
- Complex logic that isn't immediately obvious
- Public API functions/hooks
- Non-trivial algorithms
- Workarounds or hacks (with explanation)

### Comment Style
```tsx
// ✅ Good: Concise and clear
// Calculate cell height based on available viewport

// ✅ Good: JSDoc for public APIs
/**
 * Navigate to a specific date with a specific view mode
 * @param date - The date to navigate to
 * @param viewMode - The view mode to switch to
 */

// ❌ Bad: Obvious comments
// Set the value to true
setValue(true);
```

---

## Error Handling

### API Calls
```tsx
// ✅ Good
try {
  const response = await api.getData();
  setData(response);
} catch (error) {
  const errorMessage = error instanceof Error
    ? error.message
    : 'Unknown error occurred';
  console.error('Failed to fetch data:', errorMessage);
  setError(errorMessage);
}

// ❌ Bad: Swallowing errors
try {
  const response = await api.getData();
} catch (error) {
  // Silent failure
}
```

---

## Git Commits

### 커밋 가이드라인

#### 1. 기능 기반 커밋
**항상** 파일이나 시간이 아닌 논리적 기능이나 변경 사항으로 커밋을 분리하세요.

```bash
# ✅ 좋은 예: 기능별로 커밋 분리
git commit -m "Refactor: CALENDAR_CONSTANTS를 WEEKLY_DAILY_VIEW_CONSTANTS로 대체"
git commit -m "Feat: 테마 색상을 기본 일정 색상으로 사용"

# ❌ 나쁜 예: 여러 변경사항을 하나의 커밋으로
git commit -m "캘린더 파일 업데이트"
```

#### 2. 커밋 메시지 형식
설명적인 메시지와 함께 관례적인 커밋 형식을 따르세요:

```
<타입>: <간단한 요약>

<상세 설명>

이점:
- <이점 1>
- <이점 2>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**타입:**
- `Feat:` - 새로운 기능 추가
- `Fix:` - 버그 수정
- `Refactor:` - 동작 변경 없는 코드 재구조화
- `Docs:` - 문서 업데이트
- `Style:` - 포맷팅, 스타일 변경
- `Chore:` - 빌드, 설정, 의존성 업데이트
- `Test:` - 테스트 추가 또는 업데이트

#### 3. 커밋 예시

**좋은 예시:**
```bash
# 기능 추가
git commit -m "Feat: 설정 페이지에 다크모드 토글 추가

- ThemeToggle 컴포넌트 생성
- Redux 테마 slice와 통합
- 부드러운 전환 애니메이션 추가

이점:
- 향상된 사용자 경험
- 접근성 준수"

# 리팩토링
git commit -m "Refactor: 네비게이션 로직을 커스텀 훅으로 추출

- useCalendarNavigation 훅 생성
- 컴포넌트에서 중복된 router 로직 제거
- 날짜 포맷팅 중앙화

이점:
- DRY 원칙 준수
- 테스트 용이성
- 일관된 네비게이션 동작"

# 버그 수정
git commit -m "Fix: 주간 뷰에서 일정 겹침 문제 해결

- 여러 날짜에 걸친 이벤트를 처리하도록 getSchedulePosition 업데이트
- 날짜 경계 클리핑을 위한 viewDate 파라미터 추가

Fixes: #123"
```

**나쁜 예시:**
```bash
# ❌ 너무 모호함
git commit -m "파일 업데이트"

# ❌ 관련 없는 여러 변경사항
git commit -m "캘린더 버그 수정하고 새 버튼 추가"

# ❌ 설명 없음
git commit -m "변경사항"
```

#### 4. 별도 커밋을 생성해야 하는 경우

다음의 경우 별도 커밋을 생성하세요:
- ✅ 각각의 구별되는 기능이나 기능성
- ✅ 버그 수정 (버그당 하나의 커밋)
- ✅ 동작을 변경하지 않는 리팩토링
- ✅ 문서 업데이트
- ✅ 설정/셋업 변경

**예시 워크플로우:**
```bash
# 나쁜 예: 모두 한꺼번에
git add .
git commit -m "여러 업데이트"

# 좋은 예: 기능별로 분리
git add components/calendar/utils/scheduleUtils.ts
git add components/calendar/hooks/useCurrentTimeIndicator.ts
git commit -m "Refactor: CALENDAR_CONSTANTS를 WEEKLY_DAILY_VIEW_CONSTANTS로 대체"

git add components/calendar/utils/colorUtils.ts
git add components/calendar/monthly/ScheduleItem.tsx
git commit -m "Feat: 테마 색상을 기본 일정 색상으로 사용"

git add CODING_STANDARDS.md
git commit -m "Docs: 코딩 표준에 Git 커밋 가이드라인 추가"
```

#### 5. 커밋 검토 체크리스트

커밋하기 전에 확인하세요:
- [ ] 변경사항이 단일 기능/수정과 관련되어 있는가
- [ ] 커밋 메시지가 설명적이고 형식을 따르는가
- [ ] 관련 없는 변경사항이 포함되어 있지 않은가
- [ ] 코드가 린팅을 통과하는가 (`npm run lint`)
- [ ] TypeScript 오류가 없는가
- [ ] 테스트가 통과하는가 (해당하는 경우)

---

## Pull Requests

### PR 가이드라인

#### 1. PR 템플릿 사용
**반드시** `.github/PULL_REQUEST_TEMPLATE.md` 파일의 템플릿을 따라 PR을 작성하세요.

#### 2. PR 제목 작성 규칙
```
[상태] 작업 내용을 간결하게

예시:
✅ 캘린더 네비게이션 훅 추가
✅ [WIP] 다크모드 구현
```

**상태 표시:**
- 작업 중: `[WIP]` (Work In Progress)
- 완료: 상태 표시 없음

#### 3. PR 템플릿 구조

템플릿의 각 섹션을 빠짐없이 작성하세요:

**필수 섹션:**
- **개요**: PR을 시작하게 된 이유
- **작업한 내용**: 구체적인 변경사항 나열
- **리뷰 가이드**: 중점적으로 봐야 할 부분, 질문사항
- **테스트 결과**: 테스트 결과 첨부 또는 테스트 방법 제시

**선택 섹션:**
- **앞으로 추가 예정 내용**: 후속 작업 계획
- **기타 내용**: 참고사항
- **이슈번호**: 관련 이슈 링크 (예: [#1][#2])

#### 4. 좋은 PR 예시

```markdown
캘린더 네비게이션 커스텀 훅 추가

## 개요

캘린더 컴포넌트에서 네비게이션 로직이 중복되어 유지보수가 어려운 문제를 해결하기 위해 커스텀 훅으로 추출했습니다.

## 작업한 내용

- useCalendarNavigation 커스텀 훅 생성
- Calendar, CalendarMonthly 컴포넌트에서 중복 로직 제거
- "show +N" 링크를 클릭 가능하게 개선
- 테스트 데이터 추가 (야간 일정, 여러 날짜 걸친 일정)

## 리뷰 가이드

- useCalendarNavigation 훅의 구조가 적절한지 검토 부탁드립니다
- 특히 viewDate와 viewMode 동기화 로직 확인 필요

## 테스트 결과

- 월간/주간/일간 뷰 전환 정상 동작 확인
- "show +3" 클릭 시 해당 날짜의 일간 뷰로 이동 확인
- 브라우저 뒤로가기/앞으로가기 정상 동작

## 앞으로 추가 예정 내용

- 키보드 네비게이션 지원 (방향키로 날짜 이동)
- URL 파라미터 검증 강화

## 기타 내용

- CODING_STANDARDS.md에 네비게이션 가이드라인 추가

## 이슈번호

[#23]
```

#### 5. 나쁜 PR 예시

```markdown
❌ 제목: 업데이트
❌ 개요: 캘린더 수정
❌ 작업한 내용: 여러 파일 변경
❌ 리뷰 가이드: (비어있음)
❌ 테스트 결과: 잘 됨
```

#### 6. PR 생성 전 체크리스트

PR을 생성하기 전에 확인하세요:
- [ ] 템플릿의 모든 필수 섹션 작성 완료
- [ ] 모든 커밋이 의미있는 단위로 분리되어 있음
- [ ] 커밋 메시지가 가이드라인을 따름
- [ ] 린트 통과 (`npm run lint`)
- [ ] TypeScript 오류 없음
- [ ] 로컬에서 테스트 완료
- [ ] 스크린샷이나 동영상이 필요한 경우 첨부
- [ ] 관련 이슈 번호 연결

---

## Testing & Quality

### Before Committing
1. ✅ No TypeScript errors
2. ✅ No ESLint warnings (run `npm run lint`)
3. ✅ Code follows this style guide
4. ✅ Imports are organized correctly
5. ✅ No unused variables/imports
6. ✅ Descriptive variable/function names

---

## Examples

### ✅ Good Component Example
```tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { getThemeColor } from '@utils/store/slices/mainThemeSlice';
import { useCalendarNavigation } from '../hooks/useCalendarNavigation';
import { CalendarProps } from '../types';

/**
 * CalendarMonthly - Monthly calendar view component
 */
export default function CalendarMonthly({ viewDate, onDateClick }: CalendarProps) {
  const themeColors = useSelector(getThemeColor);
  const { navigateToDailyView } = useCalendarNavigation();

  const [isLoading, setIsLoading] = useState(false);

  const handleDateClick = (date: Date) => {
    onDateClick?.(date);
  };

  return (
    <div
      className="p-4 rounded-lg"
      style={{ backgroundColor: themeColors.Light }}
    >
      <Link
        href="/calendar/daily/2025-01-01"
        className="text-sm hover:underline"
      >
        View Details
      </Link>
    </div>
  );
}
```

---

## Summary

**Golden Rules:**
1. 📛 Naming: 역할을 명확히 표현하는 이름 사용 (리뷰어가 즉시 이해 가능하도록)
2. 📁 Files: `snake_case`, Exports: `PascalCase`
3. 🔗 Navigation: Custom hooks for user actions, `<Link>` for clickable elements
4. 🎨 Styling: Tailwind for layout, inline styles for theme colors
5. 📦 State: Redux with typed selectors
6. 🪝 Hooks: Generic in `utils/`, feature-specific in `components/[feature]/hooks/`
7. 📝 Types: Separate files, interfaces for objects
8. 💬 Comments: Only when adding value
9. 📝 Commits: Korean messages, feature-based separation
10. 🔀 PRs: Follow `.github/PULL_REQUEST_TEMPLATE.md`

---

**Last Updated:** 2025-11-01
