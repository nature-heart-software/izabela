# Experimental overlay SDK distribution

The working tree uses the complete, unmodified upstream local candidate
`vendor/electron-game-overlay-1.0.1-alpha.2026111002.tgz`.
`@packages/electron-game-overlay` remains the legacy backend. This is an
unpublished SDK candidate pinned directly by Izabela.

- Tarball SHA-256: `34f6e7ccfb71c6309315e6e9cef8fceab9b40763420560e58798a4a420f9aa22`.
- Source base: `cb5acf47e1793f1b0e5ed5e8ebfa5e7f513afe6c`, branch
  `codex/attachment-storage-recovery`, with uncommitted upstream changes.
  The sibling source ZIP, manifest and dirty diff match the hash-bound packaged
  `SDK_PROVENANCE.json`; the separate source-provenance JSON is retained too.
- Native generation: 28, both architectures; explicit capability
  `privateElevatedAuthorization: 2`. Add-on build ID:
  `CCE20935ADD44EF6A5A7973014B2E07F`.
- Packaging verifies all 160 sealed payloads and preserves all 165 package files.
- License: GPL-3.0-only. The complete package, notices and source snapshot remain
  available. Izabela applies no SDK patches or injection retries.

**Run as Administrator** retains its saved preference and original startup
behavior. Experimental opt-in does not clear the preference or automatically
relaunch the app at a lower privilege level. Startup regressions enforce this.
Izabela does not call the SDK optional de-elevation API in production.

The SDK now supports an interactive high-integrity consumer with a medium or
high target under the same user and session. A medium consumer cannot authorize
a higher-integrity target. Unknown tokens, different users/sessions and system
contexts fail closed. Native `EGO_TARGET_AUTHORIZATION_V1` telemetry records
`allowed-private-elevated` for the elevated lane.

High consumers use a private runtime stage with explicit user ownership, a
protected access list and high integrity. Both native managers verify its file
identities, single-link code files, expected hashes and security descriptors.
Only two fixed diagnostics files are medium-writable. The elevated target lane
does not scan the shared per-user add-on inventory. No privileged shared broker
or OS security-policy change is required.

The SDK producer passed 697 checks with eight Windows-inapplicable POSIX skips.
An actual high-token public `prepare()` call verified both native architectures,
rejected changed digests and hard-link aliases, preserved the high caller and
removed its unused stage on disposal. This preparation gate was followed by
actual packaged Izabela graphics tests; it is not used as their substitute.

Frozen installation and all 103 consumer/package checks pass. Actual packaged
administrator acceptance passes for x64 high targets, x64 medium targets and
x86 high targets. Each verifies the real app/target tokens, saved administrator
preference, private native authorization, first-key/no-click input, rendered
pixels, cursor/scroll, input release and authoritative private-code retirement.
The full 11-case normal-permission graphics/scaling/rearming matrix passes, as do
actual packaged normal-permission mixed recovery and delayed-loader pairs.
Together with the administrator trials, these cover 21 passing native cases and
25 authenticated graphics lifecycles. All 10 actual packaged cases pass.

An additional administrator mixed-recovery attempt stopped before the
access-refusal fixture became ready: the unchanged upstream owner exited 13 at
its forbidden-open/refusal/resume guard. No SDK failure was reached. That
administrator recovery scenario remains unvalidated; the normal recovery tests
and administrator graphics acceptance are recorded separately. The harness now
reports early fixture exits directly instead of waiting for readiness timeout.

Generation 28 also retains bounded loader readiness, startup-timeout diagnostics
and per-process failure isolation. Earlier failures are preserved: generation 26
refused elevated injectors; generation 27 failed private diagnostics creation
with Windows error 1314. An initial generation-28 high preparation gate caught
files owned by the Administrators group; explicit ownership at creation fixed
that upstream while retaining the strict verification rule.

Exact reports are indexed under `coverage/experimental-overlay/`.
Normal tests share verified staging/registration caches and retain PNG captures
without raw bitmap duplicates. Elevated tests additionally require private code
copies to retire after authoritative target exit. No user games or antivirus
settings are changed by these tests.

## Earlier published nightly validation

- Release: [v1.0.0-nightly.1](https://github.com/Wurielle/electron-game-overlay/releases/tag/v1.0.0-nightly.1).
- Source commit: `cb5acf47e1793f1b0e5ed5e8ebfa5e7f513afe6c`, recorded in the
  packaged `SDK_PROVENANCE.json`. This release replaces the earlier local RC
  tarball and its separate source ZIP/manifest.
- Tarball SHA-256 (verified against the GitHub release asset digest):
  `437526e5da73130e995aabc2e9c890dab0caa6f110016cd409483765dff12871`.
- Native generation: 23; add-on build ID:
  `CCE20935ADD44EF6A5A7973014B2E07F`.
- License: GPL-3.0-only. Both architectures, nested dependency notices and
  `SDK_PROVENANCE.json` are retained. No SDK patches or native rebuild are applied.

The earlier nightly consumer validation after merging `dev` passed 92 overlay/package checks,
127 app checks, seven backdrop checks, helper type checking, the workspace/app
builds, frozen installation and the genuine Electron smoke. All 12 native E2E
cases pass: the full ten-case graphics/scaling/rearming/focus-control matrix and
a separate no-barrier D3D11 positive/control pair. These runs cover
14 authenticated target lifecycles and 330–360-character loaded module paths.
The tests use the public `addonDirectory` option for isolated setup and launch;
production keeps SDK defaults. Exact evidence and retained initial harness
failures are indexed in `coverage/experimental-overlay/nightly1-validation.json`.

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
`apps/app/application-identity.json`. Setup omits `packageRoot`, `addonDirectory`
and the deprecated `storageRoot`:
the SDK resolves its physical installation and the shared per-user ReShade add-on
directory (`AppData/Local/ReShade/Addons`). The SDK owns its registration metadata
in that directory; Izabela does not manage that layout.
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
removing other applications or manually deleting native payloads that a game may
still have mapped.

Only after setup succeeds, the existing watcher receives
`addonPreload: { applicationId: 'com.nhs.izabela' }`. The SDK owns add-on
installation and AddonPath configuration. This affects a newly initialized owned
host; it does
not rescan an existing host or provide a universal early-loading guarantee.

RC.11 fixes registered add-on loading and activation beyond MAX_PATH. The original
deeply nested D3D11 case passes with a 293-character loaded module path; no
production path-shortening or SDK patch is applied. The test-only module inspector
also uses bounded K32 module enumeration and growing path buffers: Toolhelp's
fixed-size path records could not inspect a target after the long DLL loaded and
incorrectly held the graphics startup barrier. The initial RC.11 harness failure
and earlier RC.9/RC.10 SDK failures remain retained in their versioned reports.

RC.12 consumer validation passes all 217 unit/package checks, typecheck and
Electron smoke, plus the complete 10-case native matrix and three separate
no-barrier positive/focus-control pairs (16 of 16 native cases). Those runs cover
20 authenticated target lifecycles with loaded module paths of 292–322 characters.
No Windows 299 error recurred. No native recovery-phase record was emitted, so
these passing consumer samples do not directly demonstrate a 299-to-success
recovery. Exact logs, phase observations and limits are retained in
`coverage/experimental-overlay/rc12-validation.json`.

Consumer checks cover 217 unit/package tests, isolated real-SDK registration,
both-architecture ASAR-unpacked registration, type checking and Electron loading.
The original long-profile positive/negative pair passes, and the complete native
matrix passes 10 of 10 cases: D3D9/10/11/12 x64, D3D9/10 x86, 125%/150% scaling,
exact-path two-launch rearming and the native focus negative control. Each target
records a loaded module path beyond 260 characters with successful inspection.
The RC.11 no-barrier `fast-folder` diagnostic failed preflight with Windows 299;
that failed evidence is preserved. RC.12 adds a 250 ms bounded window for transient
read-only inspection errors on the same retained process handle, before loading
any payload. Persistent failures keep the strict diagnostic/ownership boundary.
This SDK recovery does not retry an indeterminate injection, reopen the process
or change security settings. Izabela adds no recovery delay or retry of its own.
The test runtime isolates both setup and launch configuration in an owned
add-on directory, preserving real per-user registrations. Native tests retain the default
long profiles and check actual loaded module lengths. RC.11 evidence is indexed
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
Passing fresh repeats do not establish the cause of those earlier failures.
RC.12 validation concerns the SDK's read-only startup inspection behavior.

Attach before graphics initialization. Managed watcher readiness is not a
universal fast-start guarantee; generic late D3D12 recovery remains unsupported.
The upstream unexplained initial packaged DX12 click timeout and historical
unattributed D3D11 GPU hang remain known issues. Passing consumer runs do not
establish their cause or resolution.

Defender allowances for an older build do not establish coverage or trust for new
binaries. Graphics tests never modify Defender or request elevation. The separate
elevated-consumer check requires explicit user approval. The existing explicit
in-app exclusions flow remains user initiated; preloading does not add exclusions
or change antivirus protection.
