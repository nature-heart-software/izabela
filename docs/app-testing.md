# Windows application tests

The app suite launches the production main/preload/renderer bundles in Electron with a fresh temporary user-data directory. It never loads your normal profile or changes Windows startup registration. Playback is muted at the web-contents output while an analyser checks that decoded audio has a nonzero signal.

## Commands

Run on Windows with an unlocked desktop and no other Izabela instance using the configured API ports:

```sh
pnpm test:app:unit
pnpm test:app
```

`test:app` builds workspace dependencies and the production app before running. `pnpm test:app:built` runs against an existing production build. `pnpm test:app:packaged` loads the actual installer `app.asar`; the desktop CI workflow uses it after packaging. The tests fail if the app ports are occupied, rather than connecting to an unrelated running instance.

Packaged mode loads the shipped ASAR in an Electron test host and checks that the accompanying SoX executable is present. It exercises the shipped application modules, preloads, and assets; installing the NSIS installer and checking its Windows shell integration remain manual checks.

For live services, use your existing Infisical dev login:

```sh
pnpm exec infisical run --env=dev --path=/apps/app --command "pnpm test:app:live"
```

The live command rebuilds using the injected environment, then tests every configured provider in `tests/app/providers.cjs`. A configured provider that fails authentication, has no credits, is unavailable, silently returns the original text, or cannot transcribe the fixture fails its test. Unconfigured providers are listed with their missing variable names in the report; they are not claimed as passing. Live tests make short paid API requests and are not part of ordinary credential-free CI.

Infisical also retains an Uberduck key, but this branch has no Uberduck app implementation. The report lists that legacy configuration as unsupported. Other unknown configured provider variables fail the inventory guard so new integrations cannot be silently omitted.

## Coverage

- Local TTS: Sam, Animalese, and Windows voices; real messenger submission, IPC, synthesis, audio decoding, playback, and completion.
- Configured cloud TTS: Polly, Google Cloud, Azure, IBM Watson, ElevenLabs, and OpenAI; streaming and buffered settings.
- Configured STT: Amazon Transcribe, Google Cloud, Azure, IBM Watson, ElevenLabs, and OpenAI; real recorder package, PCM buffering, recognition SDK/service, returned transcript, IPC, and subsequent TTS. The transcript must contain words from the known fixture.
- Configured translation: Amazon Translate, Azure, OpenAI, Google Cloud, and the keyless Google Translate adapter; real messenger submission through translation and playback. Returning the untranslated English source is a failure. When Azure and Amazon Translate are configured, an extra test selects the actual Nanami voice and checks Auto/Auto Japanese translation and playback.
- Native shortcuts: messenger toggle and rebinding, alternate messenger, overlay, saved messages, profiles, cancel current/queued speech, and push-to-record press/release. Tests temporarily bind F13–F21 in their own profile and release all keys at teardown.
- Continuous voice detection, recording-indicator visibility, disabling capture, capture-process cleanup, and unhandled application failures.

Only the physical microphone source is substituted: Chromium reads a fixed WAV, and the recorder's SoX process is replaced by a paced PCM process using that same WAV. Provider clients and application functions are not replaced. The custom recognition adapter additionally checks PCM export without credentials in CI. This certifies the application pipeline with fixture audio; physical device drivers, real-microphone quality, and the audible output hardware still require manual testing.

The WAV is synthetic English speech generated with Windows SAPI, 16 kHz, mono, signed 16-bit PCM: “The quick brown fox jumps over the lazy dog. This is a speech recognition test.”

## Reports

Reports, redacted logs, and failure screenshots are written under `coverage/app-results/`: `offline`, `live`, or the corresponding `-packaged` directory. The runner rejects missing or duplicated cases, and a green partial report cannot pass. The CI workflow uploads only the offline packaged diagnostic directory. The temporary profile, including provider-created credential files, is removed after the process exits.
