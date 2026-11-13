# Experimental overlay SDK distribution

The working tree uses the complete, unmodified upstream local compatibility candidate
`vendor/electron-game-overlay-1.0.1-alpha.2026111013.tgz`.
`@packages/electron-game-overlay` remains the legacy backend.

- Tarball SHA-256: `7e911d9c19b753158b88e7cf69224172c326c534df9e7b9492956ba4205eedd4`.
- Source snapshot base: `38efc4c6998844419f0a6a3fb334be187dd512cf`, branch
  `codex/attachment-storage-recovery`. The snapshot and exact dirty diff include
  the completed owned-composition policy, process-exit recovery and native build checks.
  The checkpoint base includes the D3D11 identity correction and private-stage diagnostics.
  The sibling ZIP, manifest and diff match the packaged `SDK_PROVENANCE.json`.
- Native generation is 36 with `privateElevatedAuthorization: 2`.
  Both ReShade hosts and injectors were rebuilt and artifact stamps updated.
  Managers are unchanged from 1012. Feature add-ons remain byte-identical
  to candidate 1008. Add-on build ID: `CCE20935ADD44EF6A5A7973014B2E07F`.
- The complete package has 168 files and 163 sealed payloads. Both architectures,
  GPL-3.0-only notices and exact source provenance are retained.
  Izabela applies no SDK patches or injection retries.

## Deferred D3D11 startup (1013)

After a validated owned initializer encounters a missing backend, successful
D3D11 hook publication on the existing LoadLibrary path can schedule one worker
after releasing the delayed-path mutex. That worker revalidates stage and adapter
readiness before using the existing adoption path. The original try-lock,
notification behavior, foreign-host boundaries and public ABI remain unchanged.
There is no timer, injection retry or first-frame guarantee. Patch SHA-256:
`779d9d41768fe61bc5ff3cf69e2ee11b360dc00b5b58c24e0b1f83552a2d9bb`.

Upstream reports 24 passing production startup cases across both architectures,
including missed HWND and null-HWND composition chains, with four failing 1012
baselines retained. The cohort records 2,744 assertions and 158 GPU readbacks.
The offline suite passes 707 checks with one historical skip. Izabela's 105
consumer checks and packaged SDK/native smoke checks pass. All 18 primary graphics
cases across 19 lifecycles and the supplemental composition pair pass. Actual
PAGER normal/admin first-open and reopen checks pass zero-click typing and native
pixels. Offline Overwatch also passes first-key/native pixels at both permission
levels with injector exit code 0 and Steam's performance HUD visible. The full
Steam panel remains inconclusive: the earlier synthetic Shift+Tab control failed
in the baseline too. This does not establish the cause of the earlier
untraced PAGER timeout or the separate normal Overwatch injector failure.

## Auxiliary window lifetime (1012)

An already observed layered/topmost auxiliary popup can temporarily lose
LAYERED while fading. The SDK remembers that exact HWND lifetime using an
owned property token, process/thread/owner identity and otherwise identical
styles. It does not learn an unseen unlayered tool as an auxiliary window.
The memory is bounded to 256 entries, and identity or shape changes invalidate
the remembered role. Genuine peers and valid-HWND chains keep their existing
behavior. The correction SHA-256 is
`3e80d0d05ca9f383d9e5216034e687b93cc858334b2f61514ade91ef18573e61`.

Both architectures pass 222 lifetime assertions and the retained native gates.
The full offline rerun passes 706 checks with one historical-fixture skip;
the initial cleanup failure remains recorded upstream. Packaged acceptance passes
18 graphics cases across 19 authenticated lifecycles, including administrator
checks, scrolling, cursor shapes, scaling, reopening and the six-transition
composition regression. Actual PAGER passes first-key typing and reopening
without clicking, with native game pixels verified at normal and administrator
permissions while exercising Close-hover behavior.

These positives do not resolve the separately retained normal startup timeout.
The upstream controlled reproduction confirms that concurrent delayed-hook
installation can miss the first device; candidate 1013 addresses that controlled
mechanism, with actual-game acceptance still separate.
The elevated PAGER log also contains a late hidden-tooltip uniqueness rejection,
without an observed surface reset or input loss. That diagnostic is under review.
Steam's missing overlay in actual Overwatch remains unresolved. Candidate 1012
does not change startup-hook ordering or Steam behavior.

Local Steam Overwatch is now available. One offline windowed 1295x728 trial
with an administrator consumer and medium-integrity game passes authenticated
attachment, native overlay pixels and first-key typing without a click. Steam's
performance overlay remains visible. Automated Shift+Tab does not open the full
Steam panel in either the no-consumer baseline or the injected trial, so full
panel compatibility is inconclusive. A separate normal-consumer attempt reports
`injector-failed` before authentication despite subsequent ReShade Present
activity. Matching logs for each lifetime are preserved under
`coverage/overlay-compatibility/overwatch-local/`. No login, online-mode switch,
game setting or protection change was performed.

## Auxiliary window eligibility (1011)

The owned composition-window resolver omits captionless tool popups without
`WS_EX_APPWINDOW` when they refuse activation or combine topmost and layered
styles. This excludes the observed caption tooltip using window properties.
Captioned tools, plain frameless tools, explicit application windows and ordinary
frameless peers remain candidates. Genuine peer ambiguity still fails closed;
the existing valid-HWND path is unchanged.
The correction SHA-256 is
`080da1fd83fe48cb782fa9268b82a386e75be081d107f2a5013f06675107b97f`.

Both native architectures pass 573 assertions across four auxiliary-window
cases and six genuine-peer controls. The offline suite passes 705 checks with
one historical-fixture skip. The initial packaged consumer popup positive/focus-negative
pair passed first-key input, native pixels, four visibility transitions, scrolling
and cursors. Its input driver uses the fixture's independent main HWND and
validates ownership instead of selecting the auxiliary popup.
The expanded regression requires the real tooltip flags without NOACTIVATE and
also removes/restores LAYERED while the overlay is open. It passes with the
corrected paired fixture and SDK candidate 1012 above.

Actual elevated PAGER Close-hover still fails when Windows temporarily removes
`WS_EX_LAYERED` from the tooltip, leaving extended style `0x88`. The resolver
again rejects uniqueness and resets the unchanged main surface. A separate
normal-permission launch loaded ReShade but never authenticated a graphics
runtime. Both failed traces are retained as `1011-*-hover-failure-*` under
`coverage/overlay-compatibility/real-pager/`. This candidate is not accepted for
delivery and does not fix Overwatch's Steam overlay.

## Binding and reset diagnostics (1010)

This candidate adds `EGO_OWNED_COMPOSITION_BINDING_V1` and
`EGO_OWNED_RUNTIME_RESET_V1`, capped at 24 attempts each per native host. The
records distinguish binding rejection from reset call sites and include the
bound HWND, token, visibility and ambiguous candidates. The patch SHA-256 is
`0180a6faceec7fa89174f4ced311a926dc98d292fb114347813f0e29c6b150de`.
All 118 tested binding decisions match candidate 1009 on both architectures,
including when logging fails or its budget is exhausted. This is a diagnostic
build; it does not fix the intermittent PAGER reset or Overwatch's missing
Steam overlay. The packaged elevated PAGER reproduction identifies a Windows
caption tooltip as the second eligible window. While the pointer rests over
Close, `uniqueness-rejected` and `composition-binding-unavailable` recur with
the main HWND and token unchanged. Moving the pointer off the caption stops
the reset; a synchronized reopen passes OS-key typing and native glyph checks
without a click. The failed sample and successful causal control are retained
under `coverage/overlay-compatibility/real-pager/1010-high2-*`. A corrected SDK
and deterministic auxiliary-window graphics regression are pending.

## Owned composition and exit recovery (1009)

For an SDK-owned D3D11 composition chain with no native HWND, the runtime binds
only to a single eligible visible top-level window in the same process. It
refuses ambiguity and stale window lifetimes, preserves deferred resize state,
and leaves valid-HWND chains on their existing path. Reserved SDK-owned INI files
remain immutable on disk while transient runtime settings stay in memory; this
avoids attempting writes from a medium target into a protected elevated stage.
The owned-composition patch SHA-256 is
`7af52928dcaad1914993d2cc29d99862461f1a46af2448a82c7f2c42e87e68cf`.

Public storage recovery now checks an exact process incarnation and its exit
signal before relying on executable-image inspection, which can fail after exit
while another handle keeps the process object alive. Recovery of the retained
PAGER stage retired all 13 reserved payload entries through the public API;
the additional INI stayed unchanged. No permissions were weakened or files
force-deleted. Both architectures pass 87 owned-policy assertions each and the
existing compatibility gates. The 19-file offline suite passes 703 checks with
one documented unavailable historical-fixture skip.

Consumer acceptance is incomplete. The new `d3d11-composition-x64` E2E case builds
the SDK's owned graphics host from the paired, verified source snapshot. It
requires proof of a real composition target, a null output window and unsupported
GetHwnd, then exercises the actual Izabela renderer, first-key input, pixels,
scrolling and cursors. Its normal packaged-app positive and focus-negative pair
passes. Actual PAGER with normal Izabela also passes visible game-pixel and
zero-click first-key checks. One elevated Izabela run fails: the PAGER runtime
repeatedly resets after opening the overlay, so interception ends before typing.
The failure is retained in
`coverage/overlay-compatibility/real-pager/1009-high-failure-state.json` with its
matching native log. A fresh elevated retry passes opening, reopening and
maximizing with OS-key input and visible glyphs; its read-only inventory shows
one eligible window with a stable token. That passing retry does not resolve
the intermittent reset. This candidate is not accepted for delivery. The
generation-31 full-app failures below are retained.

The fresh Overwatch logs show the Steam-compatible loader was already selected,
and Steam tracks the same original swapchain seen beneath the ReShade proxy.
Steam's UI nevertheless reports no rendered frames. An owned upstream
foreign-hook reproduction passes its forwarding and GPU-readback controls;
it has not reproduced or fixed the actual Overwatch failure. No broad hook
behavior change is justified by that result.

## Bounded Steam compatibility snapshot (1008 baseline)

The upstream host emits at most 17 `EGO_COMPATIBILITY_SNAPSHOT_V1` records per
process. They identify the selected loader strategy, Steam environment/DLL
presence, method-discovery factory scope, and the first proxy/raw Present and
Present1 entry/return. Callback addresses are distinguished as current entries,
intercepted targets and saved trampolines, with module classes and at most two
read-only unconditional jump destinations. Unknown instructions or inaccessible
memory remain unknown. No additional COM query or callback is invoked.

The observer preserves Windows last-error state and isolates logging failures;
exhausted roles perform no further observation. The native patch SHA-256 is
`c63e22f1768770469c770fb6d4124ae1a293a6d5acd8402e8ec86f33b1ca1c66`.
Both architectures pass 80 owned foreign-chain assertions each, including the
17-record bound, unchanged forwarding/reference counts, and log-failure handling.
All prior compatibility gates pass. Nine source-cache cases also pass. The initial
offline suite recorded 805 passes, one unchanged launcher cleanup failure and
one unavailable legacy-fixture skip; the full launcher rerun passes all 248
checks. Both the original failure and skip remain in the validation report.

Consumer acceptance passes all 105 package checks, frozen installation, app and
package builds, and workspace/actual-ASAR Electron smoke checks. The actual
packaged executable passes 15 graphics cases across 16 authenticated target
lifecycles: the full normal matrix and administrator x64/x86 positive and
focus-negative pairs. First-key typing without a click, scroll isolation, cursor
shapes, scaling and relaunch recovery pass. Completed target stages retire their
payloads, and staging controls do not accumulate against the test baseline.

The initial PAGER probe verifies a high-integrity controller and medium game,
wrapped D3D11 composition, working WebGL and authenticated native transport. Its
three snapshot records identify the Steam-compatible loader strategy and a
proxy Present1 downstream entry whose two-jump destination is the loaded Steam
renderer; that observation does not establish Steam overlay rendering.
That probe does not create an Izabela surface. A subsequent full packaged-app
reproduction with elevated Izabela fails: PAGER authenticates but reports
`runtime-input-routing-failed` with error code `-4`, emits no game surface, and
does not display Izabela's published frame. The same configuration-save warning
reported by the user is visible. PAGER overlay acceptance therefore remains
failed, independently of the passing controlled-graphics matrix and WebGL fix.
The retained failure is `coverage/overlay-compatibility/real-pager/failure-state.json`.
Evidence is indexed by `coverage/overlay-compatibility/compat1008-validation.json`.
Actual Overwatch acceptance requires the diagnostic build on the failing system;
this snapshot is not a claimed Overwatch fix.

## Steam detection and private-stage diagnostics (1007 baseline)

The SDK selects ReShade's existing Steam-compatible loader-hook strategy when
the current process already has the correct-architecture Steam renderer DLL,
including when `SteamOverlayGameId` is absent. The existing environment check
still covers injection before that renderer is loaded. This is a detection
correction with no game-specific exception, delay, or retry.
Its patch SHA-256 is
`560bf8a6db17643f7fa095f75fdbe0677211fc4354beb6c869c7d4ecd7db1241`.

Failure-only private-stage diagnostics identify the artifact and operation that
refused access while preserving the original Windows error, ownership, label,
hash and sharing checks. The patch SHA-256 is
`d73ff95608079571fc6438f8b5e280bb710ad8467f19ca31b664e371929c05f1`.
These diagnostics do not establish or fix the cause of the earlier sharing error.

Both architectures pass eight owned loader-model cases, 17 private-stage
diagnostic assertions, 19 Present-forwarding cases, five offscreen D3D11 identity
cases and an ABI smoke each. The selected offline suite passes 805 checks with
one documented skip for an unavailable historical injector fixture; the final
eight staging guards also pass. Actual Steam rendering is separate from the
owned loader model, whose later-renderer ordering limitation remains documented.
Consumer acceptance passes all 105 package checks, frozen installation, the app
build, and workspace and actual-ASAR Electron smoke checks. The packaged graphics
matrix passes 11 normal-permission cases across 12 native lifecycles, plus the
administrator x64 D3D11 and x86 D3D9 positive/focus-negative pairs. First-key
typing, scrolling, cursor shapes, scaling and lifecycle recovery pass. Actual
PAGER also passes with a high-integrity controller, a medium-integrity game,
wrapped D3D11 interception and an authenticated native connection.

The supplied matching native logs identify Overwatch.exe PID 29712 and prove
successful injection plus a transported EGO scene. Steam's UI connects to that
same PID but reports no rendered overlay frames. Those correlated records narrow
the issue to coexistence; they do not yet establish that the missing-environment
detection case is the cause. Actual Overwatch acceptance remains pending.

Fresh generation-31 logs for Overwatch PID 13624 confirm the `load-library`
strategy was already enabled through the Steam environment flag, with the
renderer DLL absent at initial registration. Method-discovery factory scope is
identified explicitly. The game later traverses both proxy and raw Present
callbacks and both return success; the bounded saved-trampoline observation ends
in another image. The user still reports no Steam overlay. These records rule
out failure to select the Steam loader strategy for this launch; they do not
prove Steam frame rendering or identify the downstream module. Matching fresh
Steam logs are required for the remaining correlation.

## D3D11 composition compatibility and candidate 1006 acceptance

PAGER's WebGL startup failed when a composition back buffer returned the original
D3D11 device while ANGLE held ReShade's wrapper. The SDK now applies its existing
resource-device identity handling before returning a swapchain buffer, including
the first buffer obtained before any application-created texture.
The upstream patch SHA-256 is
`25da093f15faacf74aa16ed0bffa233b58d10c7fc1bea15b667c0e9f5f6aaef2`.
Its offscreen x64 and x86 gates reproduce the old mismatch and check corrected
hardware buffers, alternate resource interfaces, resizing, reference balance,
the existing video-support exception, and an unwrapped WARP control.

Candidate 1006 passes all 105 consumer/package checks, frozen installation,
the application build, and genuine workspace and packaged Electron smoke checks.
The normal-permission packaged graphics matrix passes 11 cases across 12 native
target lifecycles, covering D3D9/10/11/12, the supported x64/x86 hosts, scaling,
early rearming, delayed startup, physical first-key typing, pointer shapes and
wheel scrolling. The administrator D3D11 positive/focus-negative pair also passes.
The normal matrix adds no retained private code or staging controls after exit.

Actual PAGER launches through Steam pass with both medium and verified
high-integrity controllers. Each reaches the wrapped D3D11 path and authenticates
the native transport while the game's WebGL renderer starts. An additional
Chromium probe passes early wrapped-device interception, advancing WebGL frames
and a pixel readback with no ANGLE or Dawn device-identity error.
Evidence is indexed under `coverage/overlay-compatibility` and the native matrix
at `coverage/experimental-overlay/e2e/2026-11-10T15-02-48.002Z`.

The upstream broader suite initially passed 945 of 947 checks. Two stale source
inventory expectations were corrected and the affected guard file passed 8/8.
The separate addendum retains those failures and the test-only correction;
the original candidate and source-capture bytes remain unchanged.

An administrator x86 D3D9 run failed before injection with Windows sharing error
32 in private-stage verification after the safe x64 architecture-mismatch
fallback. That sample is retained as failed and remains under investigation.
It is not classified as an antivirus issue without evidence. The fresh candidate
1007 administrator x86 pair passes; the original sharing failure is retained and
its cause is not claimed fixed.

Candidate 1006 contains no Steam runtime correction. Subsequent matching native
logs establish successful Overwatch main-process injection and EGO rendering,
while Steam reports no rendered overlay frames. The current Steam investigation
and its remaining acceptance limit are described above; Overwatch is not
installed on the local test machine.

**Run as Administrator** retains its saved preference and original startup
behavior. Experimental opt-in does not clear it or relaunch at lower privilege.
The SDK supports high-integrity consumers and medium/high targets belonging to
the same user and interactive session. Medium consumers cannot authorize high
or system targets. Unknown user/session/token facts fail closed.

## Runtime storage

With SDK 1205, Izabela's owned ReShade runtime loads from a cache keyed by SDK
version. A normal launch uses the cached binaries without creating a run folder.
The SDK defaults file logging to off. An app can set `logging: true` in
`createReShadeLaunchConfig()` to write injector and ReShade logs to a separate
folder under its configured `runsRootDirectory`.

Call `clearOldReShadeRuntimeCache({ runsRootDirectory })` with the same root used
for launching to remove unused binary caches older than the running SDK. The
SDK keeps active, current, and newer versions. Administrator launches use a
protected cache. A version used at both privilege levels can have an ordinary
copy and a protected copy. Clearing the protected cache requires running the
call as administrator. Supported official ReShade hosts use the cache for the
startup wait and attachment. Installing or repairing the managed add-on still
writes to the ReShade installation and can require a target restart.

### Legacy staging

Ordinary preparation uses an immutable, verified `runs.payloads-v2` cache.
Helpers, runtime DLLs and manifests share file identities; participant add-ons
and mutable INIs remain private. Preparation/publication leases protect versions
being created or consumed. The SDK collects obsolete verified versions only when
unused, retaining at most two unused versions plus every live/uncertain version.

After positive non-execution evidence or authoritative target exit, the SDK
removes all thirteen payload entries from that run. Completed accessible, recognized runs retain small
diagnostic bundles, bounded to 16 folders, seven days and 4 MiB total. Individual
stdout/stderr/ReShade logs retain at most their last 64 KiB.

Administrator runs retain their protected, caller-owned, high-integrity,
single-link payloads while active. They stage directly from verified package
bytes without creating a redundant medium snapshot. Their payloads are transient
and disappear after the same lifetime proof; the existing security verifier is
unchanged. Known policy, ownership, transport and lease files are removed
before the final payload disappears, including synchronous unused-watcher drains.
A denied/shared control preserves payloads and exit proof for later maintenance.
One inaccessible stage no longer aborts cleanup of its eligible peers.

Izabela invokes the public `pruneReShadeRuntimeStorage()` alongside target
discovery with at most eight recovery probes per activation. It neither delays
watcher readiness nor cancels attachment if maintenance fails. The SDK alone
checks ownership, recorded PID/creation identity and authoritative OS evidence.
Denied, malformed, timed-out or missing evidence leaves the run intact.

Legacy `payloads-v1` is preserved because older SDK preparations do not acquire
collection leases. Old run folders without exact lifetime evidence also remain
untouched. Age, app restart and socket loss do not authorize deleting a possibly
mapped runtime. The audited older 88-folder/1.5 GB history is therefore not
claimed reclaimed by this update. No consumer force-delete is introduced.

## Previous storage-candidate validation (1005)

The producer passed 676 offline checks. Its real-payload storage gate retained
zero payload entries in completed runs and measured 19,898,368 allocated file
bytes after 32 retirements, excluding filesystem metadata. The single-retirement
baseline was 19,836,928 bytes; the bounded increase was diagnostic metadata.

Frozen installation and all 105 consumer/package checks pass. Final candidate acceptance passes four actual packaged E2E cases across seven
authenticated graphics lifecycles: normal-permission mixed recovery and the
high-token x86 positive/focus-negative pair. Every completed target stage loses
all thirteen payload entries, and staging-control counts do not grow. The exact
fast shutdown that left a policy file in candidate 1004 now passes unchanged.
Broader preceding-candidate acceptance covers 21 graphics/scaling/lifecycle cases,
including ten actual packaged cases, with identical native payloads.

An additional high-token access-refusal recovery scenario remains unvalidated:
the unchanged upstream test fixture exits 13 before readiness. Normal mixed
recovery and administrator graphics acceptance are separate evidence. HDR color
investigation remains deferred.

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
