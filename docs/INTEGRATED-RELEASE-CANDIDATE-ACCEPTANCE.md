# Integrated release-candidate acceptance checklist

**Candidate branch:** `integration/ndwq-main-overlay`  
**Latest CI evidence:** [Run 45691731047](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45691731047) — commit `b23dafb3c6e1bdc074c606282d788fb3ca7491f9`  
**Acceptance status:** Three-platform CI validated; manual and production gates remain open.

This checklist separates automated build confidence from evidence that the application is safe and usable on real devices. A checked CI item must not be treated as proof of physical-device, production-signing, or scientific validation.

## 1. Automated candidate evidence

- [x] Latest candidate commit `b23dafb3c6e1bdc074c606282d788fb3ca7491f9` passed all three jobs in [run 45691731047](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45691731047).
- [x] Web/scientific/geophysics test job passed and production web build completed.
- [x] Android debug APK built; package identity and debug certificate recorded.
- [x] Original-identity APK launched in the CI emulator.
- [x] Isolated side-by-side Android preview APK built and emulator-smoke-tested.
- [x] Windows desktop installer built and uploaded.
- [x] Source-provenance manifest generated and uploaded.
- [x] All five expected artifacts uploaded by the cited run.

**Latest run artifact inventory** (CI artifacts; none is a production-signed release package):

| Artifact | Artifact ID | Size | SHA-256 |
|---|---:|---:|---|
| Android debug APK | `15059168013` | 8,539,963 bytes | `1ee4c07b6b75379bc609fbe798d7d1c49656936e5cb75a36f06e12a821089444` |
| Windows desktop installer | `15058613706` | 95,619,883 bytes | `a67d7240f28a061b268d11e362104d950cac98ab4ce59a3449478f443dd4104a` |
| Source provenance | `15058354073` | 3,552 bytes | `d6694abaf19ea8c878e76f4cc7300307b75a7d3e574b34d2a78f09c5dd1ce515` |
| Integrated web build | `15058018774` | 351,319 bytes | `12eb787687a28b652f2e97dd7e6bb7e09f8cd684d534e36d54aa3580da8edd54` |
| Integrated source | `15057284733` | 184,200 bytes | `161b59672852d166ff6139c44fa1ae7416e9e38fd2c6bc1f1be7003bd55c56b7` |

The latest run's three jobs completed successfully. The earlier run 45689659045 recorded 262 tests passed, but that count is not carried forward as a measured count for this later commit.

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
- [ ] Verify startup, navigation, local persistence, backup/restore, file import/export, and graceful offline behavior.
- [ ] Verify installer identity, version, architecture, dependencies, and upgrade/uninstall behavior in the test environment.
- [ ] Decide whether code signing is required for distribution; if so, verify the publisher signature and timestamp on the final installer.
- [ ] Record Windows edition/build, architecture, installer hash, test date, and results.

CI currently proves that the Windows installer can be built and uploaded; it does not prove that the installer has been run through an interactive Windows acceptance test.

## 4. Web acceptance and deployment

- [ ] Serve the exact integrated web artifact from a clean environment and verify core routes, refresh/deep links, responsive layouts, and browser console/network errors.
- [ ] Verify coordinate input, map rendering, charts, data export/import, and offline/poor-network behavior in supported browsers.
- [ ] Confirm deployment credentials, domain/base-path configuration, and rollback procedure.
- [ ] Verify the production deployment workflow is restricted to the intended production branch.
- [ ] Perform a controlled deployment only after review approval; verify the public URL and retain rollback evidence.

The integration candidate has not been deployed to production. The repository's Pages deployment job is guarded to run only for `refs/heads/main`.

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
| Automated CI | Successful run on final candidate SHA | Passed for `b23dafb3c6e1bdc074c606282d788fb3ca7491f9`; run 45691731047 |
| Android identity/signing | Installed certificate, signing model, matching release APK | Open |
| Android physical-device | Non-destructive test record and backup/restore evidence | Open |
| Windows runtime/signing | Test record and final installer verification | Open |
| Web deployment | Browser acceptance, deployment and rollback evidence | Open |
| Scientific review | Independent review and documented limitations | Open |
| Release authorization | Explicit approval of final artifacts and version | Open |

**Current decision: NOT APPROVED FOR PRODUCTION DISTRIBUTION.** The candidate has successful three-platform CI evidence, but production signing, physical-device acceptance, Windows runtime/signing, public deployment, independent scientific review, and release authorization are not yet established.

## 7. Safety and scope notes

- No production signing credentials or existing-app certificate fingerprint have been supplied or verified.
- CI debug APKs are for isolated testing only; do not use them to update the existing installation.
- No production deployment or merge to `main` is authorized by this checklist.
- Pull requests #2, #3, and #6 remain outside this integration candidate and must not be wholesale-merged as a shortcut.
- The next Android milestone is a verified production-signing identity plus a non-destructive device/backup test record, not another debug APK installation.
