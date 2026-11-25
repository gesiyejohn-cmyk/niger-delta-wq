# Controlled integration plan — Niger Delta WQ

**Prepared:** 25 November 2026  
**Purpose:** Promote the tested integrated application to the production source path without replacing the user's existing app, publishing unverified code, or merging a highly divergent branch wholesale.

## Verified repository state

- Repository: `gesiyejohn-cmyk/niger-delta-wq`
- Production base: `main`, current comparison SHA `aa9a5f6e0da0d84477f2ab00d040a2f1bbda9fe7`
- Tested integrated branch: `feature/external-reference-validation`, current tested application SHA `a9de8b35f63748fae2a75e7582bff738c0c1626c`
- Comparison: `main...feature/external-reference-validation` is **diverged**, 449 commits ahead and 4 behind. This is not a safe candidate for a direct merge.
- The main `.github/workflows/build.yml` extracts `NDWQ-Source-Compact.zip` and builds all three platforms from that extracted source. Its `deploy-pages` job has no explicit main-ref guard.
- The feature branch's `.github/workflows/upgrade-build.yml` applies `upgrade/src` and `upgrade/tests` as an overlay to the compact source, then builds and tests the integrated app. Its successful CI run is [45670393746](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45670393746).
- Latest verified test result: **261 passed, 0 failed**. Web, Android and Windows CI jobs all succeeded.

## Promotion strategy

Use a **new integration branch based on the current `main`**, not a merge of the 449-commit feature history. Carry only the minimum required source overlay, build workflow, scripts, tests and release documentation. Keep the compact source archive as an immutable base input until a separate, explicit source-of-truth decision replaces it.

### Stage 1 — Freeze and inventory inputs

1. Record the exact `main` commit and compact archive SHA-256 used by the candidate integration run.
2. Record the exact tested overlay commit and inventory the overlay files required by the build.
3. Verify that no secrets, local data, user records or production signing material are included in the integration payload.
4. Keep PR #2 and PR #6 untouched; do not use them as integration shortcuts.

**Exit condition:** a reproducible manifest ties the base archive, overlay commit and resulting build to immutable hashes.

### Stage 2 — Build a minimal integration branch

1. Create a fresh branch from the latest `main`.
2. Add the `upgrade/src`, `upgrade/tests` and only the scripts/docs required to apply and validate the overlay.
3. Add the integrated CI workflow and adapt the production build workflow so web, Android and Windows all consume the same overlay.
4. Add an explicit `github.ref == 'refs/heads/main'` guard to production Pages deployment. Feature branches and pull requests must never publish production Pages.
5. Preserve the existing application ID `com.nigerdeltawq.mobile`; do not change package identity or storage schema as part of workflow integration.

**Exit condition:** the integration branch is based on current main, contains only reviewed integration payload, and cannot deploy Pages from a non-main ref.

### Stage 3 — Verify the exact integrated candidate

1. Run all automated tests and the production web build.
2. Build Android and Windows from the same resolved source tree.
3. Run Android API 35 emulator launch and dashboard visual checks.
4. Validate artifact ZIP integrity and record APK/installer/web/source artifact hashes.
5. Compare the resolved source manifest used by each platform job; fail if platform inputs differ.
6. Confirm the Pages deployment job is skipped on the integration branch and only eligible on main.

**Exit condition:** all required CI jobs pass on the exact candidate commit, with artifact and source hashes recorded.

### Stage 4 — Review and promote

1. Open a focused pull request from the integration branch to `main`.
2. Review the complete diff and workflow permissions, especially Pages deployment.
3. Merge only after the exact PR head has passing required checks and the source manifest matches the tested candidate.
4. Run the production-main workflow and verify the published site in a browser before claiming public release.

**Exit condition:** main builds the integrated source, deployment is verified, and rollback instructions are available.

## Release gates that this integration does not waive

- Android production signing and signer compatibility with the user's currently installed app remain unverified. Never uninstall, overwrite, clear app data, or install a debug APK as a substitute.
- Physical Android acceptance remains outstanding.
- Windows physical installation/runtime and code signing remain outstanding.
- Real-device backup/restore acceptance remains outstanding.
- Independent scientific review and local calibration remain outstanding.
- Formal release approval remains outstanding.

No new APK installation is requested for this integration work. A successful CI build is not, by itself, production release approval.
