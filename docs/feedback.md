I reviewed the accessible files in `SignalSafeSoftware/simulator-core`. Overall: **this package has the cleanest architecture boundary so far. It is truly headless, has only one runtime dependency, and the core runtime logic is small and understandable. The main gap is test visibility/coverage and the same release-safety issues that appear across the other packages.**

## Executive take

`@signalsafe/simulator-core` is correctly positioned as the runtime package: parse a `TreeSpecWire`, create immutable session state, step through choices, accumulate score deltas, resolve feedback, and return continue/ended results with no UI, React, routing, or transport. The package metadata says exactly that, and it depends only on `@signalsafe/tree-spec` at runtime.

The source barrel is appropriately small: it exports errors, result/session types, score utilities, wire parsing helpers, node-view helpers, and session lifecycle functions.

The runtime implementation is also clean: `createInitialTreeSpecSession` validates/parses the wire, sets the current node to `start_node`, initializes score, and starts empty history. `dispatchTreeSpecChoice` enforces current-node matching, finds the transition, applies deltas, resolves feedback, appends history, and returns either a continue result or terminal result.

The biggest issues:

1. **I could not find visible tests at the likely paths.**
2. **CI still allows publish from PR labels.**
3. **PR checks/tests are label-gated.**
4. **Standalone repo contains monorepo-relative scripts.**
5. **No visible `SECURITY.md` or `CHANGELOG.md`.**
6. **Runtime validation is good, but `treeSpecRuntimeIssues()` collapses all errors into one issue instead of returning granular issue locations.**

## Documentation advice

The README is already good. It explains the package purpose, install command, quick start, validation flow, multi-step flow, node inspection, result shapes, and examples.

I would add these sections.

### 1. Explicit “what this package does not do”

```md
## What this package does not do

`@signalsafe/simulator-core` does not render UI, store attempts, send analytics,
fetch scenarios, persist progress, enforce authentication, or choose which
scenario version to run. Hosts own transport, storage, identity, telemetry,
and presentation.
```

That reinforces the clean boundary you already have.

### 2. Backend parity section

`dispatchTreeSpecChoice` says it follows the backend `apply_decision` contract where the supplied node must match the current node.  Put that in the README:

```md
## Runtime contract

`dispatchTreeSpecChoice(state, nodeId, choiceId)` requires `nodeId` to match
`state.currentNodeId`. Passing a stale or out-of-order node id throws
`TreeSpecRuntimeError`.
```

This is important for client apps that may have stale UI state.

### 3. Error-handling example

Add a short example:

```ts
import {
  TreeSpecRuntimeError,
  dispatchTreeSpecChoice,
} from "@signalsafe/simulator-core";

try {
  const result = dispatchTreeSpecChoice(session, nodeId, choiceId);
} catch (err) {
  if (err instanceof TreeSpecRuntimeError) {
    console.error("Runtime contract failed:", err.message);
  } else {
    throw err;
  }
}
```

### 4. Validation guarantees

`parseTreeSpecRuntime` validates more than the base `tree-spec` linter: it checks root shape, non-empty `start_node`, `nodes` object, `transitions` array, legacy END normalization, lint errors, start node existence, transition source nodes/choices, and transition targets.

Document that:

```md
`parseTreeSpecRuntime` performs runtime validation, including:
- start node exists
- transitions are `[node_id, choice_id]`
- transition source node exists
- source choice exists on that node
- target node exists unless target is `END`
- terminal transitions have valid outcomes when dispatched
```

### 5. Score policy

`mergeScoreDelta` ignores missing/non-object deltas and treats non-number or `NaN` fields as zero.  This is a good design, but it should be explicit:

```md
Score deltas are additive. Missing categories default to zero. Non-numeric
or `NaN` category values are ignored as zero.
```

### 6. Raw links

The README includes a raw GitHub URL.  That is okay in README, but if you want polish, use markdown links consistently.

## Test advice

The Vitest config is set up correctly: Node environment, `tests/**/*.test.ts`, V8 coverage, `src/**` included, and LCOV output.  However, I could not fetch test files from likely paths such as `tests/session.test.ts`, `tests/index.test.ts`, or `tests/delta.test.ts`; they returned 404. That suggests either tests are absent, named differently, or not accessible through those paths.

For this package, tests should be very strong because the runtime is small and critical.

### 1. Session lifecycle tests

Add:

```ts
it("creates initial session at start_node")
it("initializes score to all zeros")
it("initializes empty history")
it("throws when start_node is missing")
it("throws when start_node does not exist in nodes")
```

### 2. Dispatch tests

`dispatchTreeSpecChoice` is the core API. Test:

```ts
it("throws when nodeId does not match currentNodeId")
it("throws when transition is missing")
it("returns continue result for non-END transition")
it("returns ended result for END transition")
it("sets currentNodeId to END after terminal transition")
it("appends history immutably")
it("does not mutate prior session state")
it("returns the next node view on continue")
it("applies only the selected transition's delta")
```

The implementation builds new session objects rather than mutating the old one, so immutability tests are important.

### 3. Score tests

`emptyScoreDelta` and `mergeScoreDelta` are simple but important. Test:

```ts
it("emptyScoreDelta returns all categories at zero")
it("mergeScoreDelta adds all known score categories")
it("mergeScoreDelta ignores missing delta")
it("mergeScoreDelta ignores non-object delta")
it("mergeScoreDelta treats NaN as zero")
it("mergeScoreDelta treats string values as zero")
it("mergeScoreDelta preserves negative deltas")
```

### 4. Wire parser tests

`parseTreeSpecRuntime` deserves detailed coverage because it protects runtime correctness. Test:

```ts
it("rejects non-object root")
it("rejects array root")
it("rejects missing start_node")
it("rejects empty start_node")
it("rejects non-object nodes")
it("rejects missing transitions")
it("normalizes legacy __END__ to END")
it("preserves _meta when it is an object")
it("preserves _ab when present")
it("rejects transition.from that is not a pair")
it("rejects transition from unknown node")
it("rejects transition from unknown choice")
it("rejects transition to unknown target")
```

The parser has specific logic for these cases.

### 5. Node view / feedback tests

`getTreeSpecNodeView` converts raw wire node data to renderer-friendly `NodeView`, defaulting missing type to `"prompt"`, missing prompt to `""`, choices to id/label, and invalid render hints to `{}`.

Test:

```ts
it("returns id, type, prompt, choices, render_hints")
it("defaults missing type to prompt")
it("defaults missing prompt to empty string")
it("returns empty render_hints for invalid hints")
it("throws for missing node")
it("supports legacy options")
```

Feedback resolution should test:

```ts
it("prefers transition feedback over choice feedback")
it("falls back to choice feedback")
it("returns null when no feedback exists")
it("filters red_flags to strings only")
it("ignores non-object feedback")
it("returns null for empty feedback object")
```

The transition-first feedback priority is encoded in `resolveFeedbackForTransition`.

### 6. Barrel and tarball tests

Add the standard package tests:

```ts
it("exports the public surface from package root")
```

And a CI smoke test:

```bash
yarn build
npm pack
mkdir /tmp/simulator-core-smoke
cd /tmp/simulator-core-smoke
npm init -y
npm install /path/to/signalsafe-simulator-core-*.tgz
node -e "import('@signalsafe/simulator-core').then(m => console.log(typeof m.createInitialTreeSpecSession))"
```

## Security and safety notes

### 1. Runtime package boundary is strong

This package has no UI peers, no React, no networking, no file system, and no transport dependency. `package.json` has only one runtime dependency, `@signalsafe/tree-spec`.  That is exactly right for a simulator core.

### 2. No obvious XSS surface

The code I reviewed returns strings and plain objects; it does not render HTML or use `dangerouslySetInnerHTML`. That is good. Keep HTML rendering/sanitization out of this package.

### 3. Validation failure granularity could improve

`treeSpecRuntimeIssues()` catches a thrown parse/runtime error and returns a single issue with only `{ severity: "error", message }`.  That is fine for a runtime guard, but for editor UI it is less helpful.

Consider adding a richer non-throwing validator later:

```ts
validateTreeSpecRuntime(spec): TreeSpecIssue[]
```

with node/choice metadata where possible:

```ts
{
  severity: "error",
  message: "Transition references unknown choice 'x' on node 'start'.",
  node_id: "start",
  choice_id: "x"
}
```

This would integrate better with your editor issue highlighting.

### 4. Add `SECURITY.md`

I did not find a visible `SECURITY.md`. Add one across the package set:

```md
# Security Policy

Please report suspected vulnerabilities privately.

Email: security@signalsafe.software

Do not open public issues for security reports.
```

### 5. Dependabot

Even with only one runtime dependency, add Dependabot for npm and GitHub Actions. This package is security-relevant by product domain, so supply-chain hygiene matters.

## Release / CI advice

The CI workflow has the same pattern as your other packages:

* Typecheck and tests run on push/manual, but PRs need labels like `checks` or `tests`.
* Publish can run from manual dispatch or a PR with a `publish` label.

I would change both.

### Safer PR checks

Run typecheck and tests on every PR:

```yaml
checks:
  if: github.event_name != 'pull_request' || true

tests:
  if: github.event_name != 'pull_request' || true
```

or simply remove the `if` conditions from those jobs.

### Safer publish

Do not publish from PR events. Prefer tags or manual `main` only:

```yaml
on:
  push:
    tags:
      - "simulator-core-v*"
```

or:

```yaml
publish:
  if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'
  environment: npm-production
  permissions:
    contents: read
    id-token: write
```

Also consider npm provenance/trusted publishing.

## Packaging advice

The metadata is mostly good: ESM, declaration output, `exports`, `sideEffects: false`, Node `>=18`, and published files limited to `dist`, README, and LICENSE.

I would change:

### 1. Add `packageManager`

```json
"packageManager": "yarn@1.22.22"
```

### 2. Remove or rename monorepo-only scripts

Scripts like `release:check`, `publish:preflight`, `pack:check`, `smoke:external`, and `test:monorepo` reference `../../scripts` or `../../frontend`.  In a standalone repo, that is likely confusing or broken for contributors.

Either vendor the scripts into this repo or rename them clearly:

```json
"internal:release:check": "...",
"internal:test:monorepo": "..."
```

### 3. Reconsider `prepare`

`prepare` runs `npm run build`.  For a small package, this is not disastrous, but `prepublishOnly` is usually enough unless you intentionally support installing from GitHub source.

### 4. Node matrix

The package claims Node `>=18`, but CI uses Node 24 only.   Add Node 18/20/22/24 matrix or at least test the minimum supported Node 18.

## Code-quality observations

### 1. `parseTreeSpecRuntime` is doing useful validation that should perhaps move down

`simulator-core` validates things that `tree-spec` itself apparently does not fully validate yet: transition source node exists, choice exists, target exists, start node exists.

That is fine for runtime safety, but long term I’d consider moving these structural graph checks into `@signalsafe/tree-spec`’s linter so editor/runtime/server all share one source of truth.

### 2. Terminal outcome validation happens at dispatch time

A transition to END with invalid/missing outcome is rejected when dispatching, via `expectTerminalOutcome`.   Since `parseTreeSpecRuntime` already calls `lintTreeSpecWire`, this may already be caught earlier if the lower linter flags it. Keeping dispatch-time validation is still good defense-in-depth.

### 3. `getWireChoices` stringifies IDs and labels

`getWireChoices` returns `String(c.id)` and `String(c.label)`.  This is forgiving, which helps with legacy content, but it can hide malformed authoring data. Runtime can be forgiving, but editor validation should flag non-string choice IDs/labels.

### 4. `Object.hasOwn` and Node 18

`parseTreeSpecRuntime` uses `Object.hasOwn`.  Node 18 supports it, so this is okay with your engine requirement. Good.

### 5. `mergeScoreDelta` ignores `Infinity`

The score merge treats a value as valid if it is `number` and not `NaN`.  That means `Infinity` and `-Infinity` would be accepted. I would change to `Number.isFinite(v)`:

```ts
return typeof v === "number" && Number.isFinite(v) ? v : 0;
```

This avoids bad score states from malformed content.

## Priority checklist

I’d do this order:

1. **Add or confirm real unit tests** for session, wire parsing, score deltas, node views, feedback resolution, and package exports.
2. **Change `mergeScoreDelta` to require finite numbers**, not just non-`NaN`.
3. **Remove PR-label publishing**; publish from tags/releases/manual `main` with approval.
4. **Run typecheck/tests on every PR.**
5. **Add Node 18 test coverage** since the package claims Node `>=18`.
6. **Add `SECURITY.md` and `CHANGELOG.md`.**
7. **Fix standalone repo scripts that reference `../../scripts` and `../../frontend`.**
8. **Add tarball smoke test in CI.**
9. **Document runtime validation guarantees and state mismatch behavior.**
10. **Consider moving richer graph validation into `@signalsafe/tree-spec` so runtime/editor/server share it.**

My honest assessment: **the runtime design is solid and appropriately small. I would trust the architecture, but I would not call it production-stable until the tests and release workflow are tightened.**
