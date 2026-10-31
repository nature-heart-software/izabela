# Experimental Game Overlay

The Experimental backend uses the pinned `electron-game-overlay` **0.1.0-rc.7**
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

The experiment uses the SDK's public `OverlayTargetWatcher` with
`createOverlayProcessPolicy`. User and database allow/deny rules are combined
into one serializable `earlyPolicy`, checked natively before injection. Folder
rules use this same path; Izabela does not expand executable names, enumerate game
installations, add implicit executable exclusions, or use an exact-PID fallback.
Deny wins over allow. Removing a redundant executable rule leaves an active game
authorized when a remaining folder rule still allows it. Genuine revocation
releases overlay input and suppresses its scene without claiming to unload DLLs.

### Candidate limits and policy grammar

rc.7 retains the unresolved fast-start timing limitation. It is not accepted as
reliable fast-start support.
Its native future-process polling can still lose the graphics-startup race,
including with folder rules. Watcher readiness means armed, not attached; an
injector success message does not establish a live rendered overlay. Close games
before starting Izabela. Failed or uncertain live targets are never retried.

The SDK owns identity checks, successor watchers, exit retirement, cancellation
and authorization retention. Izabela passes only configured rules, with no
hardcoded game or helper names. Both user and database policy edits call its
`update()`; an empty allow policy authorizes no new targets. The SDK's bounded
grammar supports full Windows paths or a `**/` prefix, component `*` and `?`,
and whole-component `**`. Deny rules share that grammar. Extglobs, braces,
classes and malformed/relative patterns are rejected, not silently broadened.
See the upstream source snapshot's `doc/sdk-rc7-discovery-policy.md` for policy
retention semantics and `doc/sdk-rc6-process-policy.md` for the native grammar and
remaining timing restrictions. If the SDK cannot safely replace discovery, its
`discovery-blocked` event is logged without cancelling an authorized live overlay.
A resolved policy update does not by itself prove that new discovery is armed.

Izabela applies no SDK JavaScript or native patches. Native policy attachment
remains exclusive across applications. Runtime generation 7 changes require
fresh game processes; running older injected runtimes are never replaced.
Warnings retain SDK classifications and startup status without discovery data.

### rc.7 consumer validation

The complete archive SHA-256 is
`dcf989d08a1c2913023c5d5983f080c12307e9fbd01952e630eed532cc040f9d`.
The 81 overlay/package tests, 125 app tests and Electron 46 noninjecting smoke
passed, including all 54 sealed payload hashes. Native coverage passed across all
six graphics/architecture pairs, 125%/150% D3D11, two-launch lifecycle and focus
negative controls. The exact folder → folder plus `**/name.exe` → folder sequence
passed through Izabela's real renderer/store/IPC path, preserving typed glyphs.

The focused no-barrier folder case also passed a fresh relaunch after rule removal,
typing without another click, scrolling/cursors, and genuine denial with actual
pixels removed and OS input returned to the game. This successful sample does not
establish reliable fast startup. Reports and the coverage index are under
`coverage/experimental-overlay/rc7-validation.json`.

The initial matrix retained one harness failure: it expected a final interception
ack after target admission was revoked. The focused rerun instead verifies actual
native key delivery and removed overlay pixels; both passed even though the last
observed ack remained true. The initial report remains preserved. No SDK workaround
or hardcoded executable policy was added.

### Historical rc.6 consumer trial

The pinned archive SHA-256 is
`baed10ac3c41709a155a35aacb62ee50b338a831618527cc3aaf353f83604ba2`.
The 80 overlay/package tests, 125 app tests and noninjecting Electron 46 smoke
passed, including all 54 sealed payload hashes. Native rendering, first-key input,
cursor and scrolling checks passed on D3D9/10 x86+x64, D3D12 x64 and D3D11 x64 at
125%/150%. A focused D3D11 relaunch case and its focus negative control passed.

The exact basename-glob removal remains a failing native regression. Starting
from an allowed folder, adding then removing `**/name.exe` throws
`A cancelled or uncertain selector remains reserved until authoritative exit; active policy was cancelled`
and cancels the allowed running target. Both the controlled-start and no-barrier
cases reproduced it after successful first-show/reopen typing and pixel checks.
Evidence is under `coverage/experimental-overlay/e2e/2026-10-31T18-51-14.214Z`
and `2026-10-31T18-51-36.737Z`. An independent matrix run also timed out closing
the D3D11 settings popup; its cause is unproven. rc.6 is not a fully passing
consumer candidate. These failures were preserved and the policy issue reported
upstream; no retry or SDK workaround was added to Izabela.

## Windows Defender exclusions

The Experimental overlay settings include **Add Windows Defender exclusions**.
The main process displays a warning listing the exact rules and defaults to
Cancel. Approval requests an elevated helper; it does not change Izabela's
administrator-startup setting. No rules are added at startup or after cancellation.

Rules cover `inject.exe` and `inject32.exe` in the bundled SDK runtime and direct
launch subfolders of Izabela's and the SDK's shared run roots. Shared rules can
also match injector copies used by other applications. Paths come from the main
process and public SDK discovery APIs; the renderer supplies no paths or commands.
The helper adds missing `ExclusionPath` entries and reads them back before
reporting success, preserving existing exclusions.

Elevation uses the maintained `@vscode/sudo-prompt` package with Node 24 support.
The regression test runs its actual Windows argument validation and command-file
creation, blocking only process launch so it cannot request UAC or change Defender.

Exclusions reduce scanning protection and apply to replacement/future files at
the same paths. They do not establish a Microsoft false-positive determination,
restore quarantined files, or guarantee that behavioral detections stop. Managed
device policy or cancelled administrator approval can prevent configuration.
Review/remove these rules in Windows Security's exclusion settings.
See [Microsoft's exclusion guidance](https://learn.microsoft.com/en-us/defender-endpoint/microsoft-defender-antivirus-exclusions-overview)
and [Add-MpPreference](https://learn.microsoft.com/en-us/powershell/module/defender/add-mppreference).

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
- No anti-cheat or elevated game targets. Existing ReShade installations are not
  overwritten. The optional Defender action changes only the disclosed injector
  path exclusions after user approval; it does not disable antivirus protection.
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
