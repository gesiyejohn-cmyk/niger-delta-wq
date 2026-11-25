# NDWQ clean-main integration inventory

**Status:** staging inventory only; no production integration has been applied.

## Frozen production baseline

- Repository: `gesiyejohn-cmyk/niger-delta-wq`
- Base branch: `main`
- Base commit: `aa9a5f6e0da0d84477f2ab00d040a2f1bbda9fe7`
- Compact source archive: `NDWQ-Source-Compact.zip`
- Archive Git blob: `5b13a5f77b7ea06384855d040840ff5609b24f23`
- Archive size: 42,425 bytes
- Baseline workflow: `.github/workflows/build.yml`

## Candidate upgrade overlay

- Candidate branch: `feature/external-reference-validation`
- Candidate source commit at inventory time: `85e17569913d43fb89d59662bc45a9fc90e63f25`
- Overlay paths: `upgrade/src`, `upgrade/tests`, `upgrade/scripts`
- Inventory: 71 files, 405,352 bytes
- Candidate overlay is not merged into this branch. The feature branch is substantially diverged from `main`; only individually reviewed paths are to be transferred.

## Build and release risks identified

1. The production workflow currently extracts only `NDWQ-Source-Compact.zip`; it does not apply the candidate overlay.
2. The Pages deployment job has no explicit `refs/heads/main` guard.
3. The candidate validation workflow builds Web, Android, and Windows from a compact archive plus the same overlay, but it is not yet the production workflow.
4. Android release signing compatibility, physical-device acceptance, Windows runtime/signing acceptance, backup/restore device acceptance, and independent scientific review remain separate release gates.

## Next controlled actions

1. Review the candidate overlay file-by-file against the compact source and identify any required integration script dependencies.
2. Transfer only the reviewed source and test files to this clean branch.
3. Update one production build workflow so Web, Android, and Windows all build the exact same resolved source tree; guard Pages deployment to `main`.
4. Run all release checks from this branch and publish a provenance manifest before opening a focused pull request.

No APK installation, production deployment, branch merge, or data migration is authorized by this inventory.


## Clean-baseline three-platform validation — 25 November 2026

The pinned upgrade overlay was validated against the clean `main` baseline by workflow run [45674603595](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45674603595), at integration branch commit `333447fa6480e5749fca8fd2fe04bc7781a6546c`.

- Web and scientific/geophysics test job: passed; TAP summary reported 261 tests and 0 failures.
- Web production build and integrated-source packaging: passed.
- Android job: passed, including original-identity emulator launch and preview build.
- Windows desktop installer build: passed.
- Published artifacts: integrated source, source provenance manifest, Android debug APK package, Windows desktop installer, and Web build.
- The provenance manifest records the clean-base archive SHA-256 and SHA-256 entries for the overlay source, tests, and scripts.
- Comparison against base `aa9a5f6e0da0d84477f2ab00d040a2f1bbda9fe7`: 5 commits ahead, 0 behind; only three paths changed — the Pages deployment guard, this integration workflow, and this inventory document.

This is a successful clean-baseline CI integration milestone. It is not a production merge, signed release, physical-device acceptance, or public deployment. The integration branch remains isolated from `main`.


## Selective ERT touch-navigation integration — 25 November 2026

The clean-baseline release-candidate workflow was updated to pin the separately reviewed ERT overlay at commit `6365a3677274c5385e4b62148592948d23c95a09`, rather than importing the diverged feature branch wholesale. The pin update is recorded in workflow commit `c3509d4c14bdcc5a06b2cadda4e2ecaabaf3ad41`.

- Selectively transferred ERT source: `upgrade/src/pages/ERTTomogram.jsx`.
- Selectively transferred regression tests: `upgrade/tests/ert-tomogram-accessibility.test.js`.
- Interaction additions include mobile touch pan, two-finger pinch zoom, and mouse-wheel zoom.
- Existing `selectedDistance` and `onCellSelect` integration hooks and selected-cell marker behavior were retained.
- Integrated clean-baseline workflow run [45682468365](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45682468365): all three jobs passed.
- Web/test job: 262 tests passed, 0 failed.
- Android: debug APK built; APK identity/certificate recorded; original-identity APK launched in emulator; side-by-side preview APK built; artifact upload passed.
- Windows desktop: installer build passed.
- Artifacts uploaded: `ndwq-integrated-android-debug-apk` (8,535,940 bytes), `ndwq-integrated-source` (180,652 bytes), `ndwq-integrated-web` (351,319 bytes), `ndwq-integrated-windows-desktop` (95,615,683 bytes), and `ndwq-source-provenance` (3,515 bytes).

This closes the selective ERT overlay's clean-baseline three-platform CI validation gate. It does not constitute a production merge, production signing, physical-device acceptance, Windows signing/runtime acceptance, or public deployment. No APK installation was requested or performed; `main` remains untouched and PRs #2, #3, and #6 remain unmerged.
