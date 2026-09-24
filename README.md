# J's Planner — Frontend (`j-planner-fe`)

MBTI 'J' 성향 사용자를 위한 플래너의 **반응형 웹** 프론트엔드입니다. 하루 계획(Todo를 시간표에 배치)과 한 달 일정 관리를 한곳에서 합니다.

- 기술: Next.js 15 (App Router) · React 18 · TypeScript · Redux Toolkit · Tailwind CSS 3 · date-fns 4
- 서버: [`J-planner-BE`](https://github.com/awesomedesk/J-planner-BE) (REST API)
- **기획은 이 저장소에 없습니다.** 요구사항·결정·화면기획서·API 명세는 [`j-planner-product`](https://github.com/awesomedesk/j-planner-product)(비공개)가 기준입니다. 로컬에서는 `../j-planner-product`

## 지금 상태 (2026-09-25)

| 마일스톤 | 스토리 | 상태 |
|---|---|---|
| M0 기반 | US-01 반응형 틀 · US-02 테마 · US-03 API 연결 | PO 검수 통과 |
| M1 일정 달력 | US-04 카테고리 관리 | 수정 반영 후 재검수 대기 |
| | US-05 일정 추가·수정 | 입력 창만 있음 (달력 연결 전) |

전체 순서와 완료 기준은 `j-planner-product/09-backlog.md`를 봅니다.

## 시작하기

```bash
npm install
npm run dev          # http://localhost:3000
```

- BE 주소는 `.env.local`(로컬) · `.env.test` · `.env.production`의 `NEXT_PUBLIC_API_BASE_URL`에 있습니다. 기본값 `http://localhost:8080`
  - `/api/v1`은 적지 않습니다. API 클라이언트가 붙입니다.
- `npm run dev`는 `test` 환경 설정으로 뜹니다. 로컬 BE에 붙이려면 `npm run dev:local`
- BE가 꺼져 있어도 화면은 뜹니다. 화면 아래에 "서버에 연결할 수 없어요" 안내만 나옵니다.

### 자주 쓰는 명령

| 명령 | 하는 일 |
|---|---|
| `npm run dev` / `dev:local` | 개발 서버 (test / local 환경) |
| `npm run lint` | ESLint |
| `npm run build` | 타입 검사 포함 빌드. 커밋 전에 한 번 |
| `npm run api:types` | API 명세(`../j-planner-product/08-openapi.yaml`)가 바뀌면 타입(`types/api/schema.d.ts`)을 다시 만든다 |

## BE 없이 확인하는 개발용 페이지

실제 화면에 기능이 연결되면 지웁니다.

| 주소 | 확인할 것 |
|---|---|
| `/dev/api-status` | 서버 상태 확인, 404·400 오류 안내, 화면 오류 안내 (US-03) |
| `/dev/categories` | 카테고리 관리 창 (US-04) |
| `/dev/schedule-form` | 일정 추가·수정 창 (US-05) |

## 폴더 구조

```
app/
  layout.tsx            # 글꼴·Redux·테마·안내·서버 상태 확인·앱 데이터 불러오기
  page.tsx              # 첫 화면 (AppShell + 달력 자리)
  error.tsx             # 화면 오류 시 안내 + 다시 시도
  dev/                  # 개발용 확인 페이지
components/
  layouts/app/          # AppShell(반응형 틀), PC·모바일 헤더, 사이드바 자리
  dialog/DialogFrame    # 입력·관리 창 공통 틀 (가운데 창 / 모바일 전체 화면, 작성 취소 확인)
  button/ThemeButton    # 테마색 버튼 (흰 버튼 없음, D-022)
  icons/LineIcon        # 선 아이콘
  theme/                # 테마 색(theme_color.ts), CSS 변수 적용, 항목 색 6가지
  notice/               # 화면 아래 짧은 안내, 서버 상태 확인
  category/             # 카테고리 관리 (OV-04, MO-21)
  schedule/             # 일정 입력 (OV-01, MO-08)
types/api/              # API 타입 (schema.d.ts는 생성 파일, index.ts에서 이름 붙임)
utils/
  api/                  # apiClient, 오류 처리, 리소스별 API 함수 (자세히: utils/api/README.md)
  store/                # Redux store와 slices(theme, notice, category)
  hooks/                # useMediaQuery, useErrorNotice
env/config.ts           # 환경 변수 읽기, logger
```

## 개발할 때 알아 둘 것

- **화면 폭 규칙 (D-018)**: Tailwind `fold:`(600) · `tablet:`(768) · `pc:`(1024) · `wide:`(1920). 기본 스타일이 모바일입니다.
- **테마 색 (D-038)**: 색값을 직접 쓰지 않고 `bg-tp-primary`, `text-tp-muted` 같은 `tp-*` 색을 씁니다. 자세한 규칙은 [CODING_STANDARDS.md](./CODING_STANDARDS.md)의 Styling
- **API**: 화면은 `@utils/api`의 리소스 함수(`categoryApi`, `scheduleApi` …)와 `@/types/api` 타입만 씁니다. 실패는 `useErrorNotice()`로 짧은 안내를 띄웁니다. 자세히: [utils/api/README.md](./utils/api/README.md)
- **입력·관리 창**: `DialogFrame`으로 만들고 `isDirty`를 넘깁니다. 바꾼 것이 있으면 닫을 때 "작성을 취소할까요?"가 뜹니다 (D-037).
- **기획에 없는 동작**은 FE가 정하지 않고 PO 창에 묻습니다. API를 바꾸고 싶으면 BE 창에 요청합니다 (`j-planner-product/00-working-rules.md`).

### 주의

- 폴더 이름을 `icon`으로 짓지 마세요. `.gitignore`의 macOS `Icon` 규칙에 걸려 git에 안 올라갑니다.
- 글꼴을 `next/font/google`로 바꾸지 마세요. 빌드할 때 글꼴을 내려받아서 네트워크가 막힌 곳에서 빌드가 실패합니다 (D-038).
- `.env.*` 파일은 git에 올라가 있습니다. 실제 키·비밀번호는 넣지 마세요.

## 문서

- [CLAUDE.md](./CLAUDE.md) — AI 작업 창(FE 창)용 안내
- [CODING_STANDARDS.md](./CODING_STANDARDS.md) — 코딩 규칙
- [utils/api/README.md](./utils/api/README.md) — API 클라이언트 사용법
