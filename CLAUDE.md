# CLAUDE.md

Guidance for Claude working in this repository (the **FE window** of J-planner).

## Start here

1. Read `../j-planner-product/00-working-rules.md` first, then the docs in its README order. For FE work the key ones are
   `03-decisions.md`, `06-screens.md` (has the screen-design canvas link — the canvas is the visual reference),
   `08-api-design.md`, `09-backlog.md` (stories, acceptance criteria, order).
2. Pull before work, commit straight to `main` (D-005), commit only files in this repo.
   The terminal can't use SSH, so pull/push over HTTPS with the token file — exact commands in `00-working-rules.md` §7.
   Never open, print, or copy `awesomedesk/.git-credentials`.
3. This repo's owner is the FE window. Planning docs and API docs are **not** ours:
   - Something the planning doesn't cover → don't decide it; collect questions (options + recommendation) for the PO window.
     If you had to pick something to keep going, mark it "제가 정한 부분 (확인 부탁)".
   - Want an API change → ask the BE window. Follow `08-api-design.md` (it wins over `08-openapi.yaml` if they differ).
4. **Messages between windows = GitHub issues** on `awesomedesk/j-planner-product` (D-087, 00-working-rules.md §0; the old
   artifact dashboard is a read-only record). Use `gh` with `-R awesomedesk/j-planner-product`:
   - Inbox: `gh issue list -R awesomedesk/j-planner-product --label "to:FE" --state open` — at the start and end of work and at each step.
     Read → `gh issue edit <n> --add-label read`; done → `gh issue close <n> --comment "<한 줄 결과>"`; reply on the same topic → `gh issue comment`.
   - New issue: title `[종류] 한 줄 요약`, labels `to:…` + `from:FE` + `kind:info|question|answer|review|result|ask`, body first line `ref: US-xx · D-xxx · 커밋`.
   - Status card: edit only the body of `[창 현황] FE` (#2, labels `kind:status` + `from:FE`, never closed, no `to:`/`read`):
     지금 하는 일 · 다음 일 · 마지막 커밋.
   - **Projects board** (D-089, `../j-planner-product/17-project-board.md`): https://github.com/orgs/awesomedesk/projects/2. At the start/end of
     work and between steps, check it with the inbox. When you edit #2, also set its card fields
     (`gh project item-edit 2 --owner awesomedesk --url <#2 issue url> --field '지금 하는 일' --text '…'`, same for `'다음 일'`) and update the
     story's work card (Status · 담당 창 · related issues). Don't add a card per message; never guess item/field IDs (`gh project item-list`).
     "작업판 확인" means doing the FE work found there, not only summarizing it (#319).
   - **Role inbox** (D-092, view 4, #323): every message issue has **its own card** (one per issue — "no card per message" is only about
     story cards, view 2). Sender links it (`구분=메시지`, `담당 창`=receiver, `수신 상태=미확인`); as receiver, compare your open `to:FE`
     issues with view 4 and link any missing one yourself. Keep `수신 상태` (미확인 → 읽음 with the read label → 처리 중 when you start →
     처리 완료 + `Status=완료` when closed) and `확인 근거` (what/when) in step. A new request or receiver change resets it to 미확인.
     Another window's or 대표님's comment is not FE's receipt.
   - When a story is done, open `[검수 요청] US-xx …` (`to:PO`, `kind:review`) with the commit, what was built and how to check it
     (screenshots at 1440 / 820 / 390px).
   - **Requests and questions for 대표님 go to an issue `to:대표님`, not the chat** (D-084): `kind:question` with options + recommendation
     and how to answer ('댓글에 ①/② 중 하나만'), or `kind:ask` with exact steps. DB work = SQL for Beekeeper Studio (`USE jp;` first,
     children before `users`, a checking `SELECT` last). In the chat, only say the issue number and a one-line summary.
     **Every `to:대표님` issue (any kind) is added to Projects when you open it** (D-092, #319): `gh project item-add 2 --owner awesomedesk
     --url <issue url>`, then `구분=결정` (+ `PO 추천`·`필요 시점`) for important decisions or `구분=메시지` otherwise, plus Status · `담당 창=대표님`.
     Never add a new request as a comment on an issue 대표님 already closed — open a new issue with the original link.
   - Exception: secrets (passwords, tokens, keys) are never written in issues — ask/receive them in the chat. QA e-mails are `qa-…@example.com`.
   - QA accounts you create are deleted by you with the withdraw API (log in → `POST /api/v1/me/reauth` → `DELETE /api/v1/me`, 00 §6).
5. Write user-facing text and comments in Korean, plain words, 해요체 for UI messages.
6. **TDD (user request 2026-09-28)**: every story is test-first. Turn the story's acceptance criteria and the decisions it
   cites (D-xxx, screen ids like MO-01) into failing tests, then implement until green, then refactor. See "Testing" below.

## Commands

- `npm run dev` (test env) / `npm run dev:local` — http://localhost:3000
- `npm test` (Vitest, once) / `npm run test:watch` — run with lint before every commit
- `npm run lint` (= `eslint .`, flat config `eslint.config.mjs`; Next 16 has no `next lint`), `npx tsc --noEmit`, `npm run build`
  (Turbopack, type check) — run before committing. `next build` no longer lints.
- Install with `npm ci` (lockfile). `test/security/supplyChain.test.ts` fails if next < 16.3.6, react ≠ 19.2.x, or the lockfile
  contains a version from `test/security/compromised-packages.txt` (Shai-Hulud 2025-09 … ChainDrop 2026-08, D-060).
- `npm run api:types` — regenerate `types/api/schema.d.ts` from `../j-planner-product/08-openapi.yaml`

## Architecture

- **Layout**: `components/layouts/app/AppShell.tsx` is the responsive frame (D-018). PC header one line (`PcHeader`), mobile header (`MobileHeader`),
  sidebar area (`SidebarArea`, 330px / 360px at ≥1920, closed rail at 768–1023 opening as overlay), fold right panel, mobile + button.
- **Breakpoints** (tailwind `screens`): mobile default, `fold:` 600, `tablet:` 768, `pc:` 1024, `wide:` 1920. JS: `utils/hooks/useMediaQuery.ts`.
- **Theme** (D-024, D-038): `utils/theme/theme_color.ts` holds the 3 palettes and `resolveThemePalette` (dark mode swaps Dark↔Light, Theme1↔Theme3).
  `ThemeProvider` writes CSS variables `--tp-*` from `themeSlice`; defaults are also in `app/globals.css`.
  Use Tailwind `tp-*` colors (`bg-tp-primary`, `text-tp-muted`, `border-tp-line`, …). Fixed colors have names too: `ink` (text on white),
  `sunday`/`saturday` (weekday text), `danger`, `switch-off`. Never write `text-[#…]`. Inline style only for data colors (category/item colors).
- **Buttons**: `components/button/ThemeButton.tsx` — primary / secondary / danger. No white buttons (D-022). Inputs stay white.
- **Dialogs**: `components/dialog/DialogFrame.tsx` — centered at ≥600px, full screen below. Pass `isDirty`; outside click / Esc / close / back /
  cancel all go through one close request and show "작성을 취소할까요?" when dirty (D-037). Buttons inside use `useDialogRequestClose()`.
  Non-frame panels (quick add) reuse `components/dialog/DiscardConfirm.tsx`. Popover placement / scroll-to-reveal: `utils/dom/placement.ts`.
- **API**: `utils/api/client.ts` (`apiClient`, `ApiError`, pure REST + Problem Details, D-031), resource functions in `utils/api/resources/`,
  types in `types/api/index.ts` (never edit `schema.d.ts`). Show failures with `useErrorNotice()` (`utils/hooks`) → `noticeSlice` → `NoticeCenter`.
- **Redux** (`utils/store/store.ts`): `theme`, `notice`, `category` (`selectCategoriesById` for id lookups), `calendar` (viewMode · viewDate ·
  selectedDate · timetableTopMinutes), `schedule` (visible-range schedules; late responses for an old range are ignored; `refreshSchedules()` after
  save/delete). Use `useAppSelector` / `useAppDispatch` from `app/hooks.ts` and the slice selectors.
- **Login (US-34, D-072)**: same origin — `next.config.mjs` rewrites `/api/**` → BE, no CORS. `utils/api/client.ts` sends `X-XSRF-TOKEN`
  (cookie `__Host-XSRF-TOKEN`, `utils/api/csrf.ts`) on every non-GET, refetches `GET /auth/csrf` and retries once on 403 `CSRF_INVALID`,
  and on 401 asks the handler set by `components/auth/RequireLogin` (`setUnauthenticatedHandler`; true = retry once). `RequireLogin`
  wraps app pages: `checkSession` (store `auth`) → not signed in → `/login?next=` (`utils/auth/nextPath` `safeNextPath` = same-site only).
  GET 401 → `/login?next=`; save 401 → `ReloginDialog` over the open form (same account → new CSRF + same request again, other account
  → reload page, cancel/Esc → that save fails). `/login` = `LoginPage` + shared `LoginForm` (429 wait lock). Page moves use
  `utils/navigation` `goTo` (location.replace, mocked in tests). Account menu: `components/auth/account/` (PC header button, mobile ≡ menu bottom).
- **App start** (`app/layout.tsx`): `ServerStatusCheck` (GET /api/v1/health) and `AppDataLoader` (categories).
- **Dependency direction**: `types/`, `utils/` (date, theme, api, store, hooks) never import from `components/`. Features may import `utils/`,
  the store and shared modules (`components/sidebar`, `components/dialog`, …), but not another feature's screens or `layouts/`.
- **Dates**: `utils/date/dateUtils.ts` — `toLocalDate`/`fromLocalDate`, week start, `formatMonthTitle` / `formatDayTitle` / `formatClock`.
  "Now" comes from `useNow()` (`utils/hooks`, refreshes every minute) so today/current-time line follow midnight. View-mode type: `types/calendar.ts`.
- **Calendar** (`components/calendar/`): monthly (US-06), weekly (US-07), daily (US-08).
  - `hooks/useScheduleRange(range)` — fetch the visible range + error notice + `isLoaded` / `loadedSchedules`. Pass a memoized range.
  - `hooks/useTimetableScroll` — D-046 initial position and keeping the viewed time between week↔day (minutes in the store).
  - `hooks/useQuickAddSlot` (`useTimetableQuickAdd`) — empty-slot click (30-min snap) / PC drag-create → `onAddAt(slot)`, draft handle·body drag
    → `onDraftChange(range)` (`hooks/useTimetableDrag`), mobile scroll so the sheet doesn't hide the draft (US-10, D-053). AppShell state: `layouts/app/useQuickAddState`.
  - `common/` — `ScheduleBar` (month), `TimetableBlock`, `DraftBlock` (dashed quick-add block), `AllDayRow` + `AllDayChip`
    (week/day all-day row: spanning bars, 3 lanes + '+n', `layoutAllDayRow`, D-052), `DayListPopover`, `NowLine`, `HourLabels`.
  - Todo blocks (US-15, D-007·019·027): `hooks/useTimetableTodos(range)` → store `todo.scheduled` (`GET /todos?from&to&scheduled=true`,
    category filter), `layoutDayBlocks(schedules, date, hours, todos)` lays out schedules and timed Todos together (a layout has either
    `schedule` or `todo`; Todos repeat every day of their range, past-midnight part shows on the next day), `common/TimetableTodoBlock`
    (stripe + white + item-color border + checkbox; title → `onOpenTodo` prop from AppShell). After saving a Todo call `refreshTodos()`
    (box + timetable); `setTodoCompleted` updates both lists.
  - Mobile day Todo tab agenda (US-17, D-022 · MO-10 ③): `common/DayAgendaList` under the Todo box — schedules + timed Todos of that
    day in time order (`utils/dayAgendaUtils` `dayAgendaItems`), reads what CalendarDaily already fetched (no new request). Slot render
    context has `openSchedule` for it.
  - Unscheduled Todo notice (US-18, PC-03 ⑧ · MO-03 ③): `components/todo/unscheduled/UnscheduledTodoNotice` — reads the day box
    (`useDayTodos`, `unscheduledOpenTodos` = no time + not completed + date in range, so overdue ones are left out), hidden at 0. PC: floating box bottom-right of the timetable,
    title → pick; mobile: bar left of the + button, 1 → pick, more → bottom sheet. AppShell passes it as CalendarDaily
    `timetableNotice` (timetable tab only) and picks via `TodoActions.scheduleTodo` → `TodoFormTarget { mode: 'edit', withTime: true }`
    (form opens with '시간 지정' on, counts as dirty).
  - `utils/calendarUtils.ts` (month grid, which days a schedule shows on, `blockBackground`/`stripeColorOf`, `weekdayTextClass`),
    `utils/timetableUtils.ts` (week range, block layout/overlap columns, initial scroll target, line clamp).
- **Sidebar items**: `components/sidebar/sidebarItems.ts` — sections, default settings order, mobile day tabs, `dayTabBehavior` (D-049).
- **Plugging a feature into the day tabs / sidebar** (one line each, nothing else in shared files):
  `components/layouts/app/dayTabSlots.tsx` (mobile day tab content; only plugged tabs are enabled; `directAddLabel` makes + act directly)
  and `components/layouts/app/sidebarSectionSlots.tsx` (sidebar/fold panel section; draw the head with `header(actions)`).
  Selected tab: store `calendar.mobileDayTab`.
- **Category filter** (US-11): `calendar.categoryFilter` in the store (`null` = 전체, `[]` = nothing). `useScheduleRange` adds it as
  `categoryId` (server-side filter); `[]` skips the request. UI: `components/category/filter/` (PC dropdown applies at once, mobile sheet on '적용').
  Saving into a filtered-out category (D-056): `layouts/app/useHiddenSaveNotice` → `PaperPlane` (save button `[data-save-button]` →
  `[data-category-filter-button]`) → `reveal` prop → `useFilterReveal` (auto open, marked row, 0.4s guard, auto close).
- **Shared form parts**: `components/form/` — `CategorySelect`, `FormParts` (`Field`, `FieldError`, `ColorPicker`, `LaterFeature`),
  `formStyles` (`INPUT_CLASS`), `serverErrors` (`toFormErrors`: VALIDATION_FAILED → per-field errors). Used by schedule and todo forms.
- **Features**: `components/category/` (US-04), `components/todo/` (US-12 form: `TodoFormDialog`, `useTodoForm`, `todoFormUtils`; US-13 box: `box/TodoBox` +
  `useDayTodos` + store `todo` slice, edit opens via `TodoActionsContext` provided by AppShell; US-14 drag reorder: `utils/hooks/useDragReorder`
  + `utils/list/reorder` (`afterId` for `PUT …/position`) + `moveTodo` thunk; D-067 PC sidebar·fold panel show 5 open + '더 보기 n개' (`TodoSection` passes `collapseAfter`, `pickVisibleTodos`/`todoShowTier` pick by priority, shown in server order; collapses again on date change; mobile tab shows all); US-16 지난 미완료: `isOverdueWarning` (server `overdue` and not completed) → red ! + endDate 'n/n 지남' + `danger-line` border, order unchanged), `components/memo/` (US-25, D-055·057·058: `MemoDialog` (PC 메모 창), `MemoTab` + `mobile/MemoEditor` (모바일 메모 탭, 밀어서 삭제
  `SwipeDeleteItem`), `MemoSection` (사이드바 3개, 펼친 자리 `MemoInlineEditor` 자동 저장 `useMemoAutosave` 1초), rules in `utils/memoUtils`;
  plugged in via the two slot files above), `components/schedule/` (US-05 form, US-10 `quick/QuickAddSchedule`;
  AppShell owns the quick-add state and passes `draft` to the timetable). Feature hooks in `components/<feature>/hooks/`,
  pure rules in `components/<feature>/utils/` (keep them pure so they can be tested without React).
- **Dev pages**: `app/dev/*` — for checking features before the real entry points exist. Remove them when the feature is wired into real screens.

## Rules decided so far (quick reference — the source is 03-decisions.md)

- Category names: trim, case- and accent-insensitive duplicates (D-035). `미지정` is gray in lists, fixed at top, cannot be edited;
  on calendar blocks its stripe is theme Theme2 (D-037). New category color may be null → shown as the first of the 6 item colors (D-037).
- Item colors: 6 colors in `components/theme/itemColorOptions.ts`. Schedule/Todo color null → theme Theme2 (D-030).
- New schedule default time: clicked timetable slot → that time; add button → next top of the hour after now, 1 hour (D-037).
- Discard confirm wording "작성을 취소할까요?" [계속 작성] [작성 취소]; a picked new-category color can be tapped again to unselect (D-039).
- Add menu (PC header '추가', mobile + button MO-07): 일정 / Todo / D-Day. Todo·D-Day stay disabled until their forms exist (`addMenuItems.ts`).

## Testing (TDD)

- Vitest 3 + jsdom + Testing Library. Config `vitest.config.mts` (TZ fixed to Asia/Seoul, API base `http://api.test`).
- Tests sit next to the code: `Foo.tsx` → `Foo.test.tsx`, `fooUtils.ts` → `fooUtils.test.ts`.
- `describe`/`it` names are Korean and cite the source: `describe('월간 달력 (US-06)')`, `it('... (D-041)')`.
- Helpers in `test/`: `renderWithStore` (fresh `makeStore()` + `user`), `mockApi({'GET /schedules': () => json(200, [...])})`
  (stubs fetch; `calls(key)` returns method/path/query/body), `problem(status, code, detail)`, `fixtures.ts` (`CATEGORIES`, `schedule()`),
  `seed.ts` (BE-like schedules), `viewport.ts` (`setViewportWidth`, `setResizeHeight` for ResizeObserver).
- Time: `vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true })` + `vi.setSystemTime(...)` **before** `makeStore()`
  (calendar initial state reads today).
- jsdom does not apply Tailwind classes — only JS-driven width differences (`useMediaQuery`) are testable; CSS-only layout is
  checked with the 1440/820/390 screenshots.
- Query by role and accessible name (what the user sees), not by class names.

## Gotchas

- Stack (US-31, D-060): Next 16.3 + React 19.2. React 19 lint (`react-hooks` 7) forbids writing refs during render and
  calling setState synchronously in effects. For "latest value" refs use `useLatest` (`utils/hooks/useLatest.ts`);
  for "reset when a prop changes" compare with the previous value during render (`useState(prev)` pattern), not in an effect.
  `useRef<T>(null)` is `RefObject<T | null>` — take `RefObject<HTMLElement | null>` in hook params.
- Don't name a folder `icon` — the macOS `Icon` rule in `.gitignore` hides it from git. Icons live in `components/icons/`.
- Don't use `next/font/google` — it downloads fonts at build time and fails without network. The font is a `<link>` in `app/layout.tsx` (D-038).
- `.env.*` files are committed. Never put real secrets in them.
- Coding conventions: `CODING_STANDARDS.md`. API client usage: `utils/api/README.md`.
