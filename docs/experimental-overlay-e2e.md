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
# Real-app recovery after controlled preflight and runtime failures:
pnpm test:experimental-overlay:e2e --case=d3d11-x64 --scale=1 --target-mode=folder --recovery
# Slow loader startup, before the graphics barrier can execute:
pnpm test:experimental-overlay:e2e --case=d3d11-x64 --scale=1 --target-mode=folder --startup-delay-ms=800
# Fast-start diagnostic: no graphics startup barrier (timing can still fail):
pnpm test:experimental-overlay:e2e --case=d3d11-x64 --scale=1 --target-mode=fast-folder
# Also accepts an already-built packaged app:
pnpm test:experimental-overlay:e2e --app-root=apps/app/dist_electron/win-unpacked/resources/app.asar
# Launch the actual packaged executable with the same isolated test boundary:
pnpm test:experimental-overlay:e2e --case=d3d11-x64 --scale=1 --target-mode=folder --recovery --app-root=apps/app/dist_electron/win-unpacked/resources/app.asar "--app-exe=apps/app/dist_electron/win-unpacked/Izabela Next.exe"
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
SDK transport and logs. Sequential cases reuse the test-owned runtime staging
root under `coverage/experimental-overlay/native-runs`, allowing the SDK to share
verified payloads across profiles without duplicating the full runtime per case.
The test-owned installed add-on registry is shared between sequential cells too,
with a deliberate long path and the normal idempotent registration API.
Its folder-only allow rule exercises the
SDK native allow/deny policy without an executable-name rule. An additional
exact-path case runs two fresh target lifecycles and verifies authoritative
process-incarnation exit and rearming. The normal graphics matrix holds graphics
initialization until the injector completes, isolating rendering/input from
startup timing. The explicit `fast-folder` mode never creates or waits for that
barrier. Its failures remain failures; one successful sample does not establish
reliable fast-start attachment.

The delayed-start case creates only its own checksum-verified D3D11 child
suspended, retains its process and thread handles, and resumes it after the
requested delay (300–5000 ms). The fixture owner confines the child to a
kill-on-close job and records its PID, creation time, actual delay and exit.
The SDK never suspends or resumes a target. This exercises loader readiness
before the graphics barrier can run; successful attachment must preserve the
exact process identity and pass the usual first-key, pixel, pointer and scroll
checks. The default matrix includes an 800 ms delayed-start case.

The explicit `--recovery` case runs the real app and broad folder policy through
A success, an owned B that permits identity queries but refuses injection access,
fresh A while B remains live, then B's authoritative exit while A keeps typing.
It continues through an owned suspended B that reaches the bounded startup
readiness timeout (Windows error 1460) without injection, fresh A,
an owned inert B that times out during runtime initialization, then fresh A.
Each recovered A must render and immediately type using the normal shortcut,
without a click. B's owner retains the process handle it created, verifies that
its child is an exact copy of the inert test executable, and confines cleanup to
that child. The SDK must observe the matching process creation identity and
authoritative exit before the sequential fresh A launches. No user games or
security settings are involved; the controlled failures do not establish the
cause of another machine's failure.

The access-refusal owner and inert target are compiled from two unchanged files
extracted from the installed candidate's source ZIP. Its SHA-256 must match the
packaged `SDK_PROVENANCE.json`; executable hashes are recorded in the fixture
manifest. The owner applies a DACL only to its new child at creation, retains
the original process handle, and confirms exit through its stdout protocol.
Its own executable is outside the allowed folder; only the exact inert child's
path is added to the test allowlist.

Initial database loading still updates the managed SDK watcher during application
startup. The test substitutes only the two database HTTP response bodies with
owned fixture rules, keeping the real fetch, shared store, IPC and policy update
path. Published rules must never authorize attachment to unrelated workstation
processes during tests. Before launching the controlled target, the test waits for both
controlled database snapshots, initial watcher readiness and the latest policy update's
current readiness. It rejects discovery blockage; a historical `armed` event
from a replaced watcher cannot authorize a test launch. No sleep or retry is
added to the production application.

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
  the real settings UI and IPC. It verifies the in-app explanation remains visible
  in the interactive overlay and clicks Cancel using native pointer input.
  Elevation is forbidden and Defender is never changed.
- Intercepted typing does not reach the game's input oracle; hidden-overlay input
  returns to the game without altering the messenger draft.
- A negative control replaces only native focus with the old webview-only focus
  behavior. Its first OS key must be lost, proving these tests cross the native
  routing boundary that the DOM smoke deliberately does not exercise.

The default matrix runs all six graphics/architecture pairs at 100% scale, plus
D3D11 x64 at 125% and 150%, plus D3D11 x64 using the managed early controller.
It also includes the D3D11 x64 delayed-loader regression at 100% scale.
Every positive case includes rendering, typing,
pointer/cursor and scrolling assertions; the negative focus control runs once.
Installed add-on registration and launch configuration use the real SDK with the
same owned test add-on directory. The test's public-import boundary overrides
`addonDirectory` and the shared test runs root; it never registers test builds in the real account directory.
Reports verify setup and runtime use the same stable application identity.
A deliberately deep test add-on directory keeps preload DLL paths beyond 260
characters even with the nightly's shorter shared-directory filenames. The scroll
test locates the real overflow panel by computed overflow and dimensions, so
generated styling classes do not determine test coverage.
The driver enumerates module handles with bounded K32 queries and growing path
buffers; Toolhelp's fixed-size records fail once such a DLL is loaded. Reports
record successful module inspection and actual path lengths for each target
lifecycle, including no-barrier launches.
`nativeInjectionConfirmed` is set only after the authenticated target surface
arrives. Spawning a target, especially without a graphics barrier, does not prove
that injection started or succeeded; failed runs retain the SDK's native phase
and diagnostic records for that distinction.
Raster comparison uses actual PNG dimensions rather than assuming NativeImage
DIP dimensions are bitmap pixels.

The test-only C++ driver implements keyboard input, pointer movement/clicks,
wheel input, visible system-cursor inspection, owned-window foreground activation,
module inspection and capture. It checks PID/image identity and foreground before
input, and confines pointer operations to the owned host. SDK public-call wrappers in the Electron
test runtime collect observations; only the explicit negative control changes a
focus call. The real in-app explanation is cancelled with native input; elevation
is blocked. The normal case does not replace backend, renderer or SDK behavior.

Reports and screenshots are under `coverage/experimental-overlay/e2e/<run>/`.
Only lossless PNG captures are retained; raw bitmap intermediates are removed.
Cleanup waits for the SDK's authoritative target exit and private-image retirement
before closing the app. Each case reports unique runtime allocation by file
identity and fails if private add-on images accumulate after its shutdown.
`Native overlay input` builds fixtures on hosted Windows and runs the
full matrix on a Windows desktop runner labelled `graphics-overlay`. This manual
workflow requires that desktop runner; ordinary hosted/headless builds continue
to run the separate unit and Electron DOM checks, not pretend to cover native input.

The `--app-root=.../app.asar` mode loads the packaged main code, renderer and SDK
in the test Electron host. It does not launch the installed EXE or establish that
`app.isPackaged` is true. Reports record `appIsPackaged` and `executable` so those
boundaries remain explicit. Security prompts from launching a new packaged EXE
can obscure native screen captures and require the user's attention; tests never
approve them or change security settings. The harness blocks elevation at the
OS-shell boundary because production bundles sudo-prompt into its main code.

Adding `--app-exe` launches that actual executable and requires its matching
`resources/app.asar`. A loopback-only Node debugger installs the same isolated
test runtime before production main starts, then disconnects before graphics
testing. The report must confirm `appIsPackaged: true` and the exact executable
path. This exercises the shipped executable and packaged paths while keeping
profiles, add-on registration and security configuration inside the test boundary.

## Explicit elevated-consumer check

From a Windows administrator terminal, run
`pnpm test:experimental-overlay:elevation`. This separate headless check requires
an actually elevated Node caller and uses the installed, unmodified SDK to launch
only its own executable at normal permissions. It verifies the exact child PID
and creation identity, executable hash, session, medium token, literal arguments
and fresh environment. It launches no game and changes no antivirus setting.
Reports use the stable `coverage/experimental-overlay/elevated-consumer*.json`
paths. Running it without elevation fails before creating a replacement.

The regular graphics matrix never requests UAC. This check establishes the real
elevated-to-medium SDK transition; startup unit tests cover Izabela's lock handoff
and persistent setting, while packaged graphics cases verify the normal process's
native token before rendering/input tests.
