# Package verification and examples — 2026-11-11

Prepared source: **simulator-core 0.7.2**. The version is not yet published to npm.

## Verified results

- 165 package tests passed. The coordinated five-package suites passed **1,465 tests**.
- **100% statements, branches, functions and lines** for every package's executable source. Core/React/device/editor use V8; the theme uses c8 over its appearance API. CSS is verified with browser layout checks rather than JavaScript coverage.
- Strict source and test type checking, lint/module boundaries, formatting and builds passed for the TypeScript packages. The editor test project now explicitly includes tests instead of inheriting an exclusion.
- Coverage thresholds are all 100%; no coverage ignores or exclusions were added to hide uncovered executable source.
- No open GitHub issues were reported in the five package repositories on this date. This does not certify external services or unrelated host work.

## Examples and links

- [Live editor](https://signalsafesoftware.github.io/simulator-editor-react/) — controlled authoring with synthetic data and shared device preview; no server persistence, real calls or outbound messages.
- [Editor repository](https://github.com/SignalSafeSoftware/simulator-editor-react) — private, with its Website field linking back to the live example. The site links to its repository and source.
- [Shared device example](https://signalsafesoftware.github.io/simulator-device/).
- [All related packages and source examples](links.md).

The editor example carries exact local review archives and a SHA-256 manifest. Its independent lockfile installs those archives rather than pretending unpublished versions are available from npm. Four browser regressions cover the package-owned phone frame, shared theme/icon font, conversation selection/preview, contact editing, Reset, JSON validation, source links and download.

## Remaining release boundary

The coordinated versions are absent from npm. Registry dependency lock entries, public-device-demo pins and host registry requirements retain their last real published versions until dependency-order npm publication is authorized and succeeds. Local review artifacts and the editor example explicitly opt into the prepared versions. No registry integrity values were fabricated, release tags created or npm publication performed. Registry/frozen-lock CI and Sonar release certification remain separate gates; draft PRs must not be represented as publish-ready.

Earlier November 10 reports retain their historical results. This report supersedes their package coverage findings.
