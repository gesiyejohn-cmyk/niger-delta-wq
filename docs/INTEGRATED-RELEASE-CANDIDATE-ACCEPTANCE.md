# Integrated release-candidate acceptance checklist

**Candidate branch:** `integration/ndwq-main-overlay`  
**Latest integrated candidate validation:** [Run 45697318725](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45697318725) — candidate commit `50cacab0c8ce3aa71c2020463155467eb553d48a`, completed successfully on 25 November 2026. All three jobs passed, including the Windows packaged-app runtime smoke test and Android original-identity emulator launch plus isolated preview APK build. This checklist records the latest completed integrated candidate validation; application source and pinned overlay are unchanged.  
**Acceptance status:** Automated three-platform candidate CI passed; manual, production-signing, scientific-review, and release-authorization gates remain open.

This checklist separates automated build confidence from evidence that the application is safe and usable on real devices. A checked CI item must not be treated as proof of physical-device, production-signing, or scientific validation.

## 1. Automated candidate evidence

- [x] Latest candidate commit `50cacab0c8ce3aa71c2020463155467eb553d48a` passed all three jobs in [run 45697318725](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45697318725).
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
| Android debug APK bundle (original + isolated preview, metadata and emulator evidence) | `15062695488` | 8,540,325 bytes | `6b812afbc7fcf65f453b34e4ee4a382d792a888096ee6bdd86fe5d5c0c00e1d9` |
| Windows desktop installer | `15060904863` | 95,619,759 bytes | `9ee3708bb11f958ef6d141622d8fb4a44238b77f4aea91a4af6fbfc3f07bf438` |
| Source provenance | `15061498437` | 3,554 bytes | `b7c57bc47b9f70877ade0d4e46b8d207612cd92eeebaadc9ffd701ce91c454b1` |
| Integrated web build | `15062087084` | 351,319 bytes | `46d8953e4aea953cd29b94c4f89859370febb5612810cc08de5d50463f07ed4b` |
| Integrated source | `15061732976` | 185,034 bytes | `839fd7455d80a1d44014ff84c2489b8d9f90aa4ae66f8739dad8508f883ea34a` |

The latest run's three jobs completed successfully. All five artifacts from run 45697318725 were independently downloaded, ZIP-integrity checked, and their SHA-256 digests matched the GitHub artifact digests. The earlier run 45689659045 recorded 262 tests passed, but that count is not carried forward as a measured count for this later commit.

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
- [ ] Confirm the Windows CI runtime smoke test passes on the final candidate commit: **passed in run 45697318725**. It launches the packaged Electron executable from `release/win-unpacked`, checks that it remains alive for the startup window, and terminates the test process.
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
| Automated CI | Successful run on final candidate SHA | Passed for `50cacab0c8ce3aa71c2020463155467eb553d48a`; run 45697318725 |
| Android identity/signing | Installed certificate, signing model, matching release APK | Open |
| Android physical-device | Non-destructive test record and backup/restore evidence | Open |
| Windows runtime/signing | Test record and final installer verification | Open |
| Web deployment | Browser acceptance, deployment and rollback evidence | Open |
| Scientific review | Independent review and documented limitations | Open |
| Release authorization | Explicit approval of final artifacts and version | Open |

**Current decision: NOT APPROVED FOR PRODUCTION DISTRIBUTION.** The latest validated candidate (`50cacab0c8ce3aa71c2020463155467eb553d48a`) has successful three-platform CI evidence in run 45697318725, including the Windows packaged-app startup smoke test and Android original-identity emulator launch/isolated preview build. Production signing, physical-device acceptance, interactive Windows installer/upgrade/uninstall and signing checks, public deployment, independent scientific review, and release authorization remain open.

## 7. Safety and scope notes

- No production signing credentials or existing-app certificate fingerprint have been supplied or verified.
- CI debug APKs are for isolated testing only; do not use them to update the existing installation.
- No production deployment or merge to `main` is authorized by this checklist.
- Pull requests #2, #3, and #6 remain outside this integration candidate and must not be wholesale-merged as a shortcut.
- The next Android milestone is a verified production-signing identity plus a non-destructive device/backup test record, not another debug APK installation.
