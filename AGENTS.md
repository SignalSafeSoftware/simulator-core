# Development rules

## Public module contract

Import from the declaring module through explicit package subpaths. There is no root barrel. Core owns domain contracts and built-in app/screen constants; React owns reusable behavior and presentation; device owns composition. Do not add re-exports, alias wrappers, or forwarding-only modules. Browser page IDs remain case-sensitive author data. Run `yarn check:modules`, strict typechecks, lint, tests, build, and `yarn smoke:package` for package boundary changes. Every package typecheck includes tests. Update both host imports and artifact pins together.

Local integration tarballs must be allowlisted and recorded with SHA-256 in `vendor/npm/manifest.json`; run `yarn check:artifacts` before building. Never publish file-based dependencies: `yarn check:release` must pass before publication. These audit prereleases are local and unpublished.

## Canonical input and presentation contracts

Follow MIGRATION.md. Do not restore the synthetic template conversion, label-derived call kinds, old phone-shell CSS selectors, Bootstrap tone aliases, or old serialized field readers. Migrations belong in offline tooling, outside runtime code. Update package owner imports, both hosts, tests and theme together. Preserve distinct telemetry/navigation and editable-value/datasource behavior.
