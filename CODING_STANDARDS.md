# Coding Standards

This document defines the coding standards and best practices for the J's Planner project.

## Table of Contents
- [File Naming Conventions](#file-naming-conventions)
- [Component Structure](#component-structure)
- [URL Navigation](#url-navigation)
- [State Management](#state-management)
- [Styling](#styling)
- [TypeScript](#typescript)
- [Hooks](#hooks)
- [Git Commits](#git-commits)

---

## File Naming Conventions

### Files
- **Components**: `snake_case` for files, `PascalCase` for exports
  ```
  ✅ components/calendar/monthly/CalendarMonthly.tsx
  ❌ components/calendar/monthly/calendar-monthly.tsx
  ```

- **Utilities**: `camelCase` for files and exports
  ```
  ✅ utils/hooks/useNavigation.ts
  ✅ utils/store/slices/mainThemeSlice.ts
  ```

### Components
- Export with `PascalCase`
  ```tsx
  export default function CalendarMonthly() { }
  ```

### Variables & Functions
- `camelCase` for local variables and functions
  ```tsx
  const handleClick = () => { }
  const isActive = true
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
1. 📁 Files: `snake_case`, Exports: `PascalCase`
2. 🔗 Navigation: Custom hooks for user actions, `<Link>` for clickable elements
3. 🎨 Styling: Tailwind for layout, inline styles for theme colors
4. 📦 State: Redux with typed selectors
5. 🪝 Hooks: Generic in `utils/`, feature-specific in `components/[feature]/hooks/`
6. 📝 Types: Separate files, interfaces for objects
7. 💬 Comments: Only when adding value

---

**Last Updated:** 2025-11-01
