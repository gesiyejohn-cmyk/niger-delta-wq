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
