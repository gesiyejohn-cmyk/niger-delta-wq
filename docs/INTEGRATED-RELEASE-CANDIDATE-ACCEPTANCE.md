# Integrated release-candidate acceptance checklist

**Candidate branch:** `integration/provenance-schema2`  
**Latest integrated candidate validation:** [Run 45709672813](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45707740106) — candidate commit `493302c107cd5753b256739ef9e82a7869a98777`, completed successfully on 25 November 2026. All three jobs passed. Android artifact-bundle identity/signature/evidence checks and checksum generation also passed. The application source and pinned overlay were not changed by this CI-hardening commit.  
**Acceptance status:** Automated three-platform candidate CI and independent Android artifact integrity verification passed; manual, production-signing, scientific-review, and release-authorization gates remain open.

This checklist separates automated build confidence from evidence that the application is safe and usable on real devices. A checked CI item must not be treated as proof of physical-device, production-signing, or scientific validation.

## 1. Automated candidate evidence

- [x] Candidate commit `493302c107cd5753b256739ef9e82a7869a98777` passed all three jobs in [run 45709672813](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45707740106).
- [x] Web/scientific/geophysics test job passed and production web build completed.
- [x] Android debug APK built; package identity and debug certificate recorded.
- [x] Original-identity APK launched in the CI emulator; the smoke test verified the app process and resumed activity and captured screenshot evidence.
- [x] Isolated side-by-side Android preview APK built.
- [x] Android artifact verification gate passed: both APK identities and signatures checked, emulator screenshot/UI evidence confirmed, and an internal `SHA256SUMS` file generated and checked.
- [x] Windows desktop installer built and uploaded; packaged Electron startup smoke test, installer metadata generation, and installer checksum verification passed.
- [x] Source-provenance manifest generated and uploaded.
- [x] All five expected artifacts uploaded by the cited run, including the Android debug bundle, Windows installer, source provenance, integrated web build, and integrated source.
- [x] Android and Windows artifacts independently downloaded; both ZIP integrity checks and GitHub artifact SHA-256 comparisons passed. All eight Android internal checksums and the Windows installer checksum passed.

**Run 45709672813 artifact inventory** (CI artifacts; none is a production-signed release package):

| Artifact | Artifact ID | Size | SHA-256 |
|---|---:|---:|---|
| Android debug APK bundle (original + isolated preview, metadata and emulator evidence) | `15067790525` | 8,540,014 bytes | `2b57d89bd4ba652115332daa8556c5fac90fa2e23080dd976bf9520958d52b03` |
| Windows desktop installer | `15067107135` | 95,620,345 bytes | `0edb07a77fd34de3a45cb553ba652e25343758e26eb911619d4e97c91d4ad47c` |
| Source provenance | `15067655261` | 3,551 bytes | `10ffd7431f89c409112fb5182839ecc0f05457934210ed5a3273f50144a7c5e9` |
| Integrated web build | `15065789902` | 351,319 bytes | `da89dceb520cb71b16a2cf18e14d29298760c01a56db77943e0c631f0f65330d` |
| Integrated source | `15065954492` | 185,514 bytes | `d3a0b2fc62d64a498d12986903bfa979694f137802f71ceb20b27e1270525f6c` |

All three jobs in run 45709672813 completed successfully. The Android bundle was independently downloaded: its ZIP SHA-256 matched GitHub's artifact digest, ZIP integrity passed, and all eight internal file checksums passed. Its metadata records package IDs `com.nigerdeltawq.mobile` and `com.nigerdeltawq.mobile.preview34`; both APKs are debug-signed, not production-signed. The Windows bundle was also independently downloaded: its ZIP SHA-256 matched GitHub's artifact digest, ZIP integrity passed, and the installer checksum passed. Its metadata records product `Niger Delta WQ`, file/product version `1.0.0`, and Authenticode status `NotSigned`. The source, web, and platform artifacts are inventoried above; only Android and Windows bundles were independently downloaded and rechecked in this pass. No test count is asserted because the run output did not expose a measured test total.

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
- [ ] Confirm the Windows CI runtime smoke test passes on the final candidate commit: **passed in run 45709672813**. It launches the packaged Electron executable from `release/win-unpacked`, checks that it remains alive for the startup window, and terminates the test process.
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
| Automated CI | Successful run on final candidate SHA | Passed for `493302c107cd5753b256739ef9e82a7869a98777`; run 45709672813 |
| Android identity/signing | Installed certificate, signing model, matching release APK | Open |
| Android physical-device | Non-destructive test record and backup/restore evidence | Open |
| Windows runtime/signing | Test record and final installer verification | Open |
| Web deployment | Browser acceptance, deployment and rollback evidence | Open |
| Scientific review | Independent review and documented limitations | Open |
| Release authorization | Explicit approval of final artifacts and version | Open |

**Current decision: NOT APPROVED FOR PRODUCTION DISTRIBUTION.** The latest validated candidate (`493302c107cd5753b256739ef9e82a7869a98777`) passed all three CI jobs in run 45709672813. Evidence includes Android original-identity emulator launch, isolated preview APK build, Android artifact integrity/checksum verification, Windows packaged-app startup smoke test, Windows installer metadata and checksum verification, and successful web/scientific test/build job. Production signing, physical-device acceptance, interactive Windows installer/upgrade/uninstall and code-signing checks, public deployment, independent scientific review, and release authorization remain open.

## 7. Safety and scope notes

- No production signing credentials or existing-app certificate fingerprint have been supplied or verified.
- CI debug APKs are for isolated testing only; do not use them to update the existing installation.
- No production deployment or merge to `main` is authorized by this checklist.
- Pull requests #2, #3, and #6 remain outside this integration candidate and must not be wholesale-merged as a shortcut.
- The next Android milestone is a verified production-signing identity plus a non-destructive device/backup test record, not another debug APK installation.
