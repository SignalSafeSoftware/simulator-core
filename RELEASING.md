# Releasing `@signalsafe/simulator-core`

Releases are produced by `.github/workflows/ci.yml` from a pushed `vX.Y.Z` tag. The tag must match `package.json`. The workflow also supports manual dispatch on main; use tags for the documented release sequence. Do not publish from a developer machine or move an existing release tag.

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
