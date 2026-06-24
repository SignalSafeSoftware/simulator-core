# Releasing @signalsafe/simulator-core

Headless TreeSpec session runtime (`npm install @signalsafe/simulator-core`). Depends on **`@signalsafe/tree-spec`** — publish or pin that package first.

**Monorepo source of truth:** `packages/simulator-core` in [DeliveryPlus](https://github.com/SignalSafeSoftware/DeliveryPlus). Sync to the public repo before each release.

## One-time setup

### 1. GitHub repository

```bash
bash scripts/push-standalone-npm-package.sh simulator-core --create-repo
```

Remote: `https://github.com/SignalSafeSoftware/simulator-core`

Use SSH (`git@github.com:SignalSafeSoftware/simulator-core.git`), not HTTPS, for pushes.

### 2. npm

1. `npm login` and confirm `@signalsafe` org publish access.
2. Optional: npm **trusted publishing** for this GitHub repo, or `NPM_TOKEN` in GitHub environment **`npm`**.

## Release workflow

1. **Develop** in `packages/simulator-core` (monorepo).
2. **Bump** `@signalsafe/tree-spec` range in `dependencies` if needed.
3. **Bump** version in `package.json`.
4. **Test:** `make package area=simulator-core type=verify` (monorepo) or `npm ci && npm test && npm run build` (standalone).
5. **Sync:** `bash scripts/push-standalone-npm-package.sh simulator-core`
6. **Publish:** `npm publish --access public` from standalone clone, or create a GitHub **Release** (triggers `publish.yml`).

## Pre-release checks (standalone)

```bash
npm ci
npm run typecheck
npm test
npm run build
npm publish --dry-run
```

Tarball should include only `package.json`, `README.md`, `LICENSE`, and `dist/**`.
