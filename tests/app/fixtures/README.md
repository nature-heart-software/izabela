`speech.wav` is the existing English recognition fixture. The three locale-named
WAVs contain French, Japanese and Arabic speech, synthesized using Azure dev
credentials by `../generate-language-fixtures.cjs`. `languages.json` records the
exact source sentences, voices and transcript keywords. All files are mono,
16-bit PCM at 16 kHz. No credentials are stored in these fixtures.

Live tests send these WAVs through the actual native recorder buffering and each
configured recognition SDK, then speak the result with an Azure voice matching
the fixture language. French and Japanese cover all six configured providers.
Arabic covers the other five providers: IBM's adapter currently selects
Multimedia models and has no ar-SA Multimedia model. This is an explicit matrix
boundary, not a passing Arabic IBM test. SDK-boundary tests still cover Unicode
transcript preservation for every adapter.

Regenerate only when intentionally changing the inputs:

```powershell
pnpm exec infisical run --env=dev --path=/apps/app --command 'node tests/app/generate-language-fixtures.cjs'
```
