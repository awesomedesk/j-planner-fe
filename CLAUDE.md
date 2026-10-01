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
4. When a story is done, report "US-xx 완료, 검수 요청" with what was built and how to check it (screenshots at 1440 / 820 / 390px).
5. Write user-facing text and comments in Korean, plain words, 해요체 for UI messages.
6. **TDD (user request 2026-09-28)**: every story is test-first. Turn the story's acceptance criteria and the decisions it
   cites (D-xxx, screen ids like MO-01) into failing tests, then implement until green, then refactor. See "Testing" below.

## Commands

- `npm run dev` (test env) / `npm run dev:local` — http://localhost:3000
- `npm test` (Vitest, once) / `npm run test:watch` — run with lint before every commit
- `npm run lint`, `npm run build` (includes type check) — run before committing
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
  - `common/` — `ScheduleBar` (month), `TimetableBlock`, `DraftBlock` (dashed quick-add block), `AllDayChip`, `NowLine`, `HourLabels`.
  - `utils/calendarUtils.ts` (month grid, which days a schedule shows on, `blockBackground`/`stripeColorOf`, `weekdayTextClass`),
    `utils/timetableUtils.ts` (week range, block layout/overlap columns, initial scroll target, line clamp).
- **Sidebar items**: `components/sidebar/sidebarItems.ts` — sections, default settings order, mobile day tabs (D-049).
- **Category filter** (US-11): `calendar.categoryFilter` in the store (`null` = 전체, `[]` = nothing). `useScheduleRange` adds it as
  `categoryId` (server-side filter); `[]` skips the request. UI: `components/category/filter/` (PC dropdown applies at once, mobile sheet on '적용').
- **Features**: `components/category/` (US-04), `components/schedule/` (US-05 form, US-10 `quick/QuickAddSchedule`;
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

- Don't name a folder `icon` — the macOS `Icon` rule in `.gitignore` hides it from git. Icons live in `components/icons/`.
- Don't use `next/font/google` — it downloads fonts at build time and fails without network. The font is a `<link>` in `app/layout.tsx` (D-038).
- `.env.*` files are committed. Never put real secrets in them.
- Coding conventions: `CODING_STANDARDS.md`. API client usage: `utils/api/README.md`.
