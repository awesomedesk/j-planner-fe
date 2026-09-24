# CLAUDE.md

Guidance for Claude working in this repository (the **FE window** of J-planner).

## Start here

1. Read `../j-planner-product/00-working-rules.md` first, then the docs in its README order. For FE work the key ones are
   `03-decisions.md`, `06-screens.md` (has the screen-design canvas link — the canvas is the visual reference),
   `08-api-design.md`, `09-backlog.md` (stories, acceptance criteria, order).
2. `git pull` before work. Commit straight to `main` (D-005). Commit only files in this repo.
3. This repo's owner is the FE window. Planning docs and API docs are **not** ours:
   - Something the planning doesn't cover → don't decide it; collect questions (options + recommendation) for the PO window.
     If you had to pick something to keep going, mark it "제가 정한 부분 (확인 부탁)".
   - Want an API change → ask the BE window. Follow `08-api-design.md` (it wins over `08-openapi.yaml` if they differ).
4. When a story is done, report "US-xx 완료, 검수 요청" with what was built and how to check it (screenshots at 1440 / 820 / 390px).
5. Write user-facing text and comments in Korean, plain words, 해요체 for UI messages.

## Commands

- `npm run dev` (test env) / `npm run dev:local` — http://localhost:3000
- `npm run lint`, `npm run build` (includes type check) — run before committing
- `npm run api:types` — regenerate `types/api/schema.d.ts` from `../j-planner-product/08-openapi.yaml`

## Architecture

- **Layout**: `components/layouts/app/AppShell.tsx` is the responsive frame (D-018). PC header one line (`PcHeader`), mobile header (`MobileHeader`),
  sidebar area (`SidebarArea`, 330px / 360px at ≥1920, closed rail at 768–1023 opening as overlay), fold right panel, mobile + button.
- **Breakpoints** (tailwind `screens`): mobile default, `fold:` 600, `tablet:` 768, `pc:` 1024, `wide:` 1920. JS: `utils/hooks/useMediaQuery.ts`.
- **Theme** (D-024, D-038): `components/theme/theme_color.ts` holds the 3 palettes and `resolveThemePalette` (dark mode swaps Dark↔Light, Theme1↔Theme3).
  `ThemeProvider` writes CSS variables `--tp-*` from `themeSlice`; defaults are also in `app/globals.css`.
  Use Tailwind `tp-*` colors (`bg-tp-primary`, `text-tp-muted`, `border-tp-line`, …). Inline style only for data colors (category/item colors).
- **Buttons**: `components/button/ThemeButton.tsx` — primary / secondary / danger. No white buttons (D-022). Inputs stay white.
- **Dialogs**: `components/dialog/DialogFrame.tsx` — centered at ≥600px, full screen below. Pass `isDirty`; outside click / Esc / close / back /
  cancel all go through one close request and show "작성을 취소할까요?" when dirty (D-037). Buttons inside use `useDialogRequestClose()`.
- **API**: `utils/api/client.ts` (`apiClient`, `ApiError`, pure REST + Problem Details, D-031), resource functions in `utils/api/resources/`,
  types in `types/api/index.ts` (never edit `schema.d.ts`). Show failures with `useErrorNotice()` (`utils/hooks`) → `noticeSlice` → `NoticeCenter`.
- **Redux** (`utils/store/store.ts`): `theme`, `notice`, `category`. Use `useAppSelector` / `useAppDispatch` from `app/hooks.ts` and the slice selectors.
- **App start** (`app/layout.tsx`): `ServerStatusCheck` (GET /api/v1/health) and `AppDataLoader` (categories).
- **Features**: `components/category/` (US-04), `components/schedule/` (US-05 form). Feature hooks in `components/<feature>/hooks/`,
  pure rules in `components/<feature>/utils/` (keep them pure so they can be tested without React).
- **Dev pages**: `app/dev/*` — for checking features before the real entry points exist. Remove them when the feature is wired into real screens.

## Rules decided so far (quick reference — the source is 03-decisions.md)

- Category names: trim, case- and accent-insensitive duplicates (D-035). `미지정` is gray in lists, fixed at top, cannot be edited;
  on calendar blocks its stripe is theme Theme2 (D-037). New category color may be null → shown as the first of the 6 item colors (D-037).
- Item colors: 6 colors in `components/theme/itemColorOptions.ts`. Schedule/Todo color null → theme Theme2 (D-030).
- New schedule default time: clicked timetable slot → that time; add button → next top of the hour after now, 1 hour (D-037).

## Gotchas

- Don't name a folder `icon` — the macOS `Icon` rule in `.gitignore` hides it from git. Icons live in `components/icons/`.
- Don't use `next/font/google` — it downloads fonts at build time and fails without network. The font is a `<link>` in `app/layout.tsx` (D-038).
- `.env.*` files are committed. Never put real secrets in them.
- Coding conventions: `CODING_STANDARDS.md`. API client usage: `utils/api/README.md`.
