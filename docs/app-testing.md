# Windows application tests

The app suite launches the production main/preload/renderer bundles in Electron with disposable user-data and cache directories. It never loads your normal profile or changes Windows startup registration. Three independent launches exercise legacy combined, split-file, and damaged-settings profiles. The main suite then uses a fresh profile and relaunches it to verify persistence and speak again. Playback is muted while an analyser checks that decoded audio has a nonzero signal.

## Commands

Run on Windows with an unlocked desktop and no other Izabela instance using the configured API ports:

```sh
pnpm test:app:unit
pnpm test:recovery
pnpm test:resilience
pnpm test:edges
pnpm test:app
```

`test:app` builds workspace dependencies and the production app before running. `pnpm test:app:built` runs against an existing production build. `pnpm test:app:packaged` loads the actual installer `app.asar`; the desktop CI workflow uses it after packaging. The tests fail if the app ports are occupied, rather than connecting to an unrelated running instance.

Packaged mode loads the shipped ASAR in an Electron test host and checks that the accompanying SoX executable is present. It exercises the shipped application modules, preloads, and assets. Actual installation is covered by the separate hosted installer job below; interactive installer dialogs and Windows shell integration remain separate checks.

For live services, use your existing Infisical dev login:

```sh
pnpm exec infisical run --env=dev --path=/apps/app --command "pnpm test:app:live"
```

The live command rebuilds using the injected environment, then tests every configured provider in `tests/app/providers.cjs`. A configured provider that fails authentication, has no credits, is unavailable, silently returns the original text, or cannot transcribe the fixture fails its test. Unconfigured providers are listed with their missing variable names in the report; they are not claimed as passing. Live tests make short paid API requests and are not part of ordinary credential-free CI.

Infisical also retains an Uberduck key, but this branch has no Uberduck app implementation. The report lists that legacy configuration as unsupported. Other unknown configured provider variables fail the inventory guard so new integrations cannot be silently omitted.

## Coverage

The final edge-case batch adds `pnpm test:edges` for keyboard layouts/modifiers,
shortcut conflicts, bounded renderer recovery, and real atomic settings writes.
A subprocess is killed immediately before committing a save; EACCES and ENOSPC
are injected at the atomic replacement boundary. Reopening the actual storage
library must recover the previous complete data and accept a subsequent save.
The app suite also crashes each real renderer, checks capture cleanup and speech
after reload, and blocks its isolated cache directory without changing host ACLs.

Provider tests preserve accents, combining marks, emoji, Japanese, Arabic and
multiline text through payload construction and SDK result handling. Large text
must reach transport intact; this does not assert that every provider accepts
the same maximum length. Existing rejection/recovery tests cover service errors.
Live recognition adds the matrix documented in
[`tests/app/fixtures/README.md`](../tests/app/fixtures/README.md).

The `Automatic update and recovery` GitHub-hosted Windows job installs version
6.6.6, then exercises the actual packaged updater against a loopback feed serving
a second build of this branch labelled 6.6.7. It rejects an interrupted download
and an incorrect SHA-512 digest, then downloads the valid installer, applies it,
checks the executable version, waits for the automatic relaunch, speaks through
the application and checks saved settings/dictionary data. It calls the real
updater through the main-process debugger because CI builds disable scheduled
release checks. Production update-policy tests separately check that wiring.
The probe refuses execution outside a disposable GitHub-hosted Windows runner.
Both installers are retained as workflow artifacts; reruns can reuse that run's
`installer_artifact_run` input. The older direct-install upgrade job remains.

Virtual cable and game overlay coverage is intentionally not expanded in this
batch. Physical device routing, game compatibility and OS keyboard layout
switching remain outside this automated matrix; AZERTY/AltGr mapping is checked
at the native keymap boundary and a real Windows modifier chord is exercised end
to end.

- Local TTS: Sam, Animalese, and Windows voices; real messenger submission, IPC, synthesis, audio decoding, playback, and completion.
- Configured cloud TTS: Polly, Google Cloud, Azure, IBM Watson, ElevenLabs, and OpenAI; streaming and buffered settings.
- Configured STT: Amazon Transcribe, Google Cloud, Azure, IBM Watson, ElevenLabs, and OpenAI; real recorder package, PCM buffering, recognition SDK/service, returned transcript, IPC, and subsequent TTS. The transcript must contain words from the known fixture.
- Configured translation: Amazon Translate, Azure, OpenAI, Google Cloud, and the keyless Google Translate adapter; real messenger submission through translation and playback. Returning the untranslated English source is a failure. When Azure and Amazon Translate are configured, an extra test selects the actual Nanami voice and checks Auto/Auto Japanese translation and playback.
- Native shortcuts: messenger toggle and rebinding, alternate messenger, overlay, saved messages, profiles, cancel current/queued speech, and push-to-record press/release. Tests temporarily bind F13–F21 in their own profile and release all keys at teardown.
- Continuous voice detection, recording-indicator visibility, disabling capture, capture-process cleanup, and unhandled application failures.
- Word-mode Space submission, sentence Send/Enter, queue ordering and timing events, Up/Down recall, editing and resubmission, history replay with the saved voice, copy, export, and deletion.
- Saved phrase creation/edit/play/delete and profile creation/rename/apply/delete through the rendered UI; the native shortcut tests complement these flows.
- Dictionary enable/disable/edit/remove, keyboard command completion, voice search/favorites/presets, and Sam custom pitch reaching synthesis.
- Escape, retained/cleared drafts, hide-after-Enter versus Send-click, native foreground focus restoration, close-without-quit, keyboard zoom, guided tour, About runtime information, dragging/reopening Messenger, and disabled-update build controls.
- Controlled HTTP custom TTS/translation and universal-auth endpoints; real app requests, catalog selection, language options, speech decoding, failure/fallback/recovery, cache reuse, General's Clear cache button, and regeneration without losing saved data.
- External Socket.IO `say`/`audio:play`, audio cancellation, and Custom recognition PCM export → external transcription response via `say` after restarting the native recognition server.
- Full process relaunch preserves preferences, dictionary, profiles, saved phrases, history and Messenger placement; a changed theme must render after relaunch, and the saved dictionary must still affect speech.
- Repeated General-settings navigation keeps global hitbox listeners bounded and checks for retained detached DOM trees after garbage collection in the production renderer.
- Delayed synthesis cancellation, cancellation of prefetched messages, queued provider failures, exactly-once lifecycle events, and working speech after recovery.
- Disabling recognition while the native record shortcut is held, re-enabling it, and restarting capture while held; the new capture must receive PCM and leave exactly one active recorder.
- Authenticated custom language catalogs, valid language IDs, credential changes, and endpoint changes while an earlier catalog response is delayed. Google account imports use a generated test key: cancellation and invalid JSON must preserve the previously imported file and allow a subsequent valid import.
- Older combined and split profiles retain saved phrases, history voices, dictionary entries, profiles, custom endpoints, empty arrays and explicit settings while receiving new defaults. Damaged settings are backed up byte for byte before defaults are restored; unrelated stores must survive.
- Additional live journeys combine recognition → translation → speech, Azure expressive style SSML and audio, and OpenAI instructions/custom-command descriptions and audio. These are required when their providers are configured.
- Browser-boundary output routing and reconnecting device IDs, completion across selected outputs, truncated streaming audio recovery, 50 queued playbacks, 10 cancellation waves, and 20 native recognition restarts. Audio URLs must be released and recorder counts must return to zero.
- Simulated Electron suspend/resume events, native tray callbacks, display-metrics changes and launching a second actual Electron process against the same profile. The original process must retain its windows and still speak.

For microphone tests, Chromium reads a fixed WAV, and the recorder's SoX process is replaced by a paced PCM process using that same WAV. Live provider clients and application functions are not replaced. Custom/universal endpoint tests use a controlled localhost service. The export test supplies a destination at the native save-dialog boundary, checks the real saved WAV and plays those saved bytes through the external-audio integration. Native Windows dialog interaction and playback in another installed application remain manual checks. Clipboard formats are materialized and restored around copy tests using Electron 46's asynchronous clipboard API.

This certifies the application pipeline with fixture audio; physical device drivers, real-microphone quality, and the audible output hardware still require manual testing. Normal builds are tested without modifying startup, installing drivers, invoking UAC, injecting games, or replacing an installed app. See [the 44-journey coverage map](windows-e2e-coverage.md) for each boundary. A partial or manual journey is never counted as a fully passed macro journey.

`pnpm test:recovery` runs focused source tests without Windows UI or provider credentials. It additionally covers connection retry/coalescing, closed sockets, handshake timeout, stop during connection startup, failed background renewal, late transcripts after cleanup, playback rejection, atomic credential replacement, and filesystem error handling. Buffered OpenAI audio during connection startup and wire-protocol assertions are also part of `pnpm test:stt`. These tests use controlled sockets and clocks; live service availability remains the job of the live suite.

`pnpm test:resilience` checks all six STT adapters against SDK-boundary failures, silent final results, teardown and recovery; all six cloud TTS registrations against real failed/disconnected/truncated HTTP responses; and all five translators against rejected IPC calls. Translator fallback behavior is preserved. It also runs 200 turns per recognizer, 500 audio-message completions, device selection and suspend/resume source tests. Recognition waits up to 60 seconds for a final result after input ends, then releases that turn so later speech can proceed. These tests add no error UI.

The routing E2E fixture supplies device enumeration and `setSinkId` at the Chromium boundary. It verifies app routing and real audio playback, not physical delivery to two devices. Suspend/resume and display events are emitted inside the test app; the host computer is not suspended or reconfigured. Tray menu callbacks are exercised without actually invoking Restart/Exit; full relaunch is covered separately.

## Installed application CI

The desktop workflow uploads its built installer to a separate fresh `windows-2022` job. `tests/app/installer.cjs` refuses to run unless it is on a GitHub-hosted Windows runner. It downloads the current published Windows release, installs it silently, launches the actual executable and checks its persisted profile through the Chromium debugging protocol. It then installs the candidate over that release, checks saved data and speech again, and uninstalls while verifying that user data remains.

Installed-app diagnostics go to `coverage/installer-results` and are uploaded even on failure. These checks are separate from the ASAR suite and their success must be read from the installer job. They require no external VM service. Automatic-update downloads run in the separate updater job described above. Interactive installer dialogs, reboot behavior and physical device testing remain separate checks.

The desktop workflow can also be started manually with `installer_artifact_run` set to an earlier run ID. This reruns the installed-app and updater jobs using that run's `installer-test-input` and `updater-test-input` artifacts. Leave the input empty to build and test everything.

The WAV is synthetic English speech generated with Windows SAPI, 16 kHz, mono, signed 16-bit PCM: “The quick brown fox jumps over the lazy dog. This is a speech recognition test.”

## Reports

Reports, redacted logs, and failure screenshots are written under `coverage/app-results/`: `offline`, `live`, or the corresponding `-packaged` directory. `summary.json` includes Windows/environment details and a result for each of the 44 macro journeys: Pass, Partial, Manual, Not fully run, or Fail, with the underlying case results and any manual boundary. The runner rejects missing or duplicated automated cases, and a green partial run cannot pass. The CI workflow uploads only the offline packaged diagnostic directory. The temporary profiles, including provider-created credential files, are removed after all processes exit.
