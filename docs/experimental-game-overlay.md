# Experimental Game Overlay

The Experimental backend uses the pinned `electron-game-overlay` **0.1.0-rc.5**
SDK. It is separate from the existing Game Overlay, which continues to use
`@packages/electron-game-overlay`. Both are off by default; enabling one deselects
the other. Existing saved legacy settings do not opt you into the experiment.

## Enable

1. Close the game.
2. In **Settings → Game Overlay**, enable **Experimental Game Overlay**.
3. Review the shared allowlist/denylist. Only newly created matching processes
   are candidates; an already-running game is not attached retroactively.
4. Quit Izabela and reopen it normally, then launch the supported game. Enabling
   the experiment disables **Run as Administrator**; an already-elevated process
   cannot de-elevate itself through an ordinary restart.
5. Use the existing messenger shortcut to show/type in the game overlay. Escape
   and the existing stop-interception action release input and hide it.

Switching backends requires restarting Izabela. There is no automatic fallback
from an uncertain Experimental attachment to the legacy injector. To return to
legacy, stop the game, select the existing **Game Overlay** option, and restart
Izabela before launching it again. The legacy administrator confirmation is
unchanged.

The experiment uses the SDK's public `OverlayTargetWatcher` instead of the
legacy WMI watcher's one-second polling interval. Unity games such as Gun Frog
can create their main graphics surface before that first WMI event arrives;
injecting afterward can succeed without producing an overlay connection. The
managed controller owns process observation, exact creation identity, attachment,
and authoritative exits. Izabela supplies fully authorized early selectors and
an allowlist/denylist predicate for best-effort exact-PID attachment. Attachment warnings include SDK failure
codes and runtime startup status without exposing discovery data.

### Gun Frog and early attachment

Gun Frog can initialize graphics before an exact-PID attachment completes, even
with the native observer. Add the full executable path to the **user allowlist**,
close the game, and restart Izabela before launching it. A literal executable
path that passes both denylists arms the SDK's exact-path future watcher.
Alternatively, `**/Gun Frog.exe` permits that basename in any folder and arms a
name watcher, but requires both user and database denylists to be empty. Folder
globs and database rules alone use observation followed by exact-PID attachment.
Both observer and future watchers baseline existing processes without injecting
them.

Policy edits immediately call the controller's `update()` with a fresh policy
snapshot. Removed selectors/targets are cancelled synchronously. Uncertain or
cancelled selector reservations remain blocked until authoritative exit; an
overlapping re-add can require restarting Izabela before a fresh game launch.
The SDK rearms after confirmed exit and never retries an uncertain injection.
Windows path matching handles backslashes, case differences, and dot directories.

The unchanged upstream SDK keeps future watchers armed indefinitely while idle.
Readiness, post-selection injection and authentication still have bounded
deadlines. Izabela applies no SDK JavaScript or native patches. Prearming is
exclusive; it does not provide the SDK's exact-PID multi-application sharing.

## Keyboard focus

The Experimental backend calls the SDK's `show(); focus(); input.intercept()`
sequence, which selects the native keyboard destination and offscreen web view,
and selects the messenger input directly when it becomes available, including the
first opening. It does not use the invisible fullscreen focus button or move and
click the system cursor. The legacy backend retains its existing workaround.
The renderer uses the backend chosen when its window was created; changing a
setting does not switch focus behavior before a restart.

## Boundary

- Windows x64 host, supported Direct3D 9/10/11/12 games; x86/x64 runtime payloads
  are supplied by the SDK.
- No anti-cheat or elevated game targets. Do not disable security software or
  add antivirus exceptions. Existing ReShade installations are not overwritten.
- Izabela keeps Electron **46.0.0-alpha.2**, an exact prerelease explicitly
  admitted and tested by this SDK candidate. This does not establish support for
  other Electron 40–46 versions or arbitrary games.
- Explicit native focus requires the negotiated `window-focus-v1` capability.
  An older already-running coordinator/runtime retains click-to-focus behavior.
  Exit its clients/targets normally before starting a new game with rc.4; never
  kill an unrelated broker or reinject a live game to enable the capability.
- rc.3 routes both wheel axes and negotiates standard hover cursor shapes through
  `window-cursor-v1`. Custom bitmap cursors fall back to arrow. rc.4 fixes
  fractional-scale offscreen raster handling on Electron 46; native consumer
  E2E covers 100%, 125% and 150% scale.
- Automated SDK-load/DOM checks do not establish real game rendering, native
  input, or attachment compatibility. The noninjecting runtime check explicitly
  forbids broker/process/network startup and records that transport is untested.
- One fullscreen messenger surface is shared across the session's matched games,
  following the SDK-selected render target, as with the existing single messenger
  UI. It is not a separate messenger per game.

## Development checks

```sh
pnpm test:experimental-overlay
pnpm test:app:unit
pnpm test:experimental-overlay:runtime
pnpm test:experimental-overlay:runtime apps/app/dist_electron/win-unpacked/resources/app.asar
pnpm test:experimental-overlay:fixtures
pnpm test:experimental-overlay:e2e --build
```

The first command covers opt-in, exact-PID matching, input/lifecycle and packaging
contracts with controlled OS/SDK boundaries. The runtime commands load the actual
installed SDK under real Electron, verify all sealed broker payloads, construct a
lazy SDK owner/session and type into a genuine offscreen DOM window. They do not
start the SDK transport or inject a game. Windows artifact builds also run the
packaged check and retain its JSON report.

The native E2E suite uses controlled Direct3D 9/10/11/12 hosts built from pinned
SDK source instead of requiring a game installation. It checks the real app's
shortcut-to-native-keyboard path, first typing after opening/reopening, actual
target pixels and input release. It also uses native pointer input to verify
visible text/hand cursor shapes and scrolling in the real settings popup.
The matrix includes 100%, 125% and 150% scale. A negative control must reproduce the original
webview-only focus failure. It requires an interactive Windows graphics desktop;
see [the native E2E guide](experimental-overlay-e2e.md).

Setup uses `createReShadeLaunchConfig()` with only the application's writable
run-directory override; the SDK discovers its runtime in workspace and ASAR
layouts. Packaging uses the Node-only `createOverlayAfterPack()` helper, retaining
the SDK's ASAR unpack pattern. Izabela no longer reconstructs runtime paths or
copies sealed SDK files itself.

The unchanged upstream candidate is stored under `vendor/`; see the
[SDK distribution notes](experimental-overlay-sdk.md) for source provenance,
integrity and licensing. Consumers install the complete SDK
without rebuilding or patching it. Native keyboard focus follows explicit SDK
window focus, including first opening and reopening without a click.
