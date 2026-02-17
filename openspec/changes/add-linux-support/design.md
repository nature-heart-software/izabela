## Context

Izabela is a Windows-only Electron speech assistant built as an npm workspaces + Lerna monorepo. The app uses several Windows-specific native modules (`win-control`, `win-mouse`, `koffi` + `user32.dll`, `wql-process-monitor`, `gelectron`) and ships Windows binaries (`sox.exe`, VB-Audio Cable drivers). The codebase has no Linux build targets, no Linux CI runner, and the README only documents Windows development setup.

The work is ordered in three phases: (1) fix `npm install` on Linux, (2) update README with Linux dev requirements, (3) platform-gate Windows-only code and add Linux build/CI support.

## Goals / Non-Goals

**Goals:**
- `npm install` completes successfully on Linux
- README documents Linux development prerequisites
- The app launches and runs core features on Linux (TTS, STT, UI, tray, notifications)
- Linux builds are produced via electron-builder (AppImage, deb)
- CI produces Linux release artifacts alongside Windows ones

**Non-Goals:**
- Game overlay support on Linux (no DX11/DX12 equivalent — disabled)
- Raw mouse tracking on Linux (Windows Raw Input API — disabled)
- Process watching on Linux (WMI-based — disabled)
- Virtual audio cable auto-installation on Linux (manual PulseAudio/PipeWire setup)
- macOS support

## Decisions

### 1. Handling `"os": ["win32"]` packages during install

**Decision**: Move `win-control`, `@packages/win-mouse`, and `@packages/electron-game-overlay` from `dependencies` to `optionalDependencies` in `apps/app/package.json`. Add an `.npmrc` with `omit=[]` (ensure optional deps install when available) so Windows builds still get them.

**Why**: npm respects the `"os"` field and will skip optional dependencies that don't match the current platform without failing the install. Currently these are in `dependencies`, so npm will attempt to install them and `win-control`'s `node-pre-gyp install` script will hard fail on Linux. Making them optional lets npm gracefully skip them on unsupported platforms.

**Alternatives considered**:
- *Add `--ignore-scripts` to npm install*: Too broad — would break other packages needing install scripts (e.g., `native-keymap`).
- *Use `overrides` to stub packages*: Fragile and confusing for contributors.
- *Remove from workspaces on Linux*: npm workspaces doesn't support conditional workspace inclusion.

### 2. Platform-gating top-level `koffi.load('user32.dll')` calls

**Decision**: Wrap the `koffi.load('user32.dll')` and dependent API calls in `process.platform === 'win32'` guards. Use lazy initialization — declare the API objects as `let` variables, initialize them inside a platform-checked block or on first use.

**Why**: Two files (`electron-messenger-window/index.ts` line 37, `electron-overlay-window/index.ts` line 29) call `koffi.load('user32.dll')` at the module top level. This executes immediately on import and will crash on Linux. These are the only **critical crash points** — all other Windows-only modules use dynamic `require()` or `fork()` inside runtime functions.

**Pattern**:
```typescript
let user32Api: { SetForegroundWindow: Function; GetForegroundWindow: Function } | null = null
if (process.platform === 'win32') {
  const koffi = require('koffi')
  const user32 = koffi.load('user32.dll')
  user32Api = {
    SetForegroundWindow: user32.func('bool SetForegroundWindow(void* hWnd)'),
    GetForegroundWindow: user32.func('void* GetForegroundWindow()'),
  }
}
```

### 3. Platform-gating dynamic `require()` and `fork()` calls

**Decision**: Add `process.platform === 'win32'` checks around the existing dynamic `require()` and `fork()` calls for `win-control`, `@packages/electron-game-overlay`, `@packages/win-mouse`, and `@packages/process-watcher`. When on Linux, these features simply won't initialize — the code paths will be no-ops.

**Why**: These are already lazy-loaded at runtime, so they don't crash on import. The guards just need to prevent the call from happening on Linux. This is the simplest approach since these features have no Linux equivalent yet.

**Affected locations**:
- `electron/game-overlay.ts` — `require('win-control')`, `require('@packages/electron-game-overlay')`, `fork(process-watcher)`
- `electron-messenger-window/index.ts` — `require('win-control')`
- `modules/node-mouse/index.ts` — `fork(@packages/win-mouse)`

### 4. Audio recording path

**Decision**: Make the SoX binary path platform-conditional. On Windows, use the bundled `resources/sox/sox.exe`. On Linux, use `rec` (the SoX recording frontend) from the system PATH, or fall back to `arecord`.

**Why**: `node-record-lpcm16` already supports multiple recording programs (`rec`, `sox`, `arecord`). The app currently hardcodes `sox.exe` with a Windows resource path. On Linux, SoX is installed system-wide via package manager.

### 5. Electron builder Linux targets

**Decision**: Add `AppImage` and `deb` as Linux targets in `electron-builder.config.js`. Make `extraFiles` platform-conditional to exclude Windows-only resources (`sox/`, `vbc/`) from Linux builds.

**Why**: AppImage is the most portable Linux format (single-file, no install). Deb covers Debian/Ubuntu users. The `extraFiles: ['./resources/**']` currently bundles Windows binaries into every build.

**Pattern** for platform-conditional extraFiles:
```javascript
extraFiles: [
  {
    from: './resources/sox',
    to: 'resources/sox',
    filter: ['**/*'],
  },
  {
    from: './resources/vbc',
    to: 'resources/vbc',
    filter: ['**/*'],
  },
],
// becomes platform-conditional in the config
```

Electron-builder supports `files` filtering per-platform via the `linux.extraFiles` / `win.extraFiles` override keys.

### 6. CI/CD changes

**Decision**: Add `ubuntu-22.04` to the release workflow's matrix. Conditionally skip `microsoft/setup-msbuild` on Linux. Install Linux system dependencies (`libx11-dev`, `libxkbfile-dev`, `libxdo-dev`, `libasound2-dev`) in a Linux-only step.

**Why**: The current workflow only runs on `windows-2022`. Adding a Linux runner to the matrix produces Linux artifacts alongside Windows ones. System deps are needed for native addon compilation (`native-keymap`).

### 7. `forcefocus` handling

**Decision**: Guard `forcefocus` import behind a platform check. On Linux, fall back to Electron's `BrowserWindow.focus()`.

**Why**: `forcefocus` is a native addon for aggressive window focusing on Windows. On Linux, Electron's built-in focus methods work adequately for the messenger window use case.

## Risks / Trade-offs

- **Reduced feature set on Linux**: Game overlay, mouse tracking, and process watching are disabled. Users on Linux get a degraded experience for gaming-related features. → *Mitigation*: These can be implemented with Linux-native equivalents in follow-up changes. Core speech functionality works.

- **`optionalDependencies` behavior varies across npm versions**: Some npm versions handle optional dependency failure differently. → *Mitigation*: Test with the project's pinned Node 22 / npm version. Add CI validation that `npm install` succeeds on Linux.

- **`native-keymap` build may fail on Linux without system deps**: The package has Linux support (`keyboard_x.cc`) but needs `libx11-dev` and `libxkbfile-dev` at compile time. → *Mitigation*: Document in README; install in CI.

- **Wayland compatibility**: Some Linux features (global key listener, `xdotool`) depend on X11. Wayland users may see issues. → *Mitigation*: Out of scope for initial support. Document as a known limitation.

## Open Questions

- Should the `windows-tlist` package (which appears to be dead code — not actively imported anywhere) be removed entirely, or just left as-is?
