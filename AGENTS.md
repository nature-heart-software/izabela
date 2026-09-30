# AGENTS.md — Izabela Codebase Guide

## Project Overview

Izabela is a text-to-speech desktop app built with **Electron + Vue 3 + TypeScript**.
It supports multiple TTS engines (Amazon Polly, Google Cloud, Azure, IBM Watson, ElevenLabs, OpenAI, etc.)
and routes audio through virtual audio cables for use in Discord/games.

## Monorepo Structure

Lerna + Nx + npm workspaces. Two workspace roots: `apps/*` and `packages/*`.

```
apps/
  app/           → Main Electron+Vue desktop app ("izabela-next")
  app-server/    → Express server for TTS API proxying
packages/
  animalese/     → Animalese TTS engine
  design-tokens/ → Design token definitions
  electron-bridger/   → Electron IPC bridge utility
  electron-game-overlay/ → Game overlay integration
  electron-pinia/     → Pinia state sync across Electron processes
  electron-postman/   → Electron IPC messaging (forked)
  generate-exports/   → Auto-generate index.ts barrel exports
  icons/         → Icon library
  native-keymap/ → Native keyboard mapping
  node-record-lpcm16/ → Audio recording
  process-watcher/    → Process monitoring
  toolbox/       → Shared utilities (Deferred, debug, object, data)
  ui/            → Vue component library (NvButton, NvCard, etc.)
  vite-plugin-generate-exports/ → Vite plugin wrapper
  win-control/   → Windows window control
  win-mouse/     → Windows mouse events
  windows-tlist/ → Windows task list
```

## Build / Dev / Lint Commands

```bash
# Install dependencies (also runs patch-package via postinstall)
npm install

# Build all packages then the app
npm run build

# Build only shared packages (dependencies)
npm run build:deps          # lerna run build --scope '{@packages/*,@apps/app-server}'

# Build only the main app
npm run build:app           # lerna run build --scope izabela-next

# Production build (type-check then build)
npm run build:prod          # lerna run build:prod (runs vue-tsc then vite build)

# Dev mode (starts Vite + Electron)
npm run dev                 # lerna run dev --scope izabela-next

# Type-check only (no emit, the project's "lint" command)
cd apps/app && npx vue-tsc

# Format code with Prettier
npx prettier --write "**/*.{ts,vue,json,js}"
```

## Testing

**No test framework is configured.** There are no jest/vitest/mocha configs or test files.
Type checking via `vue-tsc` serves as the primary static validation.

## Path Aliases

In `apps/app`:

- `@/*` → `src/*`
- `@root/*` → `apps/app/*`
- `@packages/*` → workspace packages (resolved by npm workspaces)
- `@apps/*` → workspace apps

## Code Style

### Formatting (Prettier — enforced by CI)

- **No semicolons**
- **Single quotes** for strings
- **2-space indentation**
- **Trailing commas** everywhere (`trailingComma: 'all'`)
- **Arrow parens** always present (`arrowParens: 'always'`)
- **LF line endings** (`endOfLine: 'lf'`)

### TypeScript

- Strict mode enabled (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`)
- Target: ESNext, Module: ESNext, ModuleResolution: bundler (app) / Node (packages)
- `const` over `let`/`var` — never use `var`
- Arrow functions preferred; regular `function` only when hoisting is needed
- Use `import.meta.env` for environment variables (Vite convention)

### Imports

```typescript
// 1. External packages first
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// 2. Workspace packages
import { NvButton, NvCard } from '@packages/ui'
import { Deferred } from '@packages/toolbox'

// 3. Path-aliased internal imports
import { useSettingsStore } from '@/features/settings/store'
import { decrypt } from '@/utils/security'

// 4. Relative imports last
import server from './server'
import { handleError } from '../../utils/requests'

// Lodash: always use cherry-picked imports, never import full lodash
import orderBy from 'lodash/orderBy'
import pick from 'lodash/pick'
```

### Naming Conventions

| Element             | Convention      | Example                               |
| ------------------- | --------------- | ------------------------------------- |
| Files/directories   | kebab-case      | `use-confirm-store.ts`, `speech-apis` |
| Vue components      | PascalCase + Nv | `NvMessengerInputBar.vue`             |
| Stores              | use[Name]Store  | `useSettingsStore`, `useSpeechStore`  |
| Functions/variables | camelCase       | `const handleError = (...) => {...}`  |
| Types/interfaces    | PascalCase      | `SpeechCommand`, `ShortcutMessage`    |
| Constants           | UPPER_SNAKE     | `DEFAULT_LANGUAGE_CODE`, `ENGINE_ID`  |
| Packages (internal) | @packages/name  | `@packages/toolbox`                   |
| Apps (internal)     | @apps/name      | `@apps/app-server`                    |

### Vue Components

- Always use `<script lang="ts" setup>` (Composition API only, no Options API)
- File section order: `<template>`, `<style>`, `<script setup>`
- All custom components use `Nv` prefix
- Use `provide`/`inject` for cross-component communication
- Use `@vueuse/core` composables extensively

### Pinia Stores

Use **setup store syntax** with the custom `electron` option:

```typescript
export const useExampleStore = defineStore(
  'example',
  () => {
    const items = ref<Item[]>([])
    const addItem = (item: Item) => {
      items.value.push(item)
    }
    return { items, addItem }
  },
  {
    electron: {
      persisted: true, // Persist to disk
      shared: true, // Share across Electron processes
    },
  },
)
```

### Error Handling

- Wrap risky operations in `try/catch` with `console.error` and graceful fallback
- Server routes use `handleError(res, reason, message, code)` utility
- No custom error classes; rely on native Error and console logging

### Express Server Plugins

Server features are organized as plugins receiving a context:

```typescript
const plugin: Izabela.Server.Plugin = ({ app }) => {
  app.post('/api/tts/engine/action', async (req, res) => {
    try {
      /* ... */ res.status(200).json(result)
    } catch (e: any) {
      handleError(res, 'Internal server error', e.message, 500)
    }
  })
}
export default plugin
```

### Electron IPC Bridge

Uses `@packages/electron-bridger` to register modules accessible from renderer:

```typescript
export const bridgeModules = () =>
  bridge.register([
    ['ElectronDialog', () => electronDialog],
    ['ElectronFilesystem', () => electronFilesystem],
  ])
```

Window interface is augmented via `declare global { interface Window { ... } }`.

## CI/CD

- **Prettier CI**: Auto-formats and commits on PRs (`.github/workflows/prettier.yml`)
- **Tag Release**: Semantic release on push to main/pre-rc/beta/alpha
- **Release Build**: Electron builder on Windows 2022, uploads artifacts on tag push (`v*`)
- **Dependabot**: Weekly npm checks, auto-merge enabled

## Key Architectural Patterns

- **Feature modules**: `apps/app/src/features/` — domain-driven (speech, messages, profiles, etc.)
- **Engine manager factory**: `createEngineManager<E>()` — generic registry for TTS/translation/recognition engines
- **Multi-window Electron**: `apps/app/src/teams/` — separate windows (messenger, overlay, speech-worker, tray)
- **Plugin registration**: Engine plugins auto-discovered via `import.meta.glob` in `plugins/engines.ts`
- **Singleton IIFE modules**: Used for stateful services (e.g., websocket server)
