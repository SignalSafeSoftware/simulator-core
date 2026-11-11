# Current state

Published npm version **0.7.2**, released through the fully gated GitHub tag workflow on November 11, 2026.

## Coordinated public references

| Package | Registry version |
| --- | --- |
| Core | 0.7.2 |
| React | 0.21.2 |
| Device | 0.21.4 |
| Theme | 0.13.4 |

Package manifests and examples select these public registry versions. The private editor example keeps only the editor itself as a checked archive. Historical candidate reports remain in the release/verification documents; they describe prior states, not current dependency requirements.

## Verification

165 executable-source tests pass with 100% statements, branches, functions and lines. Strict types, lint, formatting, build and packed-consumer checks pass where applicable. Theme additionally passes real Chromium layout checks. The device example passes 16 browser tests and the private editor example passes 4.

Device 0.21.3 was blocked by a stale local Yarn lock resolution; its tag was retained. Device 0.21.4 was verified from a fresh checkout and empty cache, and its release guard rejects file/link lock resolutions. Theme 0.13.4 preserves the existing scrollbar patch without reverting newer shared layout fixes.

## Links

- [Repository](https://github.com/SignalSafeSoftware/simulator-core)
- [Editor example](https://signalsafesoftware.github.io/simulator-editor-react/)
- [Device example](https://signalsafesoftware.github.io/simulator-device/)
- [Related packages](links.md)
