# Experimental Game Overlay

The Experimental backend uses the pinned `electron-game-overlay` **0.1.0-rc.1**
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

## Boundary

- Windows x64 host, supported Direct3D 9/10/11/12 games; x86/x64 runtime payloads
  are supplied by the SDK.
- No anti-cheat or elevated game targets. Do not disable security software or
  add antivirus exceptions. Existing ReShade installations are not overwritten.
- Izabela keeps Electron **46.0.0-alpha.2**, outside the RC SDK's declared
  `>=39.1.0 <40` peer range. The metadata is deliberately unchanged. This branch
  is a compatibility experiment, not a claim of general Electron 46 support.
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
```

The first command covers opt-in, exact-PID matching, input/lifecycle and packaging
contracts with controlled OS/SDK boundaries. The runtime commands load the actual
installed SDK under real Electron, verify all sealed broker payloads, construct a
lazy SDK owner/session and type into a genuine offscreen DOM window. They do not
start the SDK transport or inject a game. Windows artifact builds also run the
packaged check and retain its JSON report.

The unchanged candidate tarball is stored under `vendor/`; see its README for
integrity and licensing. Consumers do not rebuild the EGO native runtime.
