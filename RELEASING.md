# Releasing `@signalsafe/simulator-core`

Releases are produced by `.github/workflows/ci.yml` from a pushed `vX.Y.Z` tag. The tag must match `package.json`. Manual dispatch on branches runs validation only. Publishing requires a tag ref, and CI verifies that the tag exactly matches the package version. Do not publish from a developer machine or move an existing release tag.

## Preparation

1. Review source, public exports, README, contract docs and CHANGELOG together. Include every release change and compatibility constraint.
2. Verify dependency availability in npm. Release simulator-core first, then simulator-react, then simulator-device. The CSS theme is independently publishable.
3. Refresh the committed Yarn lockfile for changed dependencies. No sibling `file:` or `link:` resolutions may be used for a standalone release.
4. Use Node 24 (CI also checks Node 22). Run strict typecheck, tests with coverage, build and `smoke:package` for runtime packages. For the CSS-only theme, run `smoke:package` and `publish:dry-run`. Device additionally requires `check:gallery` and `build:gallery`.
5. Inspect the packed file list and install into a clean temporary consumer. Runtime imports and TypeScript declarations must resolve without sibling repositories.
6. Commit the complete release, then push main and the matching annotated tag. Watch all tag-run checks and the Publish job. Publication uses the repository's `NPM_TOKEN` secret.

## CI gates

Core and React require checks, coverage tests, Sonar scanning and artifact smoke tests. Sonar runs on pushes and same-repository pull requests; there is no scan-label gate. Device requires checks, coverage tests and artifact smoke tests. Theme requires its file/pack smoke checks. Do not bypass failed gates.

## Consumer adoption

Verify the exact version and registry integrity after the tag workflow succeeds. Update consumers to exact registry versions, regenerate their lockfiles, and run a clean install plus consumer validation. Remove local archives only after registry installation succeeds. Keep published tags immutable; corrections use a new version.

## Node runtime compatibility

The runtime requirement is Node >=19.0.0. Build, unit-test and coverage tools use
Node 22/24 (use Node 24.16+ locally). A separate CI job installs packed artifacts
with strict engine checks and tests runtime behavior on Node 19.0.0 and 19–24.

## September 29 local-app migration release candidate

Prepared versions are core `0.4.1`, React `0.17.0`, device `0.17.0` and theme
`0.10.0`. Inspection approval was recorded in PhoneMe before extraction.
The Node runtime contract remains unchanged.

Publish core first, then React, then device through matching version-tag CI;
theme can publish independently. Refresh React's registry Yarn lock after core
is available, and device's after core, React and theme are available. Those
unpublished upstream resolutions cannot yet be certified by a frozen registry
install. Never invent integrity values or substitute sibling paths in release
manifests. Run the registry smoke/runtime matrix and Sonar gates as documented
above before publication; local tarball validation is not registry evidence.

The `simulator-device/examples/local-apps` example builds under React 18 and has
a browser workflow (`npm run test:browser`). Before publication, copy it to an
isolated temporary directory and install all four packed artifacts explicitly.
Its memory adapter intentionally resets on reload; durable storage, imports,
regional formatting and live services belong to the consuming application.
