## 1. Fix npm install on Linux

- [ ] 1.1 Move `win-control`, `@packages/win-mouse`, and `@packages/electron-game-overlay` from `dependencies` to `optionalDependencies` in `apps/app/package.json`
- [ ] 1.2 Verify `npm install` completes successfully on Linux with documented prerequisites installed
- [ ] 1.3 Verify `npm install` still works correctly on Windows (optional deps are installed)

## 2. Update README

- [ ] 2.1 Add Linux prerequisites to root README Development section (`libx11-dev`, `libxkbfile-dev`, `libxdo-dev`, `libasound2-dev`, `sox` or `alsa-utils`)
- [ ] 2.2 Document any Linux-specific setup steps or known limitations (Wayland, disabled features)

## 3. Platform-gate top-level koffi/user32.dll calls

- [ ] 3.1 Wrap `koffi.load('user32.dll')` in `electron-messenger-window/index.ts` behind `process.platform === 'win32'` using lazy initialization pattern
- [ ] 3.2 Wrap `koffi.load('user32.dll')` in `electron-overlay-window/index.ts` behind `process.platform === 'win32'` using lazy initialization pattern
- [ ] 3.3 Guard `forcefocus` import in `electron-messenger-window/index.ts` behind platform check; fall back to `BrowserWindow.focus()` on Linux

## 4. Platform-gate dynamic requires and forked processes

- [ ] 4.1 Add `process.platform === 'win32'` guard around `require('win-control')` in `electron-messenger-window/index.ts`
- [ ] 4.2 Add `process.platform === 'win32'` guard around `require('win-control')` and `require('@packages/electron-game-overlay')` in `electron/game-overlay.ts`
- [ ] 4.3 Add `process.platform === 'win32'` guard around `fork(@packages/process-watcher)` in `electron/game-overlay.ts`
- [ ] 4.4 Add `process.platform === 'win32'` guard around `fork(@packages/win-mouse)` in `modules/node-mouse/index.ts`

## 5. Platform-conditional audio recording

- [ ] 5.1 Make SoX binary path platform-conditional in `electron-native-speech-recognition/index.ts` — use bundled `sox.exe` on Windows, system `rec` on Linux
- [ ] 5.2 Gate VB-Audio Cable installer behind `process.platform === 'win32'` in `electron-resources/index.ts`

## 6. Electron builder Linux targets

- [ ] 6.1 Add `linux` block to `electron-builder.config.js` with `AppImage` and `deb` targets
- [ ] 6.2 Make `extraFiles` platform-conditional — exclude `resources/sox/` and `resources/vbc/` from Linux builds using `win.extraFiles` scoping

## 7. CI/CD Linux support

- [ ] 7.1 Add `ubuntu-22.04` to the build matrix in `.github/workflows/release.yml`
- [ ] 7.2 Add conditional step to install Linux system dependencies (`libx11-dev`, `libxkbfile-dev`, `libxdo-dev`, `libasound2-dev`)
- [ ] 7.3 Make `microsoft/setup-msbuild` step conditional on Windows runner only

## 8. Verification

- [ ] 8.1 Verify the app launches on Linux without crashes
- [ ] 8.2 Verify core features work on Linux (TTS, tray, notifications)
- [ ] 8.3 Verify electron-builder produces AppImage and deb artifacts on Linux
