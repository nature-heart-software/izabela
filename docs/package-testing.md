# Package regression tests

The package suite covers workspace libraries and the local API server. The desktop application (`apps/app`) is excluded from this suite; its existing application and native-runtime checks remain separate.

## Running tests

Use the repository's pinned Node and pnpm versions, then install from the lockfile:

```sh
pnpm install --frozen-lockfile
pnpm build:portable
pnpm test:packages
```

The runner discovers packages from their manifests and executes them sequentially. A missing suite, an empty or malformed result, a skipped case, an unexpected test failure, or a failed declared type check fails the command. Independent packages are still checked after another package fails.

To check one package or an ordered subset:

```sh
pnpm test:packages animalese
pnpm test:packages electron-pinia electron-postman
```

Selections accept the package name, directory name, or directory path. Execution follows workspace directory order. Unknown selections fail rather than silently testing a different scope.

For supplementary JavaScript coverage:

```sh
pnpm test:packages:coverage
```

This first runs the same package and type gates, then collects V8 coverage. Coverage is supplementary evidence, not a substitute for behavior assertions. Native C++ execution and some sandboxed module-loading paths cannot be inferred from JavaScript coverage percentages.

To verify the runner itself:

```sh
pnpm test:packages:runner
```

These controls use isolated, explicitly synthetic reporter results and package-manager exit statuses to check inventory selection, failure reporting, continuation, and stale-report cleanup. They do not run real package behavior or compile consumer types; `pnpm test:packages` performs that separate verification.

## Consumer type checks

Packages can declare a `test:types` script. The sequential runner executes it after their runtime suite. Consumer fixtures should resolve the package root through its real `types` or `typings` entry, building declarations first where required. Importing a source file alone does not establish that published declaration metadata works.

Positive assertions check usable return values and options. Negative assertions use narrowly placed `@ts-expect-error` comments to prove invalid calls are rejected. An unused directive fails the type check. Format test fixtures before final verification, because moving a negative assertion across lines can change which diagnostic its directive applies to.

Type-only improvements must preserve the implementation's emitted JavaScript. Public contracts should describe actual behavior, including nullable or unchecked results where appropriate, rather than introducing unsupported guarantees.

## Existing defects and expected failures

A successful command does not mean that every desired contract already works. Retained baseline defects have:

1. An ordinary characterization test proving the exact current output, rejection, or cleanup behavior.
2. A separate `it.fails` desired-behavior test named with `[known issue]`.

The runner reports ordinary passes separately from these expected-failure cases. It also reports skipped tests separately; an expected failure is not a skipped test or a bug fix. If a defect is fixed, convert the desired-behavior case into an ordinary test and update or remove the old characterization.

Examples already covered include the Animalese WAV byte-rate field, Pinia subscription/action edge cases, Postman reply and listener lifecycle defects, and invalid aliases generated from hyphenated filenames. Consult the named cases in each package for the exact prerequisites and observed behavior.

## Boundaries and platform coverage

Tests exercise the actual package implementation. Replace only external boundaries such as Electron IPC, native bindings, process spawning, and provider transports. Use real temporary files, streams, stores, and Vue components where those are the behavior under test.

A mocked native binding does not prove Windows compilation or native execution. Likewise, simulated IPC does not establish cross-process scheduling, microphone fixtures do not record audio, and synthetic provider transports do not verify live services. Keep these distinctions visible in reports. No real provider credentials or paid requests are required for package tests.

The package CI matrix runs on Linux and Windows. Native lifecycle scripts are suppressed in this portable test job, then portable build tooling is prepared explicitly. The separate desktop workflow retains its real Windows native build, packaged-runtime, and cache checks. Package jobs remain disabled while a PR is draft, so incomplete package inventories cannot be mistaken for completed coverage.

## Reports and regression sensitivity

Reports are written under the ignored `coverage/package-results/` directory:

- One Vitest JSON result per package.
- `summary.json`, including the expected package count, per-package status, ordinary passes, named expected failures, skips, and type-check status.

When adding tests around unchanged legacy code, verify that an intentional, narrowly scoped mutation produces the intended assertion failure. Prefer an in-memory transform; otherwise restore the exact source in a `finally` block. Rerun the unmodified implementation afterward. Keep mutation probes and execution journals out of production sources.
