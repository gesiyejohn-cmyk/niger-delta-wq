# NDWQ CI evidence — 27 November 2026

**Repository:** `gesiyejohn-cmyk/niger-delta-wq`  
**Branch:** `ndwq-coordinate-system-upgrade`  
**Commit:** `5844694bdc08539cf50275e7ea45ba9d0b8a4503`  
**Workflow:** [Run #46082864203](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/46082864203)

## Results

All three jobs completed successfully on the same commit:

- **Web and tests:** scientific/geophysics test command passed (255 tests, 0 failures); production web build and artifact upload passed.
- **Android:** debug APK built; API 35 emulator booted; original-identity package `com.nigerdeltawq.mobile` installed and launched; app process and resumed launcher activity were detected. A separate preview package `com.nigerdeltawq.mobile.preview2` also installed and launched. The APK is debug-signed.
- **Windows:** desktop NSIS installer generated and uploaded. This is installer-build evidence only; the installer is not code-signed and was not installed or runtime-tested on a physical Windows machine.

## Artifacts

Artifact sizes and SHA-256 digests below refer to the uploaded artifact archives.

| Artifact | Artifact ID | Size (bytes) | SHA-256 | Expiry (UTC) |
|---|---:|---:|---|---|
| `ndwq-integrated-android-debug-apk` | 15238340470 | 8,158,465 | `9bc0d04f30d4ba1c3479fa30b63185d1206e432dc1445762903f071187205395` | 2026-12-11 23:34:46 |
| `ndwq-integrated-web` | 15237960911 | 335,931 | `d0c5c6c21872a5e4789c9b6e58a721fb528ece6201ba2420d3b81c238044cffc` | 2026-12-11 23:30:51 |
| `ndwq-integrated-windows-desktop` | 15237751578 | 95,612,038 | `d349d78e592c9738a67a25596131867570dfd2f791199cc20aaf78261f0b4f7f` | 2026-12-11 23:32:13 |

## Explicitly unverified release gates

- No physical Android phone/tablet install, visual acceptance or regression test has been performed.
- The debug signing identity is not a persistent production signing key; compatibility with existing user installations is not established. Do not uninstall, clear app data or install this APK over existing copies.
- No production Android signing or store release is configured.
- The Windows installer has not been installed or runtime-tested on a physical Windows machine and is unsigned.
- The web build has not been deployed to a public production URL or browser-accepted against that deployment.
- Backup/restore has automated fake-IndexedDB round-trip and migration coverage, but has not been tested against the user's actual phone database. Preserve the user's existing records before any future device update test.
- Scientific methods, local DRASTIC rating justification, applicable standards and field validation still require domain review.

This record documents CI evidence only. It does not authorize a merge, production release, deployment or user installation. Pull requests #2 and #6 remain open and unmerged.
