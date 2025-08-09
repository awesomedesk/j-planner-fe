# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js-based planner application called "J's Planner" built with TypeScript, Redux Toolkit, and Tailwind CSS. The application features a theming system and component-based architecture with a focus on customizable UI components.

## Development Commands

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture

### Redux Store Structure
The application uses Redux Toolkit for state management with two main slices:
- `mainThemeSlice` - Manages theme colors and dark/light mode (`utils/store/slices/mainThemeSlice.ts`)
- `mainMenuSlice` - Controls main menu open/close state (`utils/store/slices/mainMenuSlice.ts`)

The store is configured in `utils/store/store.ts` and provided via `utils/store/provider.tsx`.

### Component Architecture
- **Layout System**: Uses a main layout wrapper (`components/layouts/main/main_layout.tsx`) that includes header, footer, and sliding menu
- **Theme System**: Centralized theming via `components/theme/theme_color.ts` with predefined color themes (green, brown, neutral)
- **Custom Components**: Reusable `AwesomeButton` component with Redux-connected theming

### Path Aliases
The project uses TypeScript path mapping for clean imports:
- `@components/*` → `./components/*`
- `@utils/*` → `./utils/*`
- `@store/*` → `./utils/store/*`
- `@/*` → `./*`

### File Structure
```
app/                    # Next.js app router pages
components/
  ├── button/          # Reusable button components
  ├── calendar/        # Calendar-related components
  ├── layouts/main/    # Main layout components
  └── theme/           # Theme definitions
utils/store/           # Redux store and slices
```

## Key Implementation Details

### Theme Integration
- All UI components should use the Redux theme state via `useSelector(getThemeState)`
- Theme colors are defined in `components/theme/theme_color.ts` with structured color palettes
- Components should support both light/dark modes and multiple color themes

### Component Development
- All interactive components should be client-side (`"use client"` directive)
- Follow existing naming conventions (snake_case for files, PascalCase for components)
- Use Tailwind CSS for styling with dynamic theme integration
- Components should accept props with TypeScript interfaces

### State Management
- Use Redux Toolkit with typed selectors and actions
- Access state via `useSelector` with proper typing (`RootState`)
- Dispatch actions using standard Redux patterns