> Follow-up: [November 11 verification and examples](verification-2026-11-11.md) supersedes the earlier package coverage status below.

# Verification of the combined release source

2026-11-10, Node 24.16.0. Source is based on the current fetched GitHub main branch plus local simulator changes, verified in isolated checkouts. The original dirty checkouts were preserved.

- 165 package tests passed. Across all five packages, 1,346 tests passed.
- Strict source/test types and lint/module checks passed for TypeScript packages. Theme's four executable tests passed.
- All four TypeScript package outputs built. One isolated consumer installed all five exact npm-packed candidates and passed runtime rendering and starting-position checks.
- Dependencies were mapped to the coordinated compiled candidates for this local verification. The merged Zod minimum 4.6.7 was installed separately for these checks; this is not a clean registry/frozen-lock certification.
- Core coverage: statements, lines, functions and branches 100%; the full configured gate passed.
- React coverage: statements 99.59%, lines 99.73%, functions 99.71%, branches 98.86% (100% required).
- Device coverage: statements 98.76%, lines 98.85%, functions 98.86%, branches 97.06% (100% required).
- Editor's configured coverage gate passed. Thresholds were not lowered.

The React/device coverage failures block release. GitHub Actions, Sonar, clean registry installs, browser layout gates and the hosted package runtime matrix have not been certified for these branches. Earlier actual-editor testing is evidence for the local fixes before upstream integration, not a new full browser pass for this combined source.

The prepared versions are absent from npm. Dependent registry lockfiles and published-demo/host dependency pins intentionally remain at their last real registry versions until dependency-order publication is authorized and succeeds. Draft branches are reviewable source preparation, not publish-ready releases. No release tags, npm publication or deployment were performed.
