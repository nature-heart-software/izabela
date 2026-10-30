# Experimental overlay SDK

`electron-game-overlay-0.1.0-rc.1.tgz` is the complete, unchanged SDK candidate
used by Izabela's **Experimental Game Overlay**. The existing scoped workspace
package `@packages/electron-game-overlay` remains the legacy backend.

- Candidate source: `Wurielle/electron-game-overlay`, commit
  `a05e8e762e795ef8f352742ea2ebd97a61ae3db5`.
- Distribution: [SDK candidate artifact](https://github.com/Wurielle/electron-game-overlay/actions/runs/41036247354/artifacts/12968084300).
- Tarball SHA-256: `4de4a83186bb80ceabb7242100c8e674f70e653bdc5f7c14c2cdbf3babc0b2ba`.
- License: GPL-3.0-only, with runtime third-party notices included in the package.

The tarball is committed so a clean installation does not depend on an expiring
Actions download, GitHub credentials, an unpublished npm version, or a native
SDK build. Keep its sealed payloads and package metadata intact.

The SDK declares Electron `>=39.1.0 <40`; this experimental Izabela branch retains
Electron `46.0.0-alpha.2`. Package installation does not establish compatibility:
use the branch's Electron/runtime checks and treat real game behavior as
experimental. Do not broaden the SDK peer range or silently downgrade Izabela.
