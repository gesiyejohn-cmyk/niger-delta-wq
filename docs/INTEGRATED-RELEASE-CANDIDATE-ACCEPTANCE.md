# Integrated release-candidate acceptance checklist

**Candidate branch:** `integration/ndwq-main-overlay`  
**Current CI evidence:** [Run 45690529729](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45690529729) — commit `9ffecf257bcd3a76d130668c73e8daed11e24afb`  
**Acceptance status:** CI-validated candidate; manual and production gates remain open.

This checklist separates automated build confidence from evidence that the application is safe and usable on real devices. A checked CI item must not be treated as proof of physical-device, production-signing, or scientific validation.

## 1. Automated candidate evidence

- [x] Web/test job passed: 262 tests, 0 failures.
- [x] Web production build and integrated-source artifact completed.
- [x] Android debug APK built; package identity and debug certificate recorded.
- [x] Original-identity APK launched in the CI emulator.
- [x] Isolated side-by-side Android preview APK built.
- [x] Windows desktop installer artifact built.
- [x] Source-provenance manifest generated with separate overlay and workflow commit identities.
- [x] All five expected artifacts uploaded by the cited run.
- [x] Latest candidate commit `9ffecf257bcd3a76d130668c73e8daed11e24afb` passed all three jobs in [run 45690529729](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45690529729), including original-identity Android emulator launch, isolated preview APK build, and successful artifact uploads.

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

## 4. Web acceptance and deployment

- [ ] Serve the exact integrated web artifact from a clean environment and verify core routes, refresh/deep links, responsive layouts, and browser console/network errors.
- [ ] Verify coordinate input, map rendering, charts, data export/import, and offline/poor-network behavior in supported browsers.
- [ ] Confirm deployment credentials, domain/base-path configuration, and rollback procedure.
- [ ] Verify the production deployment workflow is restricted to the intended production branch.
- [ ] Perform a controlled deployment only after review approval; verify the public URL and retain rollback evidence.

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
| Automated CI | Successful run on final candidate SHA | Passed for candidate SHA `9ffecf257bcd3a76d130668c73e8daed11e24afb`; run 45690529729 |
| Android identity/signing | Installed certificate, signing model, matching release APK | Open |
| Android physical-device | Non-destructive test record and backup/restore evidence | Open |
| Windows runtime/signing | Test record and final installer verification | Open |
| Web deployment | Browser acceptance, deployment and rollback evidence | Open |
| Scientific review | Independent review and documented limitations | Open |
| Release authorization | Explicit approval of final artifacts and version | Open |

**Current decision: NOT APPROVED FOR PRODUCTION DISTRIBUTION.** The candidate has successful three-platform CI evidence, but production signing, physical-device acceptance, Windows runtime/signing, public deployment, and independent scientific review are not yet established.


## Latest three-platform candidate validation — 25 November 2026

The latest candidate commit `9ffecf257bcd3a76d130668c73e8daed11e24afb` completed workflow run [45690529729](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45690529729) with an overall successful conclusion.

- Web and scientific/geophysics test job: passed; integrated web build, source package, and artifact uploads completed.
- Android job: passed; original-identity APK emulator launch, isolated preview APK build, and artifact upload completed.
- Windows desktop job: passed; installer artifact uploaded.
- Five artifacts uploaded: Android debug APK (8,540,775 bytes), web build (351,319 bytes), Windows installer (95,619,899 bytes), source provenance (3,553 bytes), and integrated source (183,667 bytes).

Artifact IDs for this run: Android `15059475284`, web `15059325148`, Windows `15058198166`, provenance `15056539592`, integrated source `15056309834`. These are CI debug/build artifacts, not production-signed release packages. Manual device, production-signing, Windows runtime/signing, web deployment, independent scientific review, and release-authorization gates remain open.
