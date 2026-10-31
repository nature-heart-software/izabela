# Experimental overlay SDK

`electron-game-overlay-0.1.0-rc.2.tgz` is the complete, unmodified upstream SDK
candidate used by Izabela's **Experimental Game Overlay**. The scoped workspace
package `@packages/electron-game-overlay` remains the legacy backend.

- Source: `Wurielle/electron-game-overlay`, commit
  `1ff4baeb5930bb20d6dff0d8e69ca05c8eb8be98`.
- Upstream PR: <https://github.com/Wurielle/electron-game-overlay/pull/2>.
- SHA-256: `810674987dd9911dfd9b58dc307c7399e48306ad7c189acc569524895991032a`.
- License: GPL-3.0-only; the archive includes runtime third-party notices.

The archive includes both Windows target architectures, 49 sealed broker
payloads, native build stamps and `SDK_PROVENANCE.json`. The native add-on build
ID is `B6A6721DEF914B38A040AC08A87F31A2`, runtime generation 4. Installation needs
neither a native SDK rebuild nor an expiring Actions artifact download.

Izabela applies no SDK patches and carries no locally rebuilt SDK variant.
Upstream `window.focus()` handles native keyboard focus, and future-target
watchers stay armed while idle. Process discovery uses the public
`observeOverlayProcesses` API. Literal executable paths use the public exact-path
future selector; globally allowed basenames can use name-only prearming.

The SDK's Electron peer range explicitly includes the exact
`46.0.0-alpha.2` version used by Izabela, alongside its Electron 39 range. This
remains an RC with game-specific compatibility limits. Older running SDK
coordinators/runtimes retain their negotiated behavior and are not replaced live.

Consumer checks verify the tarball checksum, native payload hashes and build
identities, SDK provenance, complete packaging, and actual Electron loading/DOM
focus. Native routing, long-idle attachment and physical-key Gun Frog evidence
were supplied with the upstream release. A consumer DOM smoke alone does not
establish native game input or graphics-hook compatibility.
