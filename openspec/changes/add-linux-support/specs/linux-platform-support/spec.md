## ADDED Requirements

### Requirement: Monorepo installs on Linux
The monorepo SHALL complete `npm install` without errors on Linux. Windows-only packages (`win-control`, `@packages/win-mouse`, `@packages/electron-game-overlay`) SHALL be declared as `optionalDependencies` so npm skips them gracefully on unsupported platforms.

#### Scenario: Clean install on Linux
- **WHEN** a developer runs `npm install` on a Linux system with the documented prerequisites installed
- **THEN** the install completes successfully, skipping Windows-only optional packages without error

#### Scenario: Clean install on Windows
- **WHEN** a developer runs `npm install` on a Windows system
- **THEN** the install completes successfully and all packages (including Windows-only ones) are installed

### Requirement: README documents Linux development prerequisites
The root README SHALL list Linux-specific system dependencies and setup instructions alongside the existing Windows requirements.

#### Scenario: Linux prerequisites documented
- **WHEN** a developer reads the README Development section
- **THEN** they find Linux-specific requirements including: `libx11-dev`, `libxkbfile-dev`, `libxdo-dev`, `libasound2-dev`, and system-installed `sox` or `alsa-utils`

### Requirement: App launches on Linux without crashes
The Electron app SHALL start and reach the main window on Linux. All Windows-only native module loads (`koffi.load('user32.dll')`, `win-control`, `win-mouse`, `forcefocus`, `wql-process-monitor`, `gelectron`) SHALL be guarded behind `process.platform === 'win32'` checks so they are never executed on Linux.

#### Scenario: Top-level koffi user32.dll calls are platform-gated
- **WHEN** the app starts on Linux
- **THEN** `koffi.load('user32.dll')` in `electron-messenger-window` and `electron-overlay-window` is NOT executed

#### Scenario: Dynamic requires are platform-gated
- **WHEN** the app runs on Linux
- **THEN** runtime `require()` calls for `win-control` and `@packages/electron-game-overlay` are NOT executed

#### Scenario: Forked child processes are platform-gated
- **WHEN** the app runs on Linux
- **THEN** `fork()` calls for `@packages/win-mouse` and `@packages/process-watcher` are NOT executed

### Requirement: Game overlay is disabled on Linux
The game overlay feature SHALL be unavailable on Linux. The system SHALL NOT attempt to load `gelectron`, `electron-game-overlay`, or `win-control` for overlay purposes on Linux.

#### Scenario: Game overlay skipped on Linux
- **WHEN** the game overlay module initializes on Linux
- **THEN** it SHALL skip initialization and remain inactive without errors

### Requirement: Mouse tracking is disabled on Linux
Raw mouse tracking via `@packages/win-mouse` SHALL be unavailable on Linux. The system SHALL NOT fork the win-mouse child process on Linux.

#### Scenario: Mouse tracking skipped on Linux
- **WHEN** the mouse tracking module initializes on Linux
- **THEN** it SHALL skip initialization and remain inactive without errors

### Requirement: Process watching is disabled on Linux
Process watching via `wql-process-monitor` SHALL be unavailable on Linux. The system SHALL NOT fork the process-watcher child process on Linux.

#### Scenario: Process watching skipped on Linux
- **WHEN** the process watcher module initializes on Linux
- **THEN** it SHALL skip initialization and remain inactive without errors

### Requirement: Window focus uses cross-platform fallback on Linux
On Linux, window focus management SHALL fall back to Electron's built-in `BrowserWindow.focus()` instead of `user32.dll` `SetForegroundWindow` or `forcefocus`.

#### Scenario: Messenger window focus on Linux
- **WHEN** the messenger window needs to be focused on Linux
- **THEN** the system uses Electron's `BrowserWindow.focus()` instead of native Windows APIs

### Requirement: Audio recording uses system SoX on Linux
On Linux, the speech recognition recorder SHALL use the system-installed `rec` or `arecord` binary instead of the bundled `resources/sox/sox.exe`.

#### Scenario: Recording on Linux
- **WHEN** speech recognition starts recording on Linux
- **THEN** it uses the system-installed `rec` binary from PATH (or `arecord` as fallback)

#### Scenario: Recording on Windows
- **WHEN** speech recognition starts recording on Windows
- **THEN** it uses the bundled `resources/sox/sox.exe` binary

### Requirement: Virtual audio cable installation is gated to Windows
The VB-Audio Cable installer SHALL only execute on Windows. On Linux, the feature is not available.

#### Scenario: VBC install skipped on Linux
- **WHEN** the virtual audio cable installation is triggered on Linux
- **THEN** the system SHALL skip installation without errors

### Requirement: Electron builder produces Linux artifacts
The electron-builder configuration SHALL include Linux targets (`AppImage`, `deb`). Windows-only resources (`resources/sox/`, `resources/vbc/`) SHALL NOT be bundled in Linux builds.

#### Scenario: Linux build produces AppImage and deb
- **WHEN** electron-builder runs on a Linux CI runner
- **THEN** it produces both AppImage and deb artifacts

#### Scenario: Linux build excludes Windows resources
- **WHEN** electron-builder produces a Linux build
- **THEN** the `resources/sox/` and `resources/vbc/` directories are NOT included in the output

### Requirement: CI/CD builds for Linux
The GitHub Actions release workflow SHALL include a Linux runner (`ubuntu-22.04`) in its build matrix. The Linux runner SHALL install required system dependencies and produce Linux release artifacts.

#### Scenario: Linux runner in release matrix
- **WHEN** the release workflow runs
- **THEN** it executes on both `windows-2022` and `ubuntu-22.04` runners

#### Scenario: Linux runner installs system dependencies
- **WHEN** the release workflow runs on the Linux runner
- **THEN** it installs `libx11-dev`, `libxkbfile-dev`, `libxdo-dev`, and `libasound2-dev` before building

#### Scenario: MSBuild step skipped on Linux
- **WHEN** the release workflow runs on the Linux runner
- **THEN** the `microsoft/setup-msbuild` step is skipped
