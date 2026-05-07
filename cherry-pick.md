# Cherry-Pick Workflow

## Context
PR: https://github.com/step-security/create-pull-request/pull/39

This repository is a secure drop-in replacement for an upstream action. We cherry-pick selected changes from upstream while maintaining our own identity and release process.

## Steps

### 1. Read the Cherry-Pick Verification Report
- Open the PR above and find the comment posted by the GitHub Actions bot titled **"Cherry-Pick Verification Report"**.
- This report lists the two upstream versions being compared and indicates which commits have already been cherry-picked.

### 2. Identify the upstream repository
- Go to the homepage of this repo.
- In the **About** section, you will see a description like *"Secure drop-in replacement for ..."* — the upstream repo name is in that description.
- Open the upstream repo and navigate to the comparison view between the two versions referenced in the report.

### 3. Cherry-pick the missing commits
Cherry-pick only the commits listed as **not yet done** in the verification report, applying the rules below.

## Rules

### Always cherry-pick
- **Version upgrades** of dependencies in `package.json` (even though `package.json`/`package-lock.json` aren't cherry-picked via script, version bumps from upstream should be brought over manually).
- **ESM / module-system conversion changes** in `package.json` and related config files — e.g., adding `"type": "module"`, updating `test` scripts to point at the new `jest.config.cjs`, etc. When upstream converts the action to an ES module, bring those structural changes too, not just version bumps.
- **Renames driven by ESM conversion** — e.g., `jest.config.js` → `jest.config.cjs`. These show up in the bot's "Missing Files" list and must be applied to keep tests/build working.
- **Workflow file version upgrades** — these are fine to apply manually since workflow files are not cherry-picked by the script and are not listed in the report.

### Never cherry-pick
- **Author/maintainer name changes** — this project is maintained under our own name; do not import upstream branding or author references. In `package.json`, keep our `repository` field (`step-security/...`) and never overwrite it with upstream's value.
- **Markdown docs** like `CONTRIBUTING.md`, `CLAUDE.md`, `CHANGELOG.md`, and similar meta-docs.
- **Our own release process files** — e.g., `actions_release.yml` is ours; never overwrite it with upstream changes. The same applies to any other file that exists only in our repo.
- **Workflow files via script** — we don't cherry-pick workflow files through the automated script, and they aren't listed in the verification report.

### Use judgment
- Some files exist in upstream but **not in our repo**. This usually means we previously chose not to cherry-pick them or deleted them as unnecessary. Evaluate each case — don't reintroduce a file just because upstream changed it.

## After cherry-picking
- Run install and build to verify everything compiles and the dist artifacts are up to date.
