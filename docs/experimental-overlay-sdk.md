# Experimental overlay SDK distribution

`electron-game-overlay-0.1.0-rc.5.tgz` is the complete, unmodified upstream SDK
candidate used by Izabela's **Experimental Game Overlay**. The scoped workspace
package `@packages/electron-game-overlay` remains the legacy backend.

- Source: `Wurielle/electron-game-overlay`, `feat/sdk-release-candidate`,
  with uncommitted input, scaling and managed API changes based on
  `1ff4baeb5930bb20d6dff0d8e69ca05c8eb8be98`. This base commit does not identify
  the modified candidate; the exact archive is pinned by its checksum below.
- Upstream PR: <https://github.com/Wurielle/electron-game-overlay/pull/2>.
- SHA-256: `3dc4d1af8372061692843d69e05e2fa32f4a76167b70c1219aa71d24feaa3eae`.
- License: GPL-3.0-only; the archive includes runtime third-party notices.

The archive includes both Windows target architectures, 53 sealed broker
payloads, native build stamps and `SDK_PROVENANCE.json`. Its source snapshot ZIP
and per-file source manifest are retained beside the SDK archive and verified
against their provenance hashes. The native add-on build ID is
`1CAEA7482B41451AB31FC2F91B46F2DD`, runtime generation 6. Installation needs
neither a native SDK rebuild nor an expiring Actions artifact download.

Izabela applies no SDK patches and carries no locally rebuilt SDK variant.
Upstream `window.focus()` handles native keyboard focus. `OverlayTargetWatcher`
owns process observation, attachment, readiness, cancellation and rearming;
Izabela supplies policy snapshots. Literal executable paths use the public
exact-path future selector; globally allowed basenames can use name-only prearming.
`createReShadeLaunchConfig()` discovers packaged runtimes automatically, and
the Node-only `createOverlayAfterPack()` preserves and verifies the SDK in
electron-builder output. rc.5's native runtime bytes are unchanged from rc.4.

The SDK's Electron peer range explicitly includes the exact
`46.0.0-alpha.2` version used by Izabela, alongside its Electron 39 range. This
remains an RC with game-specific compatibility limits. Older running SDK
coordinators/runtimes retain their negotiated behavior and are not replaced live.

Consumer checks verify the tarball checksum, native payload hashes and build
identities, complete packaging, and actual Electron loading/DOM
focus. Native routing, long-idle attachment and physical-key Gun Frog evidence
were supplied with the upstream release. A consumer DOM smoke alone does not
establish native game input or graphics-hook compatibility.

rc.3 adds vertical/horizontal pointer-wheel routing and negotiated standard
cursor shapes (`window-cursor-v1`). Custom bitmap and unmapped exotic cursors
fall back to arrow. rc.4 separates offscreen raster dimensions from physical
display placement to fix fractional scaling on Electron 46, without resampling
or relabelling frames. Consumer E2E includes actual app rendering, pointer input,
scrolling and native cursor shapes at 100%, 125% and 150% display scale.
