# Integrated release-candidate acceptance checklist

**Candidate branch:** `integration/ndwq-main-overlay`  
**Latest integrated candidate validation:** [Run 45695844553](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45695844553) — candidate commit `506984f61e800da2202c1413d75255af93e2770a`, completed successfully on 25 November 2026. All three jobs passed, including the Windows packaged-app runtime smoke test and Android original-identity emulator launch plus isolated preview APK build. This checklist update is documentation-only; the validated application source and pinned overlay are unchanged.  
**Acceptance status:** Automated three-platform candidate CI passed; manual, production-signing, scientific-review, and release-authorization gates remain open.

This checklist separates automated build confidence from evidence that the application is safe and usable on real devices. A checked CI item must not be treated as proof of physical-device, production-signing, or scientific validation.

## 1. Automated candidate evidence

- [x] Latest candidate commit `506984f61e800da2202c1413d75255af93e2770a` passed all three jobs in [run 45695844553](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45695844553).
- [x] Web/scientific/geophysics test job passed and production web build completed.
- [x] Android debug APK built; package identity and debug certificate recorded.
- [x] Original-identity APK launched in the CI emulator; the smoke test verified the app process and resumed activity and captured screenshot evidence.
- [x] Isolated side-by-side Android preview APK built and emulator-smoke-tested.
- [x] Windows desktop installer built and uploaded; the packaged Electron executable startup smoke test passed.
- [x] Source-provenance manifest generated and uploaded.
- [x] All five expected artifacts uploaded by the cited run.

**Latest run artifact inventory** (CI artifacts; none is a production-signed release package):

| Artifact | Artifact ID | Size | SHA-256 |
|---|---:|---:|---|
| Android debug APK bundle (original + isolated preview, metadata and emulator evidence) | `15060338844` | 8,540,642 bytes | `ab5a4f556c2b996c5c9d0cbcd1d6da7a062bbcecb4bd9b513ae07091ecd31c05` |
| Windows desktop installer | `15060677919` | 95,619,876 bytes | `62b4f4785515f367d8351260a0cb86726f2cd20356e60a8ecb91ba090053cc84` |
| Source provenance | `15060288172` | 3,554 bytes | `ee758e500531766a9adc67208b2b164aa82241a20fec77435a3e530e8e90dead` |
| Integrated web build | `15061475948` | 351,319 bytes | `f75213d88cd5c0c712fc150d6eefdfec1eb25db02a75b67203828b8e80ad7dd1` |
| Integrated source | `15060043693` | 185,023 bytes | `847e428f346abdd19d3464dcd518b3fa191088c9efc2aba40801bb638e4dde5c` |

The latest run's three jobs completed successfully. All five artifacts from run 45695844553 were independently downloaded, ZIP-integrity checked, and their SHA-256 digests matched the GitHub artifact digests. The earlier run 45689659045 recorded 262 tests passed, but that count is not carried forward as a measured count for this later commit.

## 2. Android safe-update and device acceptance

See [Android signing readiness and safe-update gate](ANDROID-SIGNING-READINESS.md) for the detailed signing-model distinction, required evidence, and stop conditions.

**Do not install a CI debug APK as an update to the existing app. Do not uninstall the existing app, clear its data, or overwrite its storage to perform these checks.**

- [ ] Identify the exact installed package ID and version on the target device; expected package ID: `com.nigerdeltawq.mobile`.
- [ ] Independently obtain the installed app's signing-certificate SHA-256 fingerprint from the installed APK or trusted release record.
- [ ] Confirm the intended distribution model: direct APK signing or Google Play App Signing. Do not confuse a Play upload key with the Play app-signing key.
- [ ] Configure production signing material only in protected CI secrets; never commit, chat, log, or artifact keystore material or passwords.
- [ ] Run `upgrade/scripts/android-release-signing-preflight.sh` and retain only non-secret pass/fail evidence.
- [ ] Build a release-signed candidate with a higher `versionCode`; verify package ID and inspect it with `apksigner verify --print-certs`.
- [ ] Confirm the final APK certificate fingerprint matches the correct installed-app signing identity before considering an update.
- [ ] On a separate test device or isolated test installation, verify launch, navigation, coordinate entry (DD/DMS/DDM), sample capture, charts, ERT touch pan/pinch, offline use, and recovery after app restart.
- [ ] Verify backup export, preview, merge restore, and replace restore using disposable test records; confirm merge preserves existing IDs and replace affects only stores present in the backup.
- [ ] Confirm no data loss, crash, blocked navigation, or unexpected permission/network behavior; record device model, Android version, app version, test date, and evidence.

**Stop condition:** if the installed certificate, signing lineage, package identity, or backup integrity is uncertain, do not install or update the existing app.

## 3. Windows desktop acceptance

- [ ] Install and launch the candidate in a clean test environment without changing production user data.
- [ ] Confirm the Windows CI runtime smoke test passes on the final candidate commit: **passed in run 45695844553**. It launches the packaged Electron executable from `release/win-unpacked`, checks that it remains alive for the startup window, and terminates the test process.
- [ ] Verify startup, navigation, local persistence, backup/restore, file import/export, and graceful offline behavior.
- [ ] Verify installer identity, version, architecture, dependencies, and upgrade/uninstall behavior in the test environment.
- [ ] Decide whether code signing is required for distribution; if so, verify the publisher signature and timestamp on the final installer.
- [ ] Record Windows edition/build, architecture, installer hash, test date, and results.

The Windows CI job now adds a bounded packaged-application startup smoke test before uploading the installer. This exercises the unpacked Electron application executable, not the NSIS installer installation flow. It does not replace interactive installer, upgrade/uninstall, code-signature, or real-user acceptance.

## 4. Web acceptance and deployment

- [ ] Serve the exact integrated web artifact from a clean environment and verify core routes, refresh/deep links, responsive layouts, and browser console/network errors.
- [ ] Verify coordinate input, map rendering, charts, data export/import, and offline/poor-network behavior in supported browsers.
- [ ] Confirm deployment credentials, domain/base-path configuration, and rollback procedure.
- [ ] Verify the production deployment workflow is restricted to the intended production branch.
- [ ] Perform a controlled deployment only after review approval; verify the public URL and retain rollback evidence.

The integration candidate has not been deployed to production. The repository's Pages deployment job is guarded to run only for `refs/heads/main`. A manual `workflow_dispatch` from `main` can also reach that deployment job; dispatching the workflow from another branch builds and uploads artifacts but does not deploy Pages. Treat a manual dispatch on `main` as a production deployment action and require the same review and approval as a main-branch push.

## 5. Scientific, GIS, and data-quality review

- [ ] Independently review WQI parameter units, limits, ideal values, missing-data handling, and displayed interpretation against the selected standard.
- [ ] Review DRASTIC ratings/weights and clearly label screening classes as provisional unless locally calibrated.
- [ ] Confirm coordinate datum/CRS is explicit; test DD, DMS, DDM, hemisphere signs, UTM zone handling, and known control points.
- [ ] Confirm ERT pseudosection interpolation is labelled as interpolation, not inversion; manual geological interpretation is clearly distinguished from computed inversion.
- [ ] Review hydrochemical diagram input units and labels; disclose that Gibbs TDS proxy is not measured TDS.
- [ ] Review interpolation boundaries, sparse-data behavior, uncertainty, and limitations before interpreting vulnerability maps.
- [ ] Obtain independent environmental/geoscience review of representative outputs before using them for regulatory, public-health, or engineering decisions.

## 6. Release decision record

A release may be approved only when every applicable gate above has evidence and named reviewer approval.

| Gate | Evidence required | Status |
|---|---|---|
| Automated CI | Successful run on final candidate SHA | Passed for `506984f61e800da2202c1413d75255af93e2770a`; run 45695844553 |
| Android identity/signing | Installed certificate, signing model, matching release APK | Open |
| Android physical-device | Non-destructive test record and backup/restore evidence | Open |
| Windows runtime/signing | Test record and final installer verification | Open |
| Web deployment | Browser acceptance, deployment and rollback evidence | Open |
| Scientific review | Independent review and documented limitations | Open |
| Release authorization | Explicit approval of final artifacts and version | Open |

**Current decision: NOT APPROVED FOR PRODUCTION DISTRIBUTION.** The latest validated candidate (`506984f61e800da2202c1413d75255af93e2770a`) has successful three-platform CI evidence in run 45695844553, including the Windows packaged-app startup smoke test and Android original-identity emulator launch/isolated preview build. Production signing, physical-device acceptance, interactive Windows installer/upgrade/uninstall and signing checks, public deployment, independent scientific review, and release authorization remain open.

## 7. Safety and scope notes

- No production signing credentials or existing-app certificate fingerprint have been supplied or verified.
- CI debug APKs are for isolated testing only; do not use them to update the existing installation.
- No production deployment or merge to `main` is authorized by this checklist.
- Pull requests #2, #3, and #6 remain outside this integration candidate and must not be wholesale-merged as a shortcut.
- The next Android milestone is a verified production-signing identity plus a non-destructive device/backup test record, not another debug APK installation.
