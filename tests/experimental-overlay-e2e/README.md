# Native overlay open-and-type regression

This suite runs Izabela's built main bundle, real messenger page, normal
Ctrl+Enter/Escape shortcuts, unmodified SDK, injected graphics runtime and Windows
keyboard and pointer input. It never calls `sendInputEvent` or inserts text into
a DOM field. First-show/reopen typing must pass with zero pointer-downs and no
native focus-owner wait. Later pointer checks deliberately move/click/scroll
through the real messenger controls and settings panel.

```powershell
pnpm test:experimental-overlay:fixtures
pnpm test:experimental-overlay:e2e --build
# Focused iteration using the same real app/native path:
pnpm test:experimental-overlay:e2e --case=d3d11-x64
# One scale, for focused iteration (the default matrix includes all three):
pnpm test:experimental-overlay:e2e --case=d3d11-x64 --scale=1.25
# Also accepts an already-built packaged app:
pnpm test:experimental-overlay:e2e --app-root=apps/app/dist_electron/win-unpacked/resources/app.asar
```

Use Windows with an unlocked interactive desktop, VS 2022 C++ tools, a Windows
SDK, CMake 3.24+, Git, Python 3.11 and the project's Node/pnpm versions. Stop the dev app first
to release port 7070 and its global shortcut. Tests never stop unrelated apps.
Leave the keyboard/mouse alone while the owned graphics windows run. Missing
desktop/graphics support is a test failure, never a successful skip.

The fixture builder fetches SDK commit
`1ff4baeb5930bb20d6dff0d8e69ca05c8eb8be98` into ignored coverage output. It builds
D3D9/10/11/12 x64 and D3D9/10 x86, verifies PE architecture, and records each
executable's SHA-256. It copies only the host EXEs, never the SDK's alternative
test add-on. No SDK checkout elsewhere on the developer's computer is needed.
The native driver is rebuilt if its source hash changes, including when the
graphics host binaries are reused.
The SDK hosts are GPL-3.0-only; their source and license remain with the fixture
build, and the binary artifact includes the license and source revision.

Each case gets a fresh application profile, exact test executable copy, private
broker pipe, runtime staging and logs. Its folder allow rule exercises real
process observation and exact-PID attachment without the exclusive future-name
watcher. The SDK host's startup barrier holds graphics initialization until the
injector has completed; this intentionally removes a graphics-startup timing
race and does not claim universal late attachment to arbitrary games.

Assertions cover:

- The real backend authenticates the exact test PID and receives a render surface.
- Ctrl+Enter opens the overlay; the first OS `a` key immediately after interception
  appears in the real messenger input, with no pointer-down or focus grace delay.
- The actual graphics window contains pixels matching the messenger input and
  newly typed final character, distinct from the pre-open background. This also
  catches frozen compositor frames. Reports include target captures.
- Escape hides/releases input; reopening registers the first `b` key without a click.
- Pointer movement over the actual input and settings button selects the real
  Windows text and hand cursors, rather than merely emitting a Chromium cursor event.
- An OS mouse click opens Izabela's real settings popup. Trusted native wheel
  input scrolls its actual overflow panel down and back up. No DOM click,
  programmatic scrolling or test-only UI is substituted.
- Hiding after pointer use restores the controlled game's original cursor.
- Intercepted typing does not reach the game's input oracle; hidden-overlay input
  returns to the game without altering the messenger draft.
- A negative control replaces only native focus with the old webview-only focus
  behavior. Its first OS key must be lost, proving these tests cross the native
  routing boundary that the DOM smoke deliberately does not exercise.

The default matrix runs all six graphics/architecture pairs at 100% scale, plus
D3D11 x64 at 125% and 150%. Every positive case includes rendering, typing,
pointer/cursor and scrolling assertions; the negative focus control runs once.
Raster comparison uses actual PNG dimensions rather than assuming NativeImage
DIP dimensions are bitmap pixels.

The test-only C++ driver implements keyboard input, pointer movement/clicks,
wheel input, visible system-cursor inspection, owned-window foreground activation,
module inspection and capture. It checks PID/image identity and foreground before
input, and confines pointer operations to the owned host. SDK public-call wrappers in the Electron
test runtime collect observations; only the explicit negative control changes a
focus call. The normal case does not replace backend, renderer or SDK behavior.

Reports and screenshots are under `coverage/experimental-overlay/e2e/<run>/`.
`Native overlay input` builds fixtures on hosted Windows and runs the
full matrix on a Windows desktop runner labelled `graphics-overlay`. This manual
workflow requires that desktop runner; ordinary hosted/headless builds continue
to run the separate unit and Electron DOM checks, not pretend to cover native input.
