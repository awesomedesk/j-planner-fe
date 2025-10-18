# 📅 date-fns 사용 가이드

> J's Planner 프로젝트에서 date-fns를 선택한 이유와 실전 활용법

## 📋 목차

- [date-fns란 무엇인가?](#-date-fns란-무엇인가)
- [date-fns를 선택한 이유](#-date-fns를-선택한-이유)
- [대안 라이브러리 비교](#-대안-라이브러리-비교)
- [설치 및 설정](#-설치-및-설정)
- [핵심 기능 및 사용법](#-핵심-기능-및-사용법)
- [실전 예제](#-실전-예제)
- [프로젝트 내 사용 사례](#-프로젝트-내-사용-사례)
- [주의사항 및 베스트 프랙티스](#-주의사항-및-베스트-프랙티스)

## 🧭 date-fns란 무엇인가?

### **정의**
date-fns는 **모던 JavaScript 날짜 유틸리티 라이브러리**로, 간단하고 일관된 API로 날짜를 조작하고 포맷팅할 수 있습니다.

### **핵심 철학**
```javascript
// date-fns의 핵심 원칙
1. Immutable & Pure (불변성 & 순수 함수)
2. Modular (모듈식 설계)
3. Simple & Consistent (간단하고 일관된 API)
4. TypeScript First (TypeScript 우선 지원)
```

### **주요 특징**
- 📦 **Tree-shakable**: 사용하는 함수만 번들에 포함
- 🔒 **불변성**: 원본 날짜를 변경하지 않음
- 🌍 **국제화**: i18n 지원
- 📘 **TypeScript**: 완벽한 타입 정의
- ⚡ **가벼움**: 필요한 함수만 import

## 🎯 date-fns를 선택한 이유

### **1. 번들 크기 최적화**
```typescript
// Moment.js (전체 라이브러리 import 필요)
import moment from 'moment'; // ~67KB (minified)

// date-fns (필요한 함수만 import)
import { format, addDays } from 'date-fns'; // ~2KB (minified)
```

**선택 이유**: Next.js 프로젝트에서 번들 크기는 성능에 직접적인 영향을 미칩니다. date-fns는 Tree-shaking을 통해 사용하지 않는 함수는 번들에 포함되지 않아 최적화에 유리합니다.

### **2. 불변성 (Immutability)**
```typescript
// 날짜 객체를 직접 변경하지 않음
const originalDate = new Date(2024, 0, 1);
const newDate = addDays(originalDate, 5);

console.log(originalDate); // 2024-01-01 (변경되지 않음)
console.log(newDate);      // 2024-01-06 (새로운 객체)
```

**선택 이유**: Redux와 함께 사용할 때 불변성이 매우 중요합니다. date-fns의 순수 함수 접근 방식은 Redux의 철학과 완벽하게 일치합니다.

### **3. TypeScript 지원**
```typescript
// 완벽한 타입 추론
import { format } from 'date-fns';

const formatted: string = format(new Date(), 'yyyy-MM-dd');
// TypeScript가 자동으로 타입을 인식
```

**선택 이유**: 우리 프로젝트는 TypeScript 기반이므로, date-fns의 완벽한 타입 정의는 개발 경험을 크게 향상시킵니다.

### **4. Next.js와의 호환성**
**선택 이유**: date-fns는 순수 함수로 구성되어 있어 SSR/SSG 환경에서도 문제없이 동작합니다. 전역 상태를 변경하지 않아 Next.js의 서버 컴포넌트와도 안전하게 사용할 수 있습니다.

## 📊 대안 라이브러리 비교

### **Moment.js vs Day.js vs date-fns vs Luxon**

| 특징 | Moment.js | Day.js | date-fns | Luxon |
|------|-----------|--------|----------|-------|
| 번들 크기 (min) | 67.9 KB | 6.5 KB | 13.1 KB (full) / 2-4 KB (개별) | 23.4 KB |
| Tree-shaking | ❌ | ⚠️ 제한적 | ✅ 완벽 | ⚠️ 제한적 |
| 불변성 | ❌ | ✅ | ✅ | ✅ |
| TypeScript | ⚠️ @types 필요 | ⚠️ @types 필요 | ✅ 내장 | ✅ 내장 |
| 유지보수 상태 | 🔴 중단됨 | ✅ 활발 | ✅ 활발 | ✅ 활발 |
| 국제화 | ✅ | ✅ 플러그인 | ✅ | ✅ |
| 학습 곡선 | 낮음 | 낮음 | 중간 | 높음 |

### **왜 date-fns를 선택했나?**

1. ✅ **Moment.js는 제외**: 공식적으로 유지보수가 중단되었고, 번들 크기가 너무 큼
2. ✅ **Day.js는 제외**: API는 간단하지만 Tree-shaking이 완벽하지 않고, 복잡한 날짜 연산에서 제한적
3. ✅ **Luxon은 제외**: 강력하지만 번들 크기가 크고, 학습 곡선이 높음. Planner 앱에는 과도함
4. ✅ **date-fns 선택**:
   - 완벽한 Tree-shaking으로 번들 크기 최소화
   - 풍부한 함수 라이브러리 (200+ 함수)
   - TypeScript 완벽 지원
   - Redux와의 철학적 일치 (불변성)
   - Next.js SSR/SSG 완벽 호환

## 🔧 설치 및 설정

### **설치**
```bash
npm install date-fns
```

### **버전 정보**
```json
{
  "dependencies": {
    "date-fns": "^4.1.0"
  }
}
```

### **기본 Import**
```typescript
// 필요한 함수만 개별적으로 import
import { format, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';

// ❌ 잘못된 방법 (Tree-shaking 불가)
import * as dateFns from 'date-fns';

// ❌ 잘못된 방법 (전체 모듈 import)
import dateFns from 'date-fns';
```

## 🚀 핵심 기능 및 사용법

### **1. 날짜 포맷팅 (Formatting)**

```typescript
import { format } from 'date-fns';

const date = new Date(2024, 9, 18); // 2024-10-18

// 다양한 포맷
format(date, 'yyyy-MM-dd');           // "2024-10-18"
format(date, 'yyyy년 MM월 dd일');      // "2024년 10월 18일"
format(date, 'yyyy.MM.dd');           // "2024.10.18"
format(date, 'MM/dd/yyyy');           // "10/18/2024"
format(date, 'EEEE');                 // "Friday"
format(date, 'yyyy-MM-dd HH:mm:ss');  // "2024-10-18 00:00:00"

// 시간 포맷
format(new Date(), 'HH:mm:ss');       // "14:30:45"
format(new Date(), 'h:mm a');         // "2:30 PM"
```

**주요 포맷 토큰**:
- `yyyy`: 4자리 연도
- `MM`: 2자리 월 (01-12)
- `dd`: 2자리 일 (01-31)
- `HH`: 24시간 형식 (00-23)
- `hh`: 12시간 형식 (01-12)
- `mm`: 분 (00-59)
- `ss`: 초 (00-59)
- `EEEE`: 요일 (Monday, Tuesday...)
- `EEE`: 요일 축약 (Mon, Tue...)

### **2. 날짜 비교 (Comparison)**

```typescript
import { isSameDay, isToday, isBefore, isAfter, isWithinInterval } from 'date-fns';

const date1 = new Date(2024, 9, 18);
const date2 = new Date(2024, 9, 18);
const date3 = new Date(2024, 9, 19);

// 같은 날짜인지 확인 (시간 무시)
isSameDay(date1, date2);  // true
isSameDay(date1, date3);  // false

// 오늘인지 확인
isToday(new Date());      // true
isToday(date1);           // false (과거)

// 날짜 순서 비교
isBefore(date1, date3);   // true
isAfter(date3, date1);    // true

// 특정 기간 내에 있는지 확인
isWithinInterval(new Date(), {
  start: new Date(2024, 0, 1),
  end: new Date(2024, 11, 31)
}); // true
```

### **3. 날짜 계산 (Manipulation)**

```typescript
import { addDays, subDays, addMonths, subMonths, addYears } from 'date-fns';

const today = new Date(2024, 9, 18);

// 날짜 더하기/빼기
addDays(today, 7);        // 7일 후: 2024-10-25
subDays(today, 3);        // 3일 전: 2024-10-15

addMonths(today, 2);      // 2개월 후: 2024-12-18
subMonths(today, 1);      // 1개월 전: 2024-09-18

addYears(today, 1);       // 1년 후: 2025-10-18

// 원본은 변경되지 않음 (불변성)
console.log(today);       // 2024-10-18 (그대로 유지)
```

### **4. 주/월의 시작/끝 날짜 (Start/End of Period)**

```typescript
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

const date = new Date(2024, 9, 18); // 금요일

// 주의 시작/끝 (기본: 일요일 시작)
startOfWeek(date);        // 2024-10-13 (일요일) 00:00:00
endOfWeek(date);          // 2024-10-19 (토요일) 23:59:59

// 주의 시작/끝 (월요일 시작)
startOfWeek(date, { weekStartsOn: 1 });  // 2024-10-14 (월요일)
endOfWeek(date, { weekStartsOn: 1 });    // 2024-10-20 (일요일)

// 월의 시작/끝
startOfMonth(date);       // 2024-10-01 00:00:00
endOfMonth(date);         // 2024-10-31 23:59:59

// 하루의 시작/끝
startOfDay(date);         // 2024-10-18 00:00:00
endOfDay(date);           // 2024-10-18 23:59:59
```

### **5. 날짜 범위 생성 (Date Ranges)**

```typescript
import { eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

// 특정 기간의 모든 날짜 배열 생성
const days = eachDayOfInterval({
  start: new Date(2024, 9, 1),
  end: new Date(2024, 9, 7)
});
// [2024-10-01, 2024-10-02, ..., 2024-10-07]

// 특정 기간의 모든 주 시작 날짜
const weeks = eachWeekOfInterval({
  start: new Date(2024, 9, 1),
  end: new Date(2024, 9, 31)
}, { weekStartsOn: 1 }); // 월요일 시작

// 특정 기간의 모든 월 시작 날짜
const months = eachMonthOfInterval({
  start: new Date(2024, 0, 1),
  end: new Date(2024, 11, 31)
});
```

### **6. 날짜 차이 계산 (Difference)**

```typescript
import { differenceInDays, differenceInMonths, differenceInYears, differenceInHours } from 'date-fns';

const date1 = new Date(2024, 9, 18);
const date2 = new Date(2024, 9, 25);

// 날짜 차이 계산
differenceInDays(date2, date1);      // 7일
differenceInMonths(date2, date1);    // 0개월
differenceInHours(date2, date1);     // 168시간

// 음수도 가능
differenceInDays(date1, date2);      // -7일
```

## 💡 실전 예제

### **예제 1: 캘린더 주간 뷰 생성**

```typescript
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';

function getWeekDays(date: Date) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // 월요일 시작
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: weekStart, end: weekEnd }).map(day => ({
    date: day,
    dayOfWeek: format(day, 'EEE'),        // "Mon", "Tue", ...
    dayOfMonth: format(day, 'd'),         // "1", "2", ...
    fullDate: format(day, 'yyyy-MM-dd'),  // "2024-10-14"
    isToday: isToday(day)
  }));
}

// 사용
const weekDays = getWeekDays(new Date());
/*
[
  { date: Date, dayOfWeek: 'Mon', dayOfMonth: '14', fullDate: '2024-10-14', isToday: false },
  { date: Date, dayOfWeek: 'Tue', dayOfMonth: '15', fullDate: '2024-10-15', isToday: false },
  ...
]
*/
```

### **예제 2: 월간 캘린더 생성**

```typescript
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth } from 'date-fns';

function getMonthCalendar(date: Date) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  // 월의 모든 날짜 가져오기
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return days.map(day => ({
    date: day,
    day: format(day, 'd'),
    isCurrentMonth: isSameMonth(day, date),
    isToday: isToday(day)
  }));
}
```

### **예제 3: 상대적 날짜 표시 (예: "3일 전")**

```typescript
import { formatDistance, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale'; // 한국어 locale

const pastDate = new Date(2024, 9, 15);

// 현재로부터의 상대 시간
formatDistanceToNow(pastDate);                    // "3 days ago"
formatDistanceToNow(pastDate, { addSuffix: true }); // "3 days ago"

// 한국어 지원
formatDistanceToNow(pastDate, {
  addSuffix: true,
  locale: ko
}); // "3일 전"

// 두 날짜 간의 거리
const futureDate = new Date(2024, 9, 25);
formatDistance(pastDate, futureDate); // "10 days"
```

### **예제 4: 날짜 유효성 검사**

```typescript
import { isValid, isPast, isFuture, parseISO } from 'date-fns';

// 유효한 날짜인지 확인
isValid(new Date());           // true
isValid(new Date('invalid'));  // false

// 과거/미래 날짜인지 확인
isPast(new Date(2020, 0, 1));  // true
isFuture(new Date(2030, 0, 1)); // true

// ISO 문자열 파싱
const parsed = parseISO('2024-10-18');
isValid(parsed); // true
```

## 🎨 프로젝트 내 사용 사례

### **CalendarWeekly 컴포넌트**
[components/calendar/weekly/CalendarWeekly.tsx](../components/calendar/weekly/CalendarWeekly.tsx)

```typescript
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isToday } from 'date-fns';

// 주간 날짜 배열 생성
const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

// 날짜 포맷팅 및 비교
weekDays.map((day) => {
  const dayOfWeek = format(day, 'EEE');     // 요일
  const dayOfMonth = format(day, 'd');      // 일
  const isCurrentDay = isSameDay(day, selectedDate);
  const isTodayDate = isToday(day);

  // UI 렌더링...
});
```

### **CalendarDaily 컴포넌트**
[components/calendar/daily/CalendarDaily.tsx](../components/calendar/daily/CalendarDaily.tsx)

```typescript
import { format, isSameDay, isToday } from 'date-fns';

// 현재 날짜 포맷팅
const formattedDate = format(currentDate, 'yyyy년 M월 d일');

// 날짜 비교로 스타일 적용
const isCurrentDay = isSameDay(currentDate, selectedDate);
const isTodayDate = isToday(currentDate);
```

## ⚠️ 주의사항 및 베스트 프랙티스

### **1. Tree-shaking을 위한 Import 방식**

```typescript
// ✅ 올바른 방법: Named import
import { format, addDays } from 'date-fns';

// ❌ 잘못된 방법: Default import (전체 라이브러리 포함)
import dateFns from 'date-fns';

// ❌ 잘못된 방법: Namespace import
import * as dateFns from 'date-fns';
```

### **2. 타임존 처리**

```typescript
import { format, formatInTimeZone } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'; // 별도 패키지 필요

// 기본 date-fns는 로컬 타임존 사용
format(new Date(), 'yyyy-MM-dd HH:mm:ss'); // 로컬 시간

// 특정 타임존이 필요하면 date-fns-tz 사용
// npm install date-fns-tz
```

### **3. 불변성 유지**

```typescript
// ✅ 올바른 방법: 새 객체 반환
const newDate = addDays(originalDate, 5);

// ❌ 잘못된 방법: 원본 변경
originalDate.setDate(originalDate.getDate() + 5);
```

### **4. 날짜 비교 시 시간 부분 주의**

```typescript
import { isSameDay, isEqual } from 'date-fns';

const date1 = new Date(2024, 9, 18, 10, 0, 0); // 10:00:00
const date2 = new Date(2024, 9, 18, 15, 0, 0); // 15:00:00

// 같은 날짜지만 시간이 다름
isSameDay(date1, date2);  // true (시간 무시)
isEqual(date1, date2);    // false (시간 포함)
```

### **5. 성능 최적화**

```typescript
// ✅ 한 번만 계산하고 재사용
const weekStart = useMemo(() =>
  startOfWeek(currentDate, { weekStartsOn: 1 }),
  [currentDate]
);

// ❌ 매 렌더링마다 계산
const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
```

### **6. 국제화 (i18n)**

```typescript
import { format } from 'date-fns';
import { ko, enUS, ja } from 'date-fns/locale';

// 한국어
format(new Date(), 'PPPP', { locale: ko });
// "2024년 10월 18일 금요일"

// 영어
format(new Date(), 'PPPP', { locale: enUS });
// "Friday, October 18th, 2024"

// 일본어
format(new Date(), 'PPPP', { locale: ja });
// "2024年10月18日金曜日"
```

### **7. SSR/SSG 환경에서의 주의사항**

```typescript
// ✅ Next.js에서 안전하게 사용
import { format } from 'date-fns';

// 서버 컴포넌트
export default function ServerComponent() {
  const date = format(new Date(), 'yyyy-MM-dd');
  return <div>{date}</div>;
}

// ⚠️ 클라이언트 컴포넌트 (하이드레이션 불일치 주의)
'use client';
export default function ClientComponent() {
  // 서버와 클라이언트의 시간이 다를 수 있음
  const [currentTime, setCurrentTime] = useState(() => format(new Date(), 'HH:mm:ss'));

  // useEffect로 클라이언트에서만 업데이트
  useEffect(() => {
    setCurrentTime(format(new Date(), 'HH:mm:ss'));
  }, []);

  return <div>{currentTime}</div>;
}
```

## 📚 추가 참고 자료

- [date-fns 공식 문서](https://date-fns.org/)
- [date-fns GitHub](https://github.com/date-fns/date-fns)
- [date-fns Format 토큰 참고](https://date-fns.org/docs/format)
- [date-fns Locale 목록](https://date-fns.org/docs/I18n)

## 🔄 마이그레이션 가이드

### **Moment.js에서 date-fns로 마이그레이션**

```typescript
// Moment.js
import moment from 'moment';
moment().format('YYYY-MM-DD');
moment().add(7, 'days');
moment().startOf('week');

// date-fns
import { format, addDays, startOfWeek } from 'date-fns';
format(new Date(), 'yyyy-MM-dd');
addDays(new Date(), 7);
startOfWeek(new Date());
```

### **Day.js에서 date-fns로 마이그레이션**

```typescript
// Day.js
import dayjs from 'dayjs';
dayjs().format('YYYY-MM-DD');
dayjs().add(7, 'day');
dayjs().startOf('week');

// date-fns
import { format, addDays, startOfWeek } from 'date-fns';
format(new Date(), 'yyyy-MM-dd');
addDays(new Date(), 7);
startOfWeek(new Date());
```

---

**작성일**: 2024-10-18
**date-fns 버전**: 4.1.0
**프로젝트**: J's Planner (Next.js 15.4.6 + TypeScript)
