# US-44 FE 화면 보안 점검표 — OWASP Top 10:2025 (FE 범위)

ref: #417 · US-44 · D-060·072·079·093·118·119 · #404 · BE 점검표 product `32-us44-be-api-security-checklist.md`(#398) · 작성 FE 2026-11-26

- 대상: j-planner-fe의 모든 화면(`app/`, `components/`)과 설정(`next.config.mjs`, `env/`, `.env.*`, `package-lock.json`). API 쪽 권한·인증은 BE 32번 점검표가 맡는다.
- 근거 테스트는 FE 저장소 기준 `파일 › 테스트 이름`.
- 표시(32번과 같음): ✅ 막는 장치 + 테스트 있음 · ⚠️ 장치는 있지만 테스트 없음 또는 일부만 · ❌ 빈틈 · 🚧 배포 대기(D-118) · ⚖️ 정책 판단 필요
- 재실행: `nvm use && npm ci && npm test && npm run lint && npx tsc --noEmit && npm run build`. 기준 커밋 2ed1d88: 테스트 1097개 통과, lint·tsc·build 통과.
- 이 문서는 점검만 한다. 빈틈을 고치는 코드는 PO가 본 뒤 따로 정한다 (#417 3번).

## 요약

| # | 위험 (2025) | 상태 | 남은 빈틈 |
|---|---|---|---|
| A01 | 접근 제어 실패 | ✅ | 화면의 로그인 확인은 편의일 뿐이고 실제 권한은 BE(API1·API5) |
| A02 | 보안 설정 오류 | ❌ / 🚧 / ⚖️ | **화면(HTML) 응답에 보안 헤더·CSP가 없음**(메일 링크 화면의 Referrer-Policy만). 쓰지 않는 `NEXT_PUBLIC_*` 자리값이 묶음에 들어감. `X-Powered-By` 켜짐 |
| A03 | 소프트웨어 공급망 실패 | ✅ / ⚠️ / ⚖️ | 운영 의존성 경고 0건. 개발 도구 3건(vitest 5 큰 버전 필요, 실행하지 않음) |
| A04 | 암호화 실패 | ✅ / 🚧 | FE는 비밀값·토큰을 갖지 않음. HTTPS·HSTS는 배포 뒤 |
| A05 | 주입 (XSS 포함) | ✅ / ⚠️ | HTML을 그대로 넣는 곳 0개. 일정 링크는 입력 검사 + React 19 차단이 있지만 그리는 쪽에 http(s) 검사는 없음 |
| A06 | 안전하지 않은 설계 | ✅ | 열린 리다이렉트 막음, 이메일은 주소에 넣지 않음, 둘러보기는 실제 API를 부르지 않음 |
| A07 | 인증 실패 | ✅ | 세션은 HttpOnly 쿠키(FE가 못 읽음), CSRF 헤더, 401 처리 |
| A08 | 소프트웨어·데이터 무결성 실패 | ✅ / ⚠️ | 바깥 스크립트·CDN 없음, 팝업 메시지 출처 검사. 잠금 파일 무결성은 npm ci에 맡김 |
| A09 | 보안 기록·경보 실패 | ✅ / 🚧 | 화면 기록에 본문·개인정보 없음. 화면 오류 수집·경보는 배포 뒤 |
| A10 | 예외 상황 처리 미흡 | ✅ | 오류는 짧은 안내(스택 없음), 서버에 닿지 않을 때 로그인 화면으로 보내지 않음 |

## A01:2025 접근 제어 실패

**어디에**: 달력·내 계정 등 로그인이 필요한 화면, 로그인 뒤 돌아갈 곳.

**막는 장치**
- `components/auth/RequireLogin`: 세션을 확인하기 전에는 앱 화면을 그리지 않고, 로그인하지 않았으면 `/login?next=`로 보낸다. **이것은 화면 편의일 뿐이다.** 데이터는 모두 BE가 세션으로 거른다(BE API1·API5 ✅).
- 화면은 회원 번호(userId)를 보내지 않는다. API 함수(`utils/api/resources/`)는 `{id}`·`{date}`만 쓴다.
- 둘러보기(`/demo`)는 가짜 서버(`demoBackend`)만 쓴다. 실제 계정 메뉴·이메일·`/me` 연결은 보이지 않는다(D-093).

**근거 테스트**
| 확인 | 테스트 |
|---|---|
| 확인 전 앱 화면 안 그림·비로그인이면 /login?next= | `components/auth/RequireLogin.test.tsx` › 확인하는 동안에는 앱 화면을 그리지 않는다 · 로그인 안 한 채 앱 화면을 열면 /login?next=<그 화면> |
| 보던 중 401이면 로그인으로 | 같은 파일 › 보던 중 데이터 요청이 401이면(세션 끝) /login?next=<지금 화면> |
| 둘러보기 계정 항목 숨김 | `components/auth/account/AccountMenu.test.tsx` › 로그인 정보가 없으면(둘러보기) 계정·이메일·내 계정·로그아웃 없이 달력 설정·약관만 (D-093) |
| 둘러보기 쓰기 막음 | `utils/api/demo/demoBackend.test.ts` |

**빈틈**: 없음(FE 범위). 실제 권한 확인은 BE 테스트가 근거다.

## A02:2025 보안 설정 오류

**어디에**: Next 설정(`next.config.mjs`), 화면에 나가는 환경 변수(`NEXT_PUBLIC_*`, `env/config.ts`), 운영 빌드 결과물.

**지금 값**
| 항목 | 지금 | 상태 |
|---|---|---|
| 화면 응답 보안 헤더(CSP·frame-ancestors·nosniff·Referrer-Policy) | `next.config.mjs` `headers()`에는 메일 링크 화면 3개의 `Referrer-Policy: no-referrer`와 글꼴 캐시만 있음. 그 밖의 화면 HTML에는 보안 헤더가 없음 | ❌ |
| API 응답 보안 헤더 | BE가 붙임: nosniff·frame 막기·CSP `default-src 'none'`·Referrer-Policy·`no-store` (BE 32번 API8 ✅) | ✅ (BE) |
| HTTPS·HSTS | 앞단 서버 몫이고 배포 보류 중(D-118) | 🚧 |
| 운영 빌드 소스맵 | `productionBrowserSourceMaps`를 켜지 않음(기본 끔). `npm run build` 뒤 `.next/static`의 `.map` 파일 0개 | ✅ (테스트 없음 ⚠️) |
| `NEXT_PUBLIC_*` 값 | 실제로 쓰는 값은 API 주소·앱 환경·버전·로그 수준 같은 공개값뿐. **`NEXT_PUBLIC_FIREBASE_API_KEY`·`NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY`·`NEXT_PUBLIC_TEST_USER_EMAIL`·`NEXT_PUBLIC_AUTH_DOMAIN`은 화면 코드가 쓰지 않는데 `env/config.ts`에 남아 있어 브라우저 묶음에 들어감.** 값은 모두 실제 키 모양이 아닌 자리값임(Google 키 형식 `AIza…` 아님, 2026-11-26 확인) | ⚠️ |
| `X-Powered-By: Next.js` | `poweredByHeader`를 끄지 않아 기본으로 켜져 있음 | ⚠️ |
| 개발용 화면 `app/(site)/dev/*` | 운영 빌드에도 들어감(API 상태·일정 입력·카테고리 확인 화면). 화면 데이터는 로그인한 본인 API로만 동작 | ⚠️ / ⚖️ |

**보안 헤더·CSP는 누가 맡나 (⚖️ PO 결정 필요)**
- API(`/api/**`) 응답: **BE**가 이미 붙이고 있다(32번 API8).
- 화면 HTML·JS 응답: 지금은 **아무도 붙이지 않는다.** 11 문서 SEC-08(CSP nonce 방식, 처음엔 Report-Only로 시작, `frame-ancestors 'none'`, nosniff, Referrer-Policy)이 아직 화면 쪽에 적용되지 않았다.
- 선택지:
  1. **FE 추천**: FE가 Next 설정으로 화면 응답에 붙인다. `headers()`에 nosniff·`frame-ancestors 'none'`(+ `X-Frame-Options: DENY`)·`Referrer-Policy: strict-origin-when-cross-origin`을 넣고, CSP는 nonce를 만드는 `proxy`(옛 middleware)로 `Content-Security-Policy-Report-Only`부터 시작한다. HSTS는 HTTPS를 끝내는 앞단 서버가 붙인다(🚧).
  2. 앞단 서버(배포 때)가 화면 응답 헤더를 모두 붙인다. 로컬에서는 확인할 수 없고 D-118 보류와 함께 미뤄진다.
- 참고: 바깥 글꼴·스크립트·CDN을 부르지 않으므로(D-038, 글꼴은 `/fonts`) CSP는 `'self'` 위주로 짤 수 있다. 구글 로그인은 같은 주소의 `/api/v1/auth/google`로 이동하므로 화면 쪽 CSP에 구글 주소가 필요 없다.

**근거 테스트**
| 확인 | 테스트 |
|---|---|
| 메일 링크 화면 Referrer 안 보냄 | 없음 ⚠️ (설정만, 11 문서 D-079) |
| 소스맵 없음 | 없음 ⚠️ (빌드 결과를 직접 봄) |

**빈틈**: ❌ 화면 보안 헤더·CSP(위 선택지) · ⚠️ 쓰지 않는 `NEXT_PUBLIC_*` 4개 제거 · ⚠️ `poweredByHeader: false` · ⚠️ 소스맵·헤더를 확인하는 테스트 · ⚖️ 운영 빌드에서 `/dev/*` 빼기.

## A03:2025 소프트웨어 공급망 실패

**어디에**: `package.json`·`package-lock.json`, Node 버전(`.nvmrc`).

**막는 장치**
- `npm ci`(잠금 파일 v3 그대로 설치), Node 26.13.1 고정(D-119), Next 16.4.6, React 19.2.x.
- `test/security/supplyChain.test.ts`가 아래를 확인하고, 하나라도 어기면 테스트가 실패한다.
  - Next 하한선(16.4.5)과 짝 패키지 버전
  - `.nvmrc` 하한선
  - 잠금 파일에 알려진 오염 버전(Shai-Hulud 2025-09 … ChainDrop 2026-08, `test/security/compromised-packages.txt`)이 있는지
- #404 ①(33e27fc): `npm audit fix`를 `--force` 없이 적용. 잠금 파일만 바뀜.

**npm audit (2026-11-26, 33e27fc)**
| | 전체 | `--omit=dev`(운영 경로) |
|---|---|---|
| 수정 전 bc8bca0 | 19 (critical 2 · high 7 · moderate 10) | 1 (high, source-map-js 1.2.1: next → postcss 경로) |
| 수정 후 33e27fc | **3 (critical 2 · moderate 1)** | **0** |

**남은 3건 — vitest 5 큰 버전 올림이 필요 (D-119 경계라 실행하지 않음)**
| 이름 | 심각도 | 사용 경로 | 고칠 수 있는 버전 |
|---|---|---|---|
| vitest 3.2.7 | critical | 직접 devDependency, `npm test`(개발 PC에서만) | vitest 5.1.2 |
| tinypool (vitest 아래) | critical | 테스트 작업자 풀 | vitest 5.1.2 |
| @vitest/mocker (vitest 아래) | moderate | `vi.mock` | vitest 5.1.2 |

선택지와 영향 (PO가 대표님께 여쭐 자료):
1. **지금 vitest 5로 올리기 (FE 추천은 2와 비슷하게 낮은 급함)**
   - 할 일: `vitest`·`@vitest/*`·`vite` 계열을 같이 올려요. `vitest.config.mts`(poolOptions·environment)와 `vi.useFakeTimers`·`vi.mock` 동작 차이를 확인해야 해요.
   - 영향: 테스트 1097개를 다시 돌려 고치는 작업(반나절~하루 예상)이 생겨요. 제품 코드와 브라우저 묶음은 바뀌지 않아요.
2. **배포 준비(D-118 재개) 때 함께 올리기**: 위험이 개발 PC에서 테스트를 돌릴 때만 생겨서(바깥 입력을 받지 않음) 지금은 그대로 두기.
3. **올리지 않고 현재 버전 유지 + 경고 기록만**: 배포 전 점검에서 다시 판단하기.

**근거 테스트**: `test/security/supplyChain.test.ts` › next는 16.x이고 16.4.5 이상 (D-119) · eslint-config-next는 next와 같은 버전 · .nvmrc는 Node 26.13.1 이상 · react · react-dom은 19.2.x로 같은 버전 · lockfile에 오염 버전이 하나도 없다.

**빈틈**: ⚠️ `npm audit` 결과를 자동으로 확인하는 테스트·CI는 없다(수동 실행). ⚖️ vitest 5 결정.

## A04:2025 암호화 실패

**어디에**: 세션·CSRF 값, 비밀번호 입력, 통신.

**막는 장치**
- 세션 쿠키는 `__Host-` + HttpOnly라서 FE 코드가 읽을 수 없다(BE API2). FE가 읽는 쿠키는 CSRF 값(`__Host-XSRF-TOKEN`) 하나뿐이다(`utils/api/csrf.ts`).
- FE는 토큰·비밀번호를 저장하지 않는다(아래 브라우저 저장소 목록). 비밀번호는 입력해서 보낸 뒤 상태에 남기지 않는다.
- API는 같은 주소(`/api/**`, rewrites)로 부르고 `credentials: same-origin`이다. CORS를 열지 않는다.

**근거 테스트**: `utils/api/client.auth.test.ts` › 세션 쿠키가 같이 가도록 credentials는 same-origin · baseURL이 비어 있으면 상대 경로 /api/v1/... 로 부른다.

**빈틈**: 🚧 운영 HTTPS·HSTS(앞단 서버, D-118).

## A05:2025 주입 (XSS 포함)

**어디에**: 사용자가 쓴 글을 그리는 곳 전부. 일정 제목·장소·메모, Todo 제목, D-Day 제목, 일기 본문, 메모 본문, 카테고리 이름, 이름·이메일, 일정 링크(`url`).

**막는 장치**
- **HTML을 그대로 넣는 곳이 0개**예요. `dangerouslySetInnerHTML`·`innerHTML`·`outerHTML`·`insertAdjacentHTML`·`eval`·`new Function`·`document.write`를 `app/`·`components/`·`utils/` 전체에서 검색해 0건이었어요(2026-11-26, 2ed1d88).
- 모든 사용자 글은 React 글자 노드로만 그려서 자동으로 이스케이프돼요. 일기·메모의 줄바꿈은 CSS(`whitespace-pre-line`)로만 보여 줘요.
  - 직접 확인: `<p>{'<img src=x onerror=alert(1)>'}</p>`는 `&lt;img …&gt;` 글자로 나와요.
- 일정 링크(`<a href={schedule.url} target="_blank" rel="noopener noreferrer">`, 월간 막대·시간표·날짜 시트·일간 목록 4곳)는 세 겹으로 막아요.
  1. 입력 검사: `http://`·`https://`로 시작해야 하고 2048자까지예요(`scheduleFormUtils` `isHttpUrl`, 08 SCH-13).
  2. BE도 같은 규칙으로 검사해요(08).
  3. React 19가 `javascript:` 주소를 막는 주소로 바꿔요(대소문자·앞 공백 포함, 2026-11-26 직접 확인).
- 쿼리는 `URLSearchParams`로 만들어요(`utils/api/client.ts`). 경로에 들어가는 값은 숫자 id·`YYYY-MM-DD` 날짜뿐이고, 기기 id는 `encodeURIComponent`를 거쳐요(`meApi.endSession`).

**근거 테스트**
| 확인 | 테스트 |
|---|---|
| 링크는 http(s)만 | `components/schedule/utils/scheduleFormUtils.test.ts` › URL은 http:// 또는 https:// (SCH-13) |
| HTML 주입 지점 없음 | 없음 ⚠️ (검색으로만 확인) |

**빈틈**: ⚠️ HTML 주입 API(`dangerouslySetInnerHTML` 등)와 `localStorage` 사용을 막는 정적 검사가 없어요. 제안: lint 규칙 `react/no-danger`와 `no-restricted-properties`를 켜거나, `test/security/`에 검색 테스트를 추가하기. ⚠️ 그리는 쪽에서는 `url`이 http(s)인지 다시 보지 않아요. React가 `javascript:`는 막지만 `data:`·`vbscript:`는 입력·BE 검사에만 기대요. 제안: 링크를 그리는 4곳에 공통 `safeHttpUrl()`을 두기.

## A06:2025 안전하지 않은 설계

**어디에**: 화면 사이 이동, 로그인 뒤 돌아갈 곳, 화면 사이에 넘기는 값, 둘러보기.

**막는 장치**
- **열린 리다이렉트 막음**: `?next=`는 `utils/auth/nextPath.ts` `safeNextPath`를 지나요. `/`로 시작해야 하고 `//host`·`/\host`를 막고, 출처를 비교하고, 로그인 화면 자신은 받지 않아요. 그 밖에는 달력(`/`)으로 가요. 이 함수를 쓰는 곳은 `LoginPage`와 `GoogleSignupPage`예요. 그 밖의 이동(`goTo`)은 모두 코드에 적힌 고정 경로예요(`/`·`/login`·`/login?error=<코드>`).
  - [달력으로 돌아가기]는 고정 `href="/"`(`MyAccountPage`)예요. 설정 및 계정의 [내 계정]은 고정 `/me`이고, 돌아올 버튼만 메모리에 기억해요(D-117, 주소·저장소에 남기지 않음).
  - 구글 로그인 시작 주소의 `?next=`도 사이트 안 경로만 붙여요.
- **이메일은 주소(URL)에 넣지 않아요**: 같은 탭의 sessionStorage로 넘기고, 다 쓰면 지워요(D-079). 메일 링크 화면은 Referrer를 보내지 않아요.
- **둘러보기**는 실제 회원 API를 부르지 않고, 쓰기는 막아요(D-093).

**브라우저 저장소에 들어가는 값 (전부, 2026-11-26 검색)**
| 저장소 | 키 | 값 | 언제 지우나 |
|---|---|---|---|
| sessionStorage | `jp.auth.email` | 로그인·가입·비밀번호 찾기 화면 사이에 넘기는 이메일 | 받는 화면이 읽은 뒤 바로 |
| sessionStorage | `jp.auth.loginNotice` | 로그인 화면 초록 안내 종류(`verified` 등 낱말) | 읽은 뒤 바로 |
| sessionStorage | `jp.account.googleFlow` | 구글로 떠날 때의 목적(`reauth`·`connect`) | 돌아와서 읽은 뒤 |
| (탈퇴) | — | 탈퇴가 끝나면 `sessionStorage.clear()` | — |
| localStorage | **없음** | — | — |
| 쿠키 | FE가 쓰지 않음, CSRF 쿠키를 읽기만 | — | — |

토큰·비밀번호·일기·메모 본문은 브라우저 저장소에 넣지 않아요. 화면 데이터는 Redux 메모리에만 있고, 새로 고침하면 사라져요.

**근거 테스트**
| 확인 | 테스트 |
|---|---|
| next는 사이트 안 경로만 (`//evil…`·`/\evil…`·`/login` 거절) | `utils/auth/nextPath.test.ts` › 로그인 뒤 갈 곳 ?next= (US-34, D-072: 우리 사이트 안의 경로만) |
| 로그인 화면에서 바깥 next 무시 | `components/auth/LoginPage.test.tsx` › ?next=가 바깥 주소면 무시하고 달력(/)으로 |
| 구글 시작 주소 next | `utils/auth/googleLogin.test.ts` › ?next=는 사이트 안 경로만 붙인다 |
| 이메일은 sessionStorage, 쓰면 지움 | `utils/auth/handoff.test.ts` › 이메일은 주소(URL)가 아니라 sessionStorage로 넘기고, 다 쓰면 지운다 |

**빈틈**: 없음.

## A07:2025 인증 실패

**어디에**: 로그인·가입·다시 로그인 창·로그아웃·모든 기기 로그아웃.

**막는 장치** (규칙은 BE가 맡고 FE는 그대로 따름)
- 모든 쓰기 요청에 `X-XSRF-TOKEN`을 붙여요. 403 `CSRF_INVALID`면 한 번만 다시 받아서 보내요.
- 401이면 보기 요청은 `/login?next=`로 보내요. 저장 요청은 다시 로그인 창을 띄우고, 같은 계정이면 같은 요청을 한 번 더 보내요.
- BE 문구를 그대로 보여 줘서 계정이 있는지 드러내지 않아요. 429 대기 중에는 버튼을 잠그고, 보내는 중에는 두 번 눌러도 한 번만 보내요.
- 로그아웃은 서버 요청이 성공한 뒤에 로그인 화면으로 가요. 모든 기기 로그아웃은 확인 창을 거쳐요.

**근거 테스트**: `utils/api/client.auth.test.ts`(CSRF·401 처리 10개), `components/auth/LoginPage.test.tsx` › 실패하면 BE 문구 한 줄 · 늦추기(429) 중 · 보내는 중에는 [로그인] 잠금, `components/auth/ReloginDialog.test.tsx`, `components/auth/account/AccountMenu.test.tsx` › 로그아웃 → POST /auth/logout(CSRF 헤더) → 로그인 화면.

**빈틈**: 없음 (FE 범위).

## A08:2025 소프트웨어·데이터 무결성 실패

**어디에**: 바깥에서 불러오는 코드, 창 사이 메시지.

**막는 장치**
- 바깥 스크립트·CDN·분석 도구·바깥 글꼴을 부르지 않아요(`next/font/google` 금지, 글꼴은 `/fonts`, D-038).
- 구글 팝업 결과 메시지는 **같은 출처이면서 그 팝업에서 온 것만** 받아요(`event.origin === location.origin && event.source === popup`). 보낼 때도 받는 쪽을 같은 출처로 정해요.
- 일정 링크는 `rel="noopener noreferrer"`로 열어요.

**근거 테스트**: `utils/auth/googleLogin.test.ts` › 다른 사이트·다른 창에서 온 메시지는 무시한다.

**빈틈**: ⚠️ 바깥 리소스를 부르지 않는지 확인하는 자동 검사는 없어요. CSP가 생기면 그것이 막는 장치가 돼요(A02).

## A09:2025 보안 기록·경보 실패

**어디에**: 화면 쪽 기록(`utils/logger`).

**막는 장치**
- API 오류 기록에는 `status`·`code`·`instance`만 남겨요(`utils/api/client.ts`). 요청·응답 본문(일기·메모·비밀번호)은 남기지 않아요.
- 테스트와 운영의 로그 수준은 `NEXT_PUBLIC_LOG_LEVEL`로 정해요.
- 보안 사건 기록(로그인 실패·정지 등)은 BE 감사 기록이 맡아요(32번).

**근거 테스트**: 없음 ⚠️ (기록 내용을 확인하는 테스트 없음).

**빈틈**: 🚧 화면 오류 수집·경보(배포 뒤 도구 결정, ⚖️).

## A10:2025 예외 상황 처리 미흡

**어디에**: API 실패, 서버에 닿지 않음, 알 수 없는 오류.

**막는 장치**
- 오류는 Problem Details의 짧은 문구로만 보여 줘요. 스택이나 내부 값은 보이지 않아요. 모르는 오류는 기본 문구예요(`useErrorNotice` → `NoticeCenter`).
- 서버에 닿지 않으면 로그인 화면으로 보내지 않고 안내와 [다시 시도]를 보여 줘요. 상태 확인은 `ServerStatusCheck`가 해요.
- 저장이 실패하면 입력을 그대로 두고 창 안에 오류를 보여 줘요(D-079). 순서 이동이 실패하면 원래대로 되돌리고 안내해요.
- 화면 단위 오류 경계는 `app/error.tsx`예요.

**근거 테스트**: `utils/api/client.test.ts` › Problem Details가 아닌 오류는 UNKNOWN_ERROR + 기본 문구 · 화면 문구: ApiError면 그 메시지, 아니면 기본 문구, `components/auth/RequireLogin.test.tsx` › 서버에 닿지 않으면 로그인 화면으로 보내지 않고 안내 + [다시 시도].

**빈틈**: 없음.

## 다음에 정할 것 (PO)

1. ⚖️ 화면 응답 보안 헤더·CSP를 누가 맡을지(A02). FE 추천은 1번(Next 설정 + CSP Report-Only부터).
2. ⚖️ vitest 5 올림 시기(A03). 선택지 1·2·3.
3. FE가 바로 고칠 수 있는 작은 빈틈. 정해 주시면 TDD로 할게요.
   - 쓰지 않는 `NEXT_PUBLIC_*` 4개 빼기
   - `poweredByHeader: false`
   - HTML 주입·localStorage 금지 정적 검사
   - 링크 그릴 때 `safeHttpUrl()`
   - 소스맵·헤더 확인 테스트
4. ⚖️ 운영 빌드에서 `/dev/*` 화면을 뺄지(A02).
