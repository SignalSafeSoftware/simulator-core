# Changelog

## 0.7.0 — October 7, 2026

- Add optional `duration_seconds` to `SimulatorPayloadCallEntry`; device JSON validation accepts a nonnegative whole number of seconds and rejects other values. Hosts that omit it are unaffected.
- Move `MIGRATION.md`, `RELEASING.md` and `STANDALONE.md` into `docs/` and the examples into `docs/examples/`. The docs ship in the package; the examples do not.

## 0.6.0 — October 4, 2026

- Export `ReplyKind` (`reply`, `reply-all`, `forward`) from `apps/mail` and type `replyMail` with it.
- Replace repeated string literals with constants; no behavior change.
- Add `check:cycles` and `check:duplication` to CI.
- Update development dependencies.

## 0.5.0 — October 4, 2026

Remove legacy conversion, wire and presentation aliases; migrate consumers to canonical contracts. See MIGRATION.md.

## 0.4.1 — prepared September 29, 2026

- Correct the packed-runtime version assertion. The 0.4.0 tag failed CI and was not published; its tag is retained unchanged.

- Add versioned local-device schemas, asset limits, record metadata, paged repository and `DeviceStore` host contracts.
- Add pure simulated mail transitions, recipient handling and strict browser action envelopes. Simulated send preserves draft identity and performs no network request.
- Add Zod 4 as a runtime dependency. Existing simulator records retain storage version 1; no data rewrite is required.

- Compile and execute the repository examples against the packed public API during package smoke checks.

## [Unreleased]

### Changed

- Require a matching GitHub version tag for npm publication; branch workflow runs only validate.

## [0.3.2] - 2026-09-16

### Changed

- Lower the runtime requirement to Node >=19.0.0 and refresh the TreeSpec lockfile to 0.4.1.
- Add isolated packed-consumer tests on Node 19.0.0 and Node 19–24; retain modern tooling checks on Node 22/24.

## 0.3.1 — 2026-09-16

- Refresh release tooling to Vitest 5; preserve React 18 compatibility.
- Add labeled phone and email endpoint types to device contacts and preserve optional Bcc on email payloads.
- Refresh TreeSpec to the published 0.4 line; retain a headless runtime with no React, network, or storage dependency.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-09-08

### Added

- Versioned graph-only session snapshots and validated restoration by replaying
  choices through the dispatcher.

## [0.1.10] - 2026-08-28

### Changed

- Require `@signalsafe/tree-spec` **^0.3.4** and lock the runtime to the published `0.3.4` release.

## [0.1.9] - 2026-08-28

### Changed

- Updated the TypeScript 7-compatible build configuration and current CI action dependencies.

### Notes

- No runtime API changes.

## [0.1.7] - 2026-06-28

### Changed

- Raised the supported Node.js baseline to Node 22.12+.
- Standardized package CI checks for lint and coverage.
- Expanded simulator-core behavior tests for dispatch edge cases, END outcomes, stale node mismatches, invalid choices, score validation, lesson trigger passthrough, and runtime issue reporting.

### Notes

- No runtime API changes.
- No React, DOM, Bootstrap, or UI framework dependencies were added.

## [0.1.5] - 2026-06-26

### Fixed

- Clear monorepo `paths` from standalone `tsconfig.build.json` so local `yarn build` works outside the monorepo.

### Changed

- Standardize development on Yarn 1.22.22 (`packageManager`, README dev commands).
- Bump `@signalsafe/tree-spec` dependency to `^0.3.2`.

## [0.1.4] - 2026-06-26

### Added

- `SECURITY.md` and Dependabot configuration.
- `CHANGELOG.md` and updated release documentation.
- Expanded unit test coverage.
- Package artifact smoke test (`yarn smoke:package`).

### Changed

- Package metadata: `packageManager` (Batch 3).
- README: lifecycle, boundaries, security (Batch 4).

### CI

- Checks and tests on every PR; Sonar **`scan`** is label-gated on PRs and runs on tag push and manual dispatch (Batch 1).
- Publish only from manual **`main`** dispatch or **`v*`** tags (not PR labels); publish requires **`checks`**, **`tests`**, and **`scan`**.

### Documentation

- Release process in [RELEASING.md](./RELEASING.md).

[Unreleased]: https://github.com/SignalSafeSoftware/simulator-core/compare/v0.1.10...HEAD
[0.1.10]: https://github.com/SignalSafeSoftware/simulator-core/compare/v0.1.9...v0.1.10
[0.1.9]: https://github.com/SignalSafeSoftware/simulator-core/compare/v0.1.8...v0.1.9
[0.1.7]: https://github.com/SignalSafeSoftware/simulator-core/compare/v0.1.5...v0.1.7
[0.1.5]: https://github.com/SignalSafeSoftware/simulator-core/releases/tag/v0.1.5
[0.1.4]: https://github.com/SignalSafeSoftware/simulator-core/releases/tag/v0.1.4
