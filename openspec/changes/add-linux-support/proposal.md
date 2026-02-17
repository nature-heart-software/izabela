## Why

Izabela is currently a Windows-only Electron app, limiting its reach to a single platform. Electron is inherently cross-platform, and much of the app's core functionality (TTS engines, UI, tray, notifications, auto-updater) already works on Linux. Adding Linux support broadens the user base and leverages existing cross-platform capabilities while gating Windows-only features behind platform checks.

## What Changes

- **Fix `npm install` on Linux**: Ensure the monorepo installs cleanly on Linux — handle `"os": ["win32"]` packages (`win-control`, `win-mouse`, `windows-tlist`) that block installation, fix native addon compilation (`native-keymap` needs X11 headers), and resolve any other install-time failures. This must be done first before any code changes.
- **Update README development requirements**: Document Linux-specific system dependencies and any setup differences for developers working on Linux.
- **Platform-gate all Windows-native code**: Guard `koffi.load('user32.dll')`, `win-control`, `win-mouse`, `forcefocus`, `wql-process-monitor`, and `gelectron` imports behind `process.platform === 'win32'` checks so the app doesn't crash on Linux.
- **Game overlay disabled on Linux**: The DX11/DX12 game overlay (`gelectron`, `electron-game-overlay`) has no Linux equivalent and will be unavailable on Linux.
- **Process watcher disabled on Linux**: `wql-process-monitor` (WMI) has no direct Linux equivalent; process watching will be gated to Windows-only initially.
- **Mouse tracking disabled on Linux**: `@packages/win-mouse` uses Windows Raw Input API; Linux mouse tracking will be unavailable initially (or replaced with a cross-platform alternative in a follow-up).
- **Window focus management**: Replace direct `user32.dll` calls with Electron-native or cross-platform alternatives on Linux (e.g., `BrowserWindow.focus()`, `xdotool`).
- **Audio recording**: Make SoX binary path platform-conditional — use bundled `sox.exe` on Windows, system-installed `sox`/`rec` or `arecord` on Linux.
- **Virtual audio cable**: Gate VB-Audio Cable installer behind Windows; document PulseAudio/PipeWire null-sink as the Linux equivalent.
- **Electron builder**: Add Linux targets (`AppImage`, `deb`) to `electron-builder.config.js`; make `extraFiles` platform-conditional to avoid bundling Windows binaries on Linux.
- **CI/CD**: Add `ubuntu-22.04` to the GitHub Actions release matrix; install Linux-specific build dependencies (`libx11-dev`, `libxkbfile-dev`, `libxdo-dev`).
- **Admin restart**: Already gracefully falls back to a no-op on non-Windows; no changes needed initially.

## Capabilities

### New Capabilities

- `linux-platform-support`: Platform detection, platform-gating of Windows-only modules, and Linux-specific configuration (audio, build targets, CI).

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **Native packages**: `win-control`, `win-mouse`, `windows-tlist`, `electron-game-overlay`, `process-watcher` must be conditionally loaded (not imported at top-level on Linux).
- **Build system**: `electron-builder.config.js` gains Linux target config; `extraFiles` must exclude Windows-only binaries on Linux builds.
- **CI/CD**: `.github/workflows/release.yml` needs a Linux runner in the matrix with appropriate system dependencies.
- **Resources**: `resources/sox/` and `resources/vbc/` are Windows-only; Linux builds should not bundle these.
- **Feature parity**: Game overlay, process watching, and raw mouse tracking will be unavailable on Linux in this initial pass. Core functionality (speech synthesis, speech recognition, messenger overlay, tray, notifications) will work.
- **Dependencies**: Linux builds require system packages: `libx11-dev`, `libxkbfile-dev`, `libxdo-dev`, `sox` or `alsa-utils`.
