# Native overlay E2E tests

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
# Exact-path early attachment, including exit and automatic rearming:
pnpm test:experimental-overlay:e2e --case=d3d11-x64 --scale=1 --target-mode=early
# Fast-start diagnostic: no graphics startup barrier (timing can still fail):
pnpm test:experimental-overlay:e2e --case=d3d11-x64 --scale=1 --target-mode=fast-folder
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
broker pipe, runtime staging and logs. Its folder-only allow rule exercises the
SDK native allow/deny policy without an executable-name rule. An additional
exact-path case runs two fresh target lifecycles and verifies authoritative
process-incarnation exit and rearming. The normal graphics matrix holds graphics
initialization until the injector completes, isolating rendering/input from
startup timing. The explicit `fast-folder` mode never creates or waits for that
barrier. Its failures remain failures; one successful sample does not establish
reliable fast-start attachment.

The D3D11 x64 folder case at 100% scale adds then removes a redundant basename
allow rule through the real renderer's shared Pinia store and normal IPC. It
requires the same live target, native keyboard input and actual rendered pixels
to survive removal. It later adds a genuine deny and checks that input returns
to the game and overlay pixels disappear. These controlled policy changes do not
replace the SDK controller or native attachment; keyboard, cursor and wheel
checks still use actual Windows input.

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
- The D3D11 x64 case at 100% scale clicks the Defender exclusions button through
  the real settings UI and IPC. It verifies the main-process warning, default
  cancellation and release of overlay input. The native dialog returns a
  controlled Cancel response; elevation is forbidden and Defender is never changed.
- Intercepted typing does not reach the game's input oracle; hidden-overlay input
  returns to the game without altering the messenger draft.
- A negative control replaces only native focus with the old webview-only focus
  behavior. Its first OS key must be lost, proving these tests cross the native
  routing boundary that the DOM smoke deliberately does not exercise.

The default matrix runs all six graphics/architecture pairs at 100% scale, plus
D3D11 x64 at 125% and 150%, plus D3D11 x64 using the managed early controller.
Every positive case includes rendering, typing,
pointer/cursor and scrolling assertions; the negative focus control runs once.
Raster comparison uses actual PNG dimensions rather than assuming NativeImage
DIP dimensions are bitmap pixels.

The test-only C++ driver implements keyboard input, pointer movement/clicks,
wheel input, visible system-cursor inspection, owned-window foreground activation,
module inspection and capture. It checks PID/image identity and foreground before
input, and confines pointer operations to the owned host. SDK public-call wrappers in the Electron
test runtime collect observations; only the explicit negative control changes a
focus call. Security confirmation and elevation use the controlled boundaries
described above. The normal case does not replace backend, renderer or SDK behavior.

Reports and screenshots are under `coverage/experimental-overlay/e2e/<run>/`.
`Native overlay input` builds fixtures on hosted Windows and runs the
full matrix on a Windows desktop runner labelled `graphics-overlay`. This manual
workflow requires that desktop runner; ordinary hosted/headless builds continue
to run the separate unit and Electron DOM checks, not pretend to cover native input.
