# simulator-core current-state summary

Prepared source version: **0.7.2** (2026-11-10). This is not a claim of npm publication.

- Add typed starting-position targets for individual records and Vault folders.
- Support a unified authored calls collection and offline legacy-call migration; reject mixing canonical and legacy phone collections.
- Preserve sender numbers, voicemail numbers, unknown mail dates and authored custom mailbox folders.
- Retain the merged executable JSON rule, bounded-validation and schema/fixture export changes.

## Coordinated versions

| Package | Prepared version |
| --- | --- |
| `@signalsafe/simulator-core` | `0.7.2` |
| `@signalsafe/simulator-react` | `0.21.2` |
| `@signalsafe/simulator-device` | `0.21.3` |
| `@signalsafe/simulator-theme-bootstrap` | `0.13.3` |
| `@signalsafe/simulator-editor-react` | `0.1.0` |

The source includes the current GitHub main branch plus the reviewed local simulator work. Existing merged release fixes are preserved. Source manifests and packaged declarations use the coordinated version set. See [release preparation](release-2026-11-10.md) for dependency and verification status.
