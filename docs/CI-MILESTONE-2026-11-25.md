# Integrated CI and Web Performance Milestone — 25 November 2026

## Exact source revision

- Repository: `gesiyejohn-cmyk/niger-delta-wq`
- Branch: `feature/external-reference-validation`
- Commit: `cc2c75f305fb094060a8f4e51a461b267869f53c`
- Commit message: `perf(web): lazy-load application routes`
- GitHub Actions run: [45599699359](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45599699359)
- Result: all three required jobs completed successfully.

## CI results

| Job | Result | Evidence |
|---|---|---|
| `web-and-tests` | Pass | 250 automated tests passed; 0 failed; production build and integrated source packaging passed |
| `android` | Pass | Debug APK built; API 35 emulator booted; original-identity app installed and launcher activity resumed; isolated preview APK also built, installed and launched |
| `windows-desktop` | Pass | Windows desktop installer build and artifact upload passed |

### Web bundle measurement

The route-level lazy-loading change reduced the main JavaScript bundle from 558.32 kB to 171.56 kB, a 69.3% reduction. The main bundle gzip size is 56.15 kB. The build now emits separate page chunks for Geophysics, Hydrochemistry, WQI, Vulnerability, Analytics and other routes. The spreadsheet library remains a separate 429.02 kB chunk (143.08 kB gzip); Leaflet is also separate at 149.58 kB (43.36 kB gzip). The production build completed without the previous over-500-kB chunk warning.

### Android emulator evidence

- Original application ID: `com.nigerdeltawq.mobile`
- App label: `Niger Delta WQ`
- Version code/name: `1` / `1.0`
- Launcher activity: `com.nigerdeltawq.mobile.MainActivity`
- Original-identity debug APK SHA-256: `b9fbf9b1dd078995965e15c8565a74a2c689101e29274df2e85534921c13e283`
- Preview application ID: `com.nigerdeltawq.mobile.preview427`
- Preview APK SHA-256: `3f1575fa3f67bcdf9b99a407ef9b725db73ed5b00dc3eaad035935237a18e40a`
- Debug signing certificate SHA-256: `3c3978f130dbbcfe6619a1b5be6679801ac149ec9b7a4317ad5de649aeef1bab`
- The CI smoke test observed a running app process and the expected resumed launcher activity for both the original-identity package and the isolated preview package.

## Uploaded artifacts

All sizes below are GitHub artifact archive sizes, not installed application sizes.

| Artifact | ID | Size | Archive SHA-256 | Retention |
|---|---:|---:|---|---|
| [Android debug APK bundle](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45599699359/artifacts/15014777914) | 15014777914 | 8,184,420 bytes | `0df421b9dd514230dd9e08c13632ef759594771c1ae3dba49c779eebb1de8495` | 9 Dec 2026 |
| [Windows desktop installer](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45599699359/artifacts/15014553131) | 15014553131 | 95,614,607 bytes | `d65e22731d89326b08adfa19160d1fc4e055bbb6e5c52064f00fd1941b04e160` | 9 Dec 2026 |
| [Integrated web build](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45599699359/artifacts/15013469333) | 15013469333 | 350,158 bytes | `02e95eb4c676668e8ed2d6e8134aac3cb1c1eaa0ee6ff0a86972a2d3258fe1cc` | 9 Dec 2026 |
| [Integrated source snapshot](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45599699359/artifacts/15015520104) | 15015520104 | 190,461 bytes | `f57099a150126fd2ae263141cc4ebfe8f3b2f851915098046d39346b60bbdfdf` | 25 Dec 2026 |

## Release boundaries — still open

This is a successful cross-platform CI build and API 35 emulator smoke-test milestone, not production release approval.

- Android artifact is debug-signed. Production signing and signer compatibility with the user's existing installation have not been established. Do not uninstall, clear data or install this debug APK over the existing app.
- Emulator launch is not physical-phone acceptance or proof of first-frame rendering and core workflows on the user's device.
- Windows installer generation is not physical Windows installation/runtime acceptance; production code signing remains unverified.
- Public web deployment and browser acceptance remain outstanding.
- Real-device backup/restore, independent scientific/calibration review and formal release sign-off remain outstanding.
- No additional APK installation is required to record or benefit from this CI milestone.

The existing device installation and its data must be preserved until package identity, signing and safe update compatibility are explicitly verified.


## Superseding Android visual-acceptance milestone — 25 November 2026

- Verified commit: `43b72c111a71f66321e61c396abfd90414282845` (`test(android): correct WebView settle sleep assertion`).
- CI run: [45613215677](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45613215677) — all three jobs passed: web/tests, Android and Windows desktop.
- Automated tests: **253 passed, 0 failed**; production web build and integrated source packaging passed.
- Android API 35 emulator: original package `com.nigerdeltawq.mobile` installed and launched. After a 15-second WebView settling window, the captured screenshot was visually inspected and confirmed to show the actual NDWQ dashboard, including navigation, dashboard heading, Add sample action, summary indicators and sampling-record controls. It no longer shows the Capacitor splash screen. Preview package `com.nigerdeltawq.mobile.preview443` also built, installed, launched and produced a screenshot.
- Android artifact: [ID 15020153658](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45613215677/artifacts/15020153658), 8,533,319 bytes. Windows installer artifact: [ID 15020288946](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45613215677/artifacts/15020288946), 95,614,749 bytes. Web artifact: [ID 15020748104](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45613215677/artifacts/15020748104), 350,158 bytes. Source artifact: [ID 15020438742](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45613215677/artifacts/15020438742), 197,677 bytes.

### What this closes

The CI emulator first-screen visual-rendering check is now passed for this exact commit. This is stronger evidence than APK build/install/activity-resume alone.

### What remains open

This does not establish physical-phone acceptance, safe update/signature compatibility with the user's existing installation, production Android signing, physical Windows installation/runtime, Windows code signing, public web deployment, real-device backup/restore, or independent scientific review/calibration. The Android APK is CI debug-signed. Do not install it over the user's existing app, uninstall the app or clear its data. No additional APK installation is requested for this milestone.


## Cross-platform accessibility and artifact milestone — 25 November 2026

- Source revision: `9a1724e871fa43a1bfda1e9e074130a852da2804` on `feature/external-reference-validation`.
- CI run: [45618882659](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45618882659) — **all three jobs passed**: `web-and-tests`, `android`, and `windows-desktop`.
- Automated suite: **260 test declarations passed, 0 failures**; the count is derived from the exact source snapshot's merged base and upgrade test files. Production web build and source packaging also passed.
- Accessibility addition in this revision: the primary navigation now has the explicit accessible landmark name `Primary navigation`; three source-contract tests cover the named landmark, the 14 main destinations, and route loading/fallback announcements.
- Android API 35 emulator: original application ID `com.nigerdeltawq.mobile` built, installed and launched; isolated preview `com.nigerdeltawq.mobile.preview450` also built, installed and launched. Both screenshots were downloaded from the run and visually inspected; both show the actual NDWQ dashboard rather than the Capacitor splash screen.
- Original-identity APK SHA-256: `c0d24eb45a0702e12774d0ac3a9d6262404b5706b65acc216e878a062942fe41`.
- Preview APK SHA-256: `5008c49fb1ff1a34361c6aa02cb9253c5afc744d0f2e4698813e5770e2cc236f`.
- Both APKs are debug-signed with the CI Android Debug certificate (certificate SHA-256: `6c3117c216fdd58d451e27b721e87e1ed0e47dd1906ffbb6d200b921462e1659`). These are validation artifacts, not safe updates for an existing user installation.
- Windows installer archive: [artifact 15023373034](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45618882659/artifacts/15023373034), 95,615,340 bytes; contains `Niger-Delta-WQ-Setup-1.0.0.exe`.
- Android archive: [artifact 15023966941](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45618882659/artifacts/15023966941), 8,534,420 bytes.
- Web archive: [artifact 15023882531](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45618882659/artifacts/15023882531), 350,726 bytes.
- Source archive: [artifact 15023433331](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45618882659/artifacts/15023433331), 200,818 bytes.

### Release boundaries still open

This closes the cross-platform CI build and emulator visual-smoke milestone for this revision. It does **not** close production signing or signature compatibility with the user's installed Android app, physical Android acceptance, physical Windows installation/runtime and code signing, public web deployment/browser acceptance, real-device backup/restore, independent scientific calibration/review, or formal release sign-off. Preserve the user's existing installation and data; no new APK installation is requested.

## Latest three-platform release-candidate build and signing-preflight milestone — 25 November 2026

- Source revision: `22ffc96f0e05f92915b35103a160282fd8cf3363` on `feature/external-reference-validation`.
- CI run: [45657426934](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45657426934) — **all three jobs passed**: `web-and-tests`, `android`, and `windows-desktop`.
- Automated suite: **260 passed, 0 failed**. Production web build and integrated source packaging passed.
- Android signing-preflight CI coverage now exercises: missing protected secrets (expected exit 2), ephemeral test-keystore and matching certificate (pass), mismatched certificate (expected exit 1), and invalid alias (expected exit 1). The test keystore is ephemeral and CI-only; no production signing secrets or keystore were created.
- Android API 35 emulator: original package `com.nigerdeltawq.mobile` built, installed and launched; screenshot was downloaded and visually inspected, showing the NDWQ dashboard. Isolated preview package `com.nigerdeltawq.mobile.preview459` also built and was included in the artifact.
- Original-identity debug APK SHA-256: `33a62bda2ff9be1662dff9b40b40107f33d0c90b817a4ce93f183ccaed2929bf`.
- Preview APK SHA-256: `8e01b87b850ea1e5b97d606dba623a887892d45f325f89c15ff1d594558f3292`.
- Debug signing certificate SHA-256: `bfbdd70d5d34f6dad4062384f6b889c691f9ef49dc4cc933d659548a3a81df72`. This is a CI debug certificate, not evidence of compatibility with the user's installed app.
- Windows installer artifact: [15042652832](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45657426934/artifacts/15042652832), 95,615,339 bytes; ZIP integrity passed and it contains `Niger-Delta-WQ-Setup-1.0.0.exe`.
- Android artifact: [15043172931](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45657426934/artifacts/15043172931), 8,533,586 bytes; ZIP integrity passed.
- Web artifact: [15042992687](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45657426934/artifacts/15042992687), 350,726 bytes; ZIP integrity passed.
- Integrated source artifact: [15044415801](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45657426934/artifacts/15044415801), 203,342 bytes; ZIP integrity passed.

### Release boundaries still open

This milestone verifies CI builds, automated tests, artifact integrity and Android emulator dashboard rendering. It does **not** establish production Android signing or signer compatibility with the user's existing installation, physical Android acceptance, physical Windows installation/runtime or code signing, public web deployment/browser acceptance, real-device backup/restore, independent scientific calibration/review, or formal release sign-off. Preserve the existing installation and its data. **No additional APK installation is requested.**


## Pages deployment safety audit and latest CI confirmation — 25 November 2026

- Source revision: `521a86c77b5c429b2e07d002378a4220bf053fad` on `feature/external-reference-validation`.
- CI run: [45661514212](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45661514212) — completed successfully; `web-and-tests`, `android`, and `windows-desktop` all passed.
- The feature-branch `.github/workflows/build.yml` now gates the `deploy-pages` job with `if: github.ref == 'refs/heads/main'`, preventing feature-branch and pull-request refs from deploying the production Pages site when this workflow version is used.
- **Important integration finding:** the current `main` branch still has the older `.github/workflows/build.yml` without this guard. That workflow extracts the root `NDWQ-Source-Compact.zip` for web, Android, and Windows builds. The integrated feature branch is substantially divergent from main (441 commits ahead, 4 behind at audit time), and its `upgrade-build.yml` does not exist on main. Therefore, the feature-branch Pages guard and integrated build pipeline have not been adopted by production main.
- Do not merge the divergent branch wholesale or deploy it automatically. A controlled integration plan and a verified source-of-truth decision are required before changing the production Pages workflow.
- GitHub Pages configuration could not be confirmed through the available repository API response in this audit; no claim of a live public deployment or browser acceptance is made.

### Release boundaries

This confirms CI for the Pages guard commit and records the production deployment blocker. It does **not** close public web deployment/browser acceptance, production Android signing or existing-app signer compatibility, physical Android acceptance, physical Windows installation/runtime and code signing, real-device backup/restore, independent scientific calibration/review, or formal release sign-off. Preserve the user's existing installation and data; no additional APK installation is requested.
