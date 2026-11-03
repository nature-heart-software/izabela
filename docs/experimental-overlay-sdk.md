# Experimental overlay SDK distribution

`vendor/electron-game-overlay-0.1.0-rc.11.tgz` is the complete, unmodified upstream
SDK candidate. `@packages/electron-game-overlay` remains the legacy backend.

- Source: `Wurielle/electron-game-overlay`, commit
  `f51777621927ff090d0281ad069b720ed553d589`, branch
  `codex/explore-independent-overlay-instances`, plus the uncommitted upstream
  registered add-on long-path loading and activation fixes. The base commit alone does not identify this candidate;
  its matching source ZIP and manifest identify the exact supplied changes.
- Tarball SHA-256:
  `ddc09fe1b2851469ad057601374320d299fe6cac915731e1859f7db27c5efca6`.
- Matching source ZIP SHA-256:
  `66044d29b286390d05bf061e137c360e0a6aa0263960eb7adf2847e05147ab8d`.
- Source manifest SHA-256:
  `d62a162cacac2c77e247f9013a7e1de6292fdd0f88876cf070285f9e49c2294e`.
- Native generation: 21; add-on build ID:
  `CCE20935ADD44EF6A5A7973014B2E07F`.
- License: GPL-3.0-only. Both architectures, nested dependency notices and
  `SDK_PROVENANCE.json` are retained. No SDK patches or native rebuild are applied.

The SDK uses independent per-app engines and authenticated transports with a shared
ReShade host, rather than selecting a broker version across applications. The
first eligible initialization supplies the host; later apps cannot replace it.
Native modules share the game's address space. The SDK itself requires no
separately packaged Node runtime or broker registration.

Izabela keeps the public owner/session/window and managed target-watcher APIs.
`createOverlayProcessPolicy()` receives configured allow/deny rules without
implicit game/helper exclusions. The SDK owns attachment, cancellation, process
identity and rearming. `show()`, `focus()` and input interception remain the
opening sequence. Hardware acceleration is disabled before Electron readiness.
The deprecated `allowPrereleaseBroker` option is removed from the consumer.

`createReShadeLaunchConfig()` discovers the packaged runtime automatically.
`createOverlayAfterPack()` preserves/verifies the complete SDK outside ASAR before
signing. Consumer checks verify all 154 sealed payloads, both native build stamps,
the source provenance and every packaged SDK file.

Experimental overlay startup explicitly registers the installed add-on through
`electron-game-overlay/preload` before constructing its existing launch config.
The stable identity `com.nhs.izabela` is shared with electron-builder through
`apps/app/application-identity.json`. Setup omits `packageRoot` and `storageRoot`:
the SDK resolves its physical installation and shared per-user cache/registry.
Izabela's userData stores only registration metadata in
`experimental-game-overlay/addon-installation.json`.

Setup is asynchronous and idempotent. An upgrade saves the new registration and
pending obsolete IDs before selectively unregistering old builds. An unchanged
registration ID is retained; interrupted cleanup remains recorded for the next
setup. Failures report their setup stage and stop experimental startup instead
of silently enabling an unregistered launch configuration. Normal shutdown,
disabling the overlay and development reloads do not unregister installed builds.
There is no installer Node hook in this app, so this per-user startup step handles
first-run/update registration; afterPack and CI builds never register the builder.
Saved IDs can also be passed to the SDK's selective uninstall API without
removing other applications or manually deleting immutable payload caches.

Only after setup succeeds, the existing watcher receives
`addonPreload: { applicationId: 'com.nhs.izabela' }`. The SDK owns snapshot copying
and AddonPath configuration. This affects a newly initialized owned host; it does
not rescan an existing host or provide a universal early-loading guarantee.

RC.11 fixes registered add-on loading and activation beyond MAX_PATH. The original
deeply nested D3D11 case passes with a 293-character loaded module path; no
production path-shortening or SDK patch is applied. The test-only module inspector
also uses bounded K32 module enumeration and growing path buffers: Toolhelp's
fixed-size path records could not inspect a target after the long DLL loaded and
incorrectly held the graphics startup barrier. The initial RC.11 harness failure
and earlier RC.9/RC.10 SDK failures remain retained in their versioned reports.

Consumer checks cover 217 unit/package tests, isolated real-SDK registration,
both-architecture ASAR-unpacked registration, type checking and Electron loading.
The original long-profile positive/negative pair passes, and the complete native
matrix passes 10 of 10 cases: D3D9/10/11/12 x64, D3D9/10 x86, 125%/150% scaling,
exact-path two-launch rearming and the native focus negative control. Each target
records a loaded module path beyond 260 characters with successful inspection.
The separate no-barrier `fast-folder` diagnostic failed preflight with the known
Windows 299 error. That is retained separately; its investigation remains paused
and no uncertain live target is retried.
The test runtime isolates both setup and launch configuration in an owned
registry, preserving real per-user registrations. Native tests retain the default
long profiles and check actual loaded module lengths. Current evidence is indexed
in `coverage/experimental-overlay/rc11-validation.json`; earlier preload failures
remain in `preload-integration-validation.json` and `rc10-validation.json` beside it.

Izabela uses the supported Electron `46.0.0-alpha.2`. Native graphics E2E exercises
the real app, Windows input, immediate typing without clicking, wheel scrolling,
system cursor shapes, scaling and target-policy lifecycle. The noninjecting
Electron smoke verifies DOM focus separately and does not prove native routing.

The SDK follows policy revisions through initial readiness, fixing the earlier
RC.8 startup cancellation. No consumer delay or automatic injection retry is used.

Later updates have their own discovery lifetime. An old `armed` event does not
establish readiness for its replacement. The graphics test waits for the real
initial database snapshots, initial readiness and the latest update's current
ready/blockage observations before launching its controlled target. It preserves
the asynchronous startup policy changes and adds no consumer sleeps or retries.

Historical preflight Windows 299 failures remain in `rc9-validation.json`.
Fresh repeats passed both before and after the user disabled real-time Defender
protection; this does not establish causation. That investigation remains paused.

Attach before graphics initialization. Managed watcher readiness is not a
universal fast-start guarantee; generic late D3D12 recovery remains unsupported.
The upstream unexplained initial packaged DX12 click timeout and historical
unattributed D3D11 GPU hang remain known issues. Passing consumer runs do not
establish their cause or resolution.

Defender allowances for an older build do not establish coverage or trust for new
binaries. Tests never modify Defender or request elevation. The existing explicit
in-app exclusions flow remains user initiated; preloading does not add exclusions
or change antivirus protection.
