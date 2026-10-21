# Releasing `@signalsafe/simulator-core`

## Coordinated release — approved 2026-10-21

| Package | Prepared version | Required simulator dependencies |
| --- | --- | --- |
| `@signalsafe/simulator-core` | `0.7.1` | none |
| `@signalsafe/simulator-theme-bootstrap` | `0.13.1` | none |
| `@signalsafe/simulator-react` | `0.21.1` | core `0.7.1`; optional default theme `^0.13.1` |
| `@signalsafe/simulator-device` | `0.21.1` | core `0.7.1`, React `0.21.1`, theme `0.13.1` (exact) |

These compatible patches preserve the existing public runtime API and shared UI.
React and the default theme must be adopted together: the corrected frame markup
requires the matching CSS. A custom theme remains an explicit host responsibility.
The optional theme peer does not install or require the default theme for unstyled
integrations. Node runtime support remains `>=19.0.0`; build tools use Node 22/24.

Publish core and theme first, then React, then device, only after explicit approval
and successful gated tag workflows. Download and verify each upstream registry
artifact before refreshing downstream Yarn locks and the device demo npm lock.
Future registry integrity values must never be fabricated. Before upstream
publication, coherent packed-artifact installs provide candidate evidence only;
frozen standalone registry installs remain a separate release gate.

Existing local host archives retain their recorded provenance until the approved
registry artifacts pass all host checks. Historical release notes below describe
their original checkpoints and do not authorize publication or host replacement.

Releases are produced by `.github/workflows/ci.yml` from a pushed `vX.Y.Z` tag. The tag must match `package.json`. Manual dispatch on branches runs validation only. Publishing requires a tag ref, and CI verifies that the tag exactly matches the package version. Do not publish from a developer machine or move an existing release tag.

## Preparation

1. Review source, public exports, README, contract docs and CHANGELOG together. Include every release change and compatibility constraint.
2. Verify dependency availability in npm. Release simulator-core first, then simulator-react, then simulator-device. The CSS theme is independently publishable.
3. Refresh the committed Yarn lockfile for changed dependencies. No sibling `file:` or `link:` resolutions may be used for a standalone release.
4. Use Node 24 (CI also checks Node 22). Run strict typecheck, lint, tests with coverage, `check:cycles`, `check:duplication`, build and `smoke:package` for runtime packages. For the CSS-only theme, run `smoke:package` and `publish:dry-run`. Device additionally requires `check:gallery` and `build:gallery`.
5. Inspect the packed file list and install into a clean temporary consumer. Runtime imports and TypeScript declarations must resolve without sibling repositories.
6. After explicit release approval and all acceptance gates pass, commit the complete release, then push main and the matching annotated tag. Watch all tag-run checks and the Publish job. Publication uses the repository's `NPM_TOKEN` secret.

## CI gates

All four packages run hosted Sonar scans; require their successful result before approving a release. Core and React publication explicitly depends on checks, coverage tests, scan, packed smoke and runtime compatibility. Device also runs gallery checks and its portable demo workflow. Its publish job depends on checks, tests, scan, packed smoke and runtime compatibility; theme publication depends on checks, scan and packed smoke. The coordinated release fixes the missing scan dependency in device and theme publication. Theme also tests its executable appearance API with coverage; CSS coverage is not represented as JavaScript test coverage. Do not bypass failed gates.

## Consumer adoption

Verify the exact version and registry integrity after the tag workflow succeeds. Update consumers to exact registry versions, regenerate their lockfiles, and run a clean install plus consumer validation. Remove local archives only after registry installation succeeds. Keep published tags immutable; corrections use a new version.

## Node runtime compatibility

The runtime requirement is Node >=19.0.0. Build, unit-test and coverage tools use
Node 22/24 (use Node 24.16+ locally). A separate CI job installs packed artifacts
with strict engine checks and tests runtime behavior on Node 19.0.0 and 19–24.

## Historical September 29 local-app migration checkpoint

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

The `simulator-device/docs/examples/local-apps` example builds under React 18 and has
a browser workflow (`npm run test:browser`). Before publication, copy it to an
isolated temporary directory and install all four packed artifacts explicitly.
Its memory adapter intentionally resets on reload; durable storage, imports,
regional formatting and live services belong to the consuming application.
