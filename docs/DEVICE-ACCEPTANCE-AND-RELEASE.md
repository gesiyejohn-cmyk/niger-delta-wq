# NDWQ Device Acceptance and Release Checklist

**Purpose:** A practical, evidence-based acceptance record for Niger Delta WQ (NDWQ) on Android, Windows desktop and web.

**Important:** Automated CI success is not the same as physical-device acceptance or release approval. Complete the relevant sections on the actual target devices. Record every failure and attach evidence before signing off.

## 1. Test record

| Field | Record |
|---|---|
| Test cycle / release candidate | |
| Git commit / build SHA | |
| Build date and time | |
| Tester(s) | |
| Test location | |
| Test data set / fixture ID | |
| Overall result | Not started / Pass / Fail / Blocked |
| Open critical or high issues | |
| Evidence folder / issue links | |

### Device and environment inventory

| Platform | Manufacturer / model | OS version / build | App version / package | Browser (if applicable) | Tester / date |
|---|---|---|---|---|---|
| Android phone | | | | | |
| Android tablet (if supported) | | | | | |
| Windows desktop / laptop | | | | | |
| Web desktop browser | | | | | |
| Web mobile browser | | | | | |

Use one status for every test: **[ ] Not run  [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A**. For a failure or block, record the issue ID and attach a screenshot, screen recording, log or sample file.

## 2. Known build and release boundaries

Run [43827925449](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/43827925449) is retained below as a historical baseline. The newer same-branch verification on commit `092cf3cce41dbd3be159adcbd8186ea53c0405ce` is recorded in the superseding evidence block below.

- Web: all 114 automated scientific/geophysics tests passed (114 passed, 0 failed); the production web build and artifact upload passed.
- Android: debug APK build passed; API 35 emulator boot completed, APK installation returned `Success`, launcher activity was `com.nigerdeltawq.mobile.MainActivity`, and the resumed app activity was detected. The APK metadata confirmed package ID `com.nigerdeltawq.mobile` and label `Niger Delta WQ`. This is automated emulator evidence only; it does not establish physical-device acceptance, first-frame rendering on a real phone, or compatibility with an existing installation.
- Windows: the NSIS installer was generated and uploaded successfully with Electron Builder publishing explicitly disabled (`--publish never`). The installer is unsigned in this CI run. This does not establish installation or runtime behavior on a physical Windows computer.
- The Android workflow asserts that the source Capacitor identity is exactly `com.nigerdeltawq.mobile` / `Niger Delta WQ`, and builds/tests that identity without a temporary package-name override. This confirms the intended package ID and launcher label, but does not prove signing compatibility with any existing installed app.
- Artifacts verified through the run's artifact listing (sizes are uploaded ZIP artifact sizes, not installed application sizes):
  - `ndwq-integrated-web`: 300,899 bytes, [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/43827925449/artifacts/14207322210); SHA-256 `67a51e550317b11281f6d61cb46e5a9fc7e4f19f100ef6edb96edaad7934ef3a`; expires 30 November 2026 at 08:01:31 UTC.
  - `ndwq-integrated-android-debug-apk`: 4,038,778 bytes, [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/43827925449/artifacts/14206994460); SHA-256 `06d247897520b514c1b41ba7146f373166fa9f3c5d10103e625e224592023f22`; expires 30 November 2026 at 08:04:16 UTC. The APK inside the ZIP is 4,398,946 bytes and has SHA-256 `11537631cecce1ce7889a42a580550d03ca43017700055e14aa6f5b3544c3a08`.
  - `ndwq-integrated-windows-desktop`: 95,586,786 bytes, [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/43827925449/artifacts/14207382340); SHA-256 `50ed284c9f5b1ec7f765fd02c2d4b4ca7df0a73b818af684bbd0da20a61452eb`; expires 30 November 2026 at 08:03:24 UTC.
- The web test log records 114 tests passed and 0 failed. The Windows job built the NSIS installer with publishing disabled. The Android job records API 35 emulator readiness, ADB install success, the original package ID and launcher label, a detected resumed activity, and successful APK artifact upload.
- GitHub's artifact retention is temporary; these downloads expire on the dates above. Expiry does not disable an installed app or remove the source code. Preserve required build evidence before expiry.

### Latest superseding CI evidence — 16 November 2026

The branch head at this check is `092cf3cce41dbd3be159adcbd8186ea53c0405ce` (commit message: “Use a fresh package ID for the next Android preview”). Pull request [#2](https://github.com/gesiyejohn-cmyk/niger-delta-wq/pull/2) remains **open and draft**; it has not been merged.

[Run 43847919643](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/43847919643) ran on that exact head commit. All three required jobs completed successfully:

- `web-and-tests`: 114 tests passed, 0 failed; production web build and upload passed. Web artifact `ndwq-integrated-web`, ID `14215813153`, 301,073 bytes, ZIP SHA-256 `6c81dd056030c919fce0d21687f00d88019ec4731e1a706f18b3fbca405a7f25`; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/43847919643/artifacts/14215813153); expires 30 November 2026 at 10:20:42 UTC.
- `android`: debug APK build, API 35 emulator boot, install and launcher launch passed for the original source identity. Metadata records package ID `com.nigerdeltawq.mobile`, label `Niger Delta WQ`, version code `1`, version name `1.0`, and launcher `com.nigerdeltawq.mobile.MainActivity`. The resumed launcher activity was observed. The CI debug signing certificate SHA-256 fingerprint is `5b1fe7f778f95389af1a007388b544a1b1157016ef21f717f5cde6ad783f8d68`; this is not a configured production key and does not establish compatibility with the user's installed app. The separate side-by-side preview also installed/launched with package ID `com.nigerdeltawq.mobile.preview2`. Original APK SHA-256: `d2719835a3872d16df80895c1a9d07a6377d445a4f2e34f5ed64df2c0bd5b390`; preview APK SHA-256: `a4a74ff8f82ae333b4d95e7e80d3780fb1ac476ca11b269b8aabb5d425bc4f5b`. Artifact `ndwq-integrated-android-debug-apk`, ID `14215773285`, 8,080,666 bytes, archive SHA-256 `1ab60587cb2e8afea027b73b3a96573893e85bbc79c61575e4f3a93ba5cff261`; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/43847919643/artifacts/14215773285); expires 30 November 2026 at 10:24:53 UTC. The archive contains the original-identity debug APK, side-by-side preview APK and signing/build metadata.
- `windows-desktop`: NSIS installer generation and upload passed. Installer file name `Niger-Delta-WQ-Setup-1.0.0.exe`; no code-signing certificate was configured. Artifact `ndwq-integrated-windows-desktop`, ID `14217085434`, 95,586,913 bytes, archive SHA-256 `062015acc14109ba1d508954a25f69b22636405570d95922ef37343d29c1f782`; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/43847919643/artifacts/14217085434); expires 30 November 2026 at 10:22:38 UTC.

The requested earlier emulator workflow [Run 43762079209](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/43762079209) is now complete and **failed only in its Android job**, at the emulator launch step; its web/tests and Windows jobs passed. The Android log ended with ADB exit code 224 after a settings-service broken-pipe error. The newer workflow now explicitly installs the API 35 emulator image, verifies KVM access and AVD files, waits for boot/system readiness, bounds ADB calls and performs separate original-identity and preview launches. Run 43847919643 confirms those CI emulator checks now pass.

These results establish a successful multi-platform **CI build and emulator smoke test on one commit**, not a production release:
- Web deployment to an accessible public URL and browser acceptance remain unverified.
- The Android artifact is debug-signed. Existing-device signer compatibility and production signing remain unverified; do not uninstall, clear data or install over the current phone app.
- The emulator did not provide human visual acceptance on the user's physical phone. Physical-device installation, first-screen rendering and core workflows remain outstanding.
- Windows installer installation and runtime remain untested on a real Windows computer; the installer is unsigned.
- Backup/restore still needs a recoverable backup and verification against the user's actual device data.
- Scientific reference/calibration review and formal acceptance sign-off remain outstanding.

**Do not interpret these checks as proof of full app functionality on physical devices or as approval to distribute/install the artifacts as a production release.**
Release restrictions and product limitations to retain during testing:

1. The Android CI build uses the original source application ID `com.nigerdeltawq.mobile` and label `Niger Delta WQ`, but it is a debug APK. It is not evidence that this APK can update an existing installed NDWQ application.
2. Android signing identity, production package identity and safe in-place update/data migration compatibility must be verified before any upgrade of an existing installation. Do not uninstall the existing app, clear its data or install this test APK over it as an acceptance shortcut.
3. The Windows CI result proves installer generation, not successful installation, launch, signing/publisher trust, upgrade or uninstall on a real Windows computer.
4. A web production build was generated, but deployment to a user-accessible production URL is a separate release gate.
5. GPS depends on device hardware, browser support and user permission. A denied or unavailable GPS reading must not be presented as a successful location fix.
6. VES curve-trend classification is preliminary interpretation, not automatic inversion. The app does not perform automatic VES inversion.
7. ERT display/interpolation uses imported model or inversion data. The app does not perform ERT inversion or raw ERT instrument acquisition.
8. DRASTIC classes are screening bands, not calibrated probabilities of contamination. Local hydrogeological justification or calibration is required before site-specific conclusions.
9. WQI results depend on the selected method and configured standards. A WQI value alone does not certify that water is potable or replace parameter-by-parameter compliance assessment.

## 3. Pre-test preparation and safety

- [ ] Confirm the exact build SHA and app version under test.
- [ ] Use a designated test device or test account where possible.
- [ ] Record the device model, OS version, free storage and available memory.
- [ ] Ensure the test dataset contains known coordinates and independently checked example values.
- [ ] Prepare a fresh backup of any NDWQ data that must be retained.
- [ ] Verify that the backup file can be opened and its size recorded before any destructive test.
- [ ] Do not use real personal, confidential or sensitive sampling records unless authorized.
- [ ] Record required Android permissions and Windows security prompts.
- [ ] Confirm the test device has a reliable date/time setting.
- [ ] Agree on the test owner and person authorized to approve release.

## 4. Android physical-device acceptance

### A. Installation, identity and first launch

- [ ] Install only on a designated test device after confirming package ID and signing identity.
- [ ] Record the APK file name, SHA-256 checksum, package ID, version and signing certificate.
- [ ] Confirm the displayed app name and icon are correct.
- [ ] Launch from the Android launcher; confirm no blank screen, immediate crash or repeated restart.
- [ ] Close and reopen the app; confirm it returns to a usable state.
- [ ] Rotate the device if supported; confirm content remains readable and controls usable.
- [ ] Check small and large display sizes where available.
- [ ] Confirm that permission requests explain why access is needed.
- [ ] Deny optional permissions; confirm the rest of the app remains usable and the app explains the limitation.

### B. Navigation and core workspace

- [ ] Open each main workspace and return to the home/navigation area.
- [ ] Confirm headings, buttons, labels and data tables are readable and not clipped.
- [ ] Confirm loading, empty, success and error states are understandable.
- [ ] Use Android Back navigation; confirm it does not unexpectedly discard unsaved records.
- [ ] Confirm the app remains responsive during ordinary navigation.

### C. Coordinates and GPS

Use a known test location and retain the source/reference coordinates.

- [ ] Enter latitude and longitude in Decimal Degrees (DD).
- [ ] Enter the same location in Degrees-Minutes-Seconds (DMS).
- [ ] Enter the same location in Degrees Decimal Minutes (DDM).
- [ ] Confirm DD, DMS and DDM conversions agree within the documented rounding precision.
- [ ] Confirm N/S and E/W hemisphere selection produces the correct signs.
- [ ] Confirm latitude and longitude cannot be interchanged silently.
- [ ] Confirm invalid minutes/seconds, out-of-range latitude/longitude and incomplete coordinates are rejected with clear messages.
- [ ] Save a record and reopen it; confirm the canonical stored coordinates remain WGS84 decimal degrees.
- [ ] Confirm the original user-entered coordinate format is retained for display/export where applicable.
- [ ] Select Geographic WGS84 and confirm the CRS/datum is visible.
- [ ] Select UTM Zone 31N and 32N where appropriate; compare output against an independent GIS/PROJ reference for the same zone and datum.
- [ ] Confirm the selected UTM zone and EPSG identifier are displayed clearly.
- [ ] Capture GPS with permission granted; record reported accuracy and compare with a trusted reference where available.
- [ ] Deny location permission or disable location services; confirm the app reports unavailable GPS and does not fabricate coordinates.
- [ ] Confirm manually entered coordinates remain usable when GPS is unavailable.

### D. Sample capture and persistence

- [ ] Create a new sample with a unique sample ID.
- [ ] Enter required sample metadata and measurements.
- [ ] Save, navigate away and reopen the sample.
- [ ] Confirm values, units, date/time and coordinates are unchanged.
- [ ] Edit a field and save; confirm only the intended record changes.
- [ ] Test duplicate sample ID handling and confirm the user receives a clear warning/error.
- [ ] Test incomplete and invalid values; confirm they are not silently converted to zero or accepted as valid readings.
- [ ] Confirm records remain available after closing and reopening the app.

### E. VES workflow

- [ ] Create a VES record with valid, increasing AB/2 values and corresponding MN/2 and resistance readings.
- [ ] Confirm invalid electrode geometry, nonpositive resistance and non-increasing AB/2 values are rejected.
- [ ] Confirm apparent resistivity calculations against an independently checked example.
- [ ] Save raw VES readings and reopen them.
- [ ] Save an interpretation separately from the raw sounding.
- [ ] Confirm editing or removing an interpretation does not silently alter the raw readings.
- [ ] Confirm curve-trend output is labelled preliminary and is not represented as an inversion result.
- [ ] Confirm layer interpretations require valid positive resistivity and valid thickness values, with the final half-space handled correctly.

### F. ERT workflow

- [ ] Import a valid supported ERT model/inversion CSV.
- [ ] Confirm imported line/model identity, coordinates, depth and resistivity values.
- [ ] Confirm the original source CSV is retained separately from normalized model data.
- [ ] Select one ERT line/model and confirm the display shows that selected line only.
- [ ] Check exact imported points and interpolated display values against a known test dataset.
- [ ] Confirm sparse or unsuitable data do not produce a misleading continuous tomogram.
- [ ] Confirm invalid/nonpositive resistivity, negative depth and oversized/invalid files are rejected with a clear message.
- [ ] Confirm the interface does not claim that the app performed ERT inversion.

### G. Water quality and vulnerability calculations

- [ ] Enter a test sample with known parameter values and units.
- [ ] Run the weighted-arithmetic WQI method using a documented set of applicable standards, ideal values and weights.
- [ ] Independently reproduce the WQI calculation and compare the result within rounding tolerance.
- [ ] Confirm missing parameters are not silently treated as zero.
- [ ] Confirm invalid standards, non-finite values and incomplete inputs are rejected or clearly excluded as designed.
- [ ] Confirm the selected standard source and method are visible in the result/report.
- [ ] Confirm the result does not claim to certify potability.
- [ ] Run a DRASTIC screening assessment with a documented set of seven ratings.
- [ ] Independently verify the weighted index total.
- [ ] Confirm all seven ratings are required and constrained to the supported range.
- [ ] Confirm the output is labelled a screening index/class and does not imply a calibrated probability of contamination.

### H. Backup, restore and offline use

- [ ] Create a full database backup and record its file name, size and date.
- [ ] Confirm the backup contains the expected samples, settings, sync queue, VES readings and interpretations, ERT models/source files, vulnerability records and saved WQI assessment snapshots (including measured inputs, limits, ideal values, weight references, standard source and result).
- [ ] Copy the backup to a safe location outside the device.
- [ ] Restore the backup to a separate test installation or isolated test database where possible.
- [ ] Compare record counts and selected record values before and after restore.
- [ ] Test invalid, empty, malformed and duplicate-key backup files; confirm rejection without data loss.
- [ ] Test Merge and Replace behavior using disposable test data only.
- [ ] Confirm a failed restore does not partially erase existing data.
- [ ] Enable airplane mode and test local data entry, viewing and calculations.
- [ ] Reconnect and confirm locally saved data remains intact.
- [ ] Confirm sync or queued work is not duplicated or silently discarded if synchronization is available in the build.

### I. Android performance and resilience

- [ ] Test repeated navigation and data entry for at least 15 minutes.
- [ ] Test a representative large sample list and ERT import.
- [ ] Background and resume the app; confirm no unsaved data loss.
- [ ] Test low-storage and interrupted file-import behavior where safe.
- [ ] Confirm errors are visible and actionable without exposing sensitive data.
- [ ] Check battery use, heat and responsiveness during normal field use.
- [ ] Record any crash, freeze, ANR or unexpected app restart with device logs.

## 5. Windows desktop physical-device acceptance

### A. Installer and application identity

- [ ] Record Windows edition, version/build, architecture and device model.
- [ ] Record installer file name, file size and SHA-256 checksum.
- [ ] Verify publisher/signature status and document any SmartScreen or security warning.
- [ ] Install on a designated test computer; do not replace a production installation until update compatibility is approved.
- [ ] Confirm the application appears in the expected installation location and Start menu.
- [ ] Launch from the Start menu and directly from the installed application shortcut.
- [ ] Close and reopen the app; confirm it starts without a blank screen or crash.
- [ ] Confirm the app can run under the intended standard-user permissions.
- [ ] Test install paths containing spaces and non-ASCII characters if these are in the supported environment.
- [ ] Confirm app version/build information is identifiable.

### B. Desktop workflows and display

- [ ] Confirm all major workspaces open and navigation works.
- [ ] Resize the application window; confirm controls and tables remain usable.
- [ ] Test maximized and restored window states.
- [ ] Test supported screen resolutions and display scaling.
- [ ] Confirm long tables can be scrolled and important columns remain accessible.
- [ ] Confirm keyboard navigation and common keyboard actions work where provided.
- [ ] Confirm file open/save dialogs point to the expected files and folders.

### C. Scientific workflows and file handling

- [ ] Repeat the coordinate DD/DMS/DDM, hemisphere, WGS84 and UTM tests from Section 4C.
- [ ] Repeat sample persistence and duplicate-ID tests from Section 4D.
- [ ] Repeat VES raw-reading and separate-interpretation tests from Section 4E.
- [ ] Repeat ERT source CSV/model import and selected-line tests from Section 4F.
- [ ] Repeat WQI and DRASTIC reference-calculation tests from Section 4G.
- [ ] Import a valid CSV from a local folder.
- [ ] Test invalid CSV headers, malformed rows, empty files and unsupported formats.
- [ ] Export a report/CSV and open it in an independent application.
- [ ] Confirm exported coordinates, units, labels and record IDs match the source records.
- [ ] Confirm source files are not overwritten or modified unexpectedly.

### D. Data protection, offline use and lifecycle

- [ ] Create a full backup and copy it outside the application data folder.
- [ ] Restore to a separate test profile or isolated test installation and compare records.
- [ ] Test malformed and duplicate-key backups without risking the only copy of real data.
- [ ] Disconnect the network and confirm supported local workflows still operate.
- [ ] Reconnect and confirm no local records disappear.
- [ ] Restart Windows and confirm the application still launches.
- [ ] Test application close during a save/import only with disposable test data; verify recovery behavior.
- [ ] Test uninstall only on the designated test installation.
- [ ] Confirm whether uninstall preserves or removes user data and document the observed behavior.
- [ ] Confirm upgrade installation behavior only after package identity, signing and migration strategy are approved.

## 6. Web acceptance

- [ ] Record the deployed URL, build SHA, browser and browser version.
- [ ] Test supported desktop browsers (for example, current Chrome and Edge).
- [ ] Test supported Android mobile browsers.
- [ ] Confirm the application loads over the intended secure connection.
- [ ] Repeat core navigation, coordinate, sample, VES, ERT, WQI and DRASTIC workflows.
- [ ] Confirm browser refresh does not unexpectedly lose saved local data.
- [ ] Test file imports and exports through browser file dialogs.
- [ ] Test GPS permission granted, denied and unavailable.
- [ ] Test offline behavior only to the extent supported by the deployed web build; do not assume offline/PWA support without verifying it.
- [ ] Confirm browser zoom and narrow viewport layouts remain usable.
- [ ] Confirm no unexpected console errors, broken assets or blocked API requests.
- [ ] Confirm the deployed build SHA matches the approved candidate.

## 7. Cross-platform consistency

- [ ] Enter the same known sample on Android, Windows and web test environments.
- [ ] Compare sample IDs, measurements, units, timestamps and coordinates.
- [ ] Compare DD, DMS and DDM conversion results using the same source coordinates.
- [ ] Confirm WGS84 decimal-degree storage/display conventions are consistent.
- [ ] Confirm UTM zone, datum and EPSG labels are not silently changed between platforms.
- [ ] Compare WQI outputs using identical inputs, method, standards and weights.
- [ ] Compare DRASTIC screening totals using identical seven-factor ratings.
- [ ] Compare VES apparent resistivity and saved raw readings.
- [ ] Compare imported ERT model values and selected-line identity.
- [ ] Export records on one platform and verify them on another where the workflow supports it.
- [ ] Confirm backup/restore does not silently omit supported stores.
- [ ] Record any intentional platform-specific difference and obtain product-owner approval.

## 8. Scientific and data-integrity acceptance

- [ ] All calculations in the agreed reference test set match independent calculations within documented rounding tolerance.
- [ ] Units are explicit and conversions are not applied twice.
- [ ] Missing, invalid and excluded values are visible and are not silently treated as zero.
- [ ] Coordinate datum, CRS, UTM zone and hemisphere are explicit wherever coordinates are shown or exported.
- [ ] Raw field readings remain distinguishable from calculated values and interpretations.
- [ ] Imported inversion products remain distinguishable from calculations performed by NDWQ.
- [ ] WQI and DRASTIC results include method and limitation statements.
- [ ] Reports identify the source sample/record and preserve traceability.
- [ ] Backup/restore preserves supported records and rejects invalid files safely.
- [ ] No known data-loss, cross-record overwrite or duplicate-record defect remains open.

## Latest migration and multi-platform CI verification — 17 November 2026

Commit `d72d90312303ad26afae8da51aa984183d7fcb70` adds a guarded migration for legacy ERT records that stored their original CSV source inside the model record. On first ERT list/source access, the migration moves the source file and its metadata to the separate `ertSource` store and removes the embedded copy only in the same successful IndexedDB transaction. If a different source file already exists for the same model ID, the migration aborts instead of overwriting either version.

A new regression test, `upgrade/tests/indexeddb-migration.test.js`, creates a real schema-version-6 IndexedDB database and opens it through the application's version-7 database code. It checks that existing sample, settings, sync-queue, VES and ERT data survive; new stores are created; legacy VES interpretations and ERT source CSV files are separated; conflicting source copies roll back atomically; and backup snapshots retain the migrated records. The test also confirms a missing nitrate value remains `null`, not zero.

[CI run #44088353445](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/44088353445) on that commit completed successfully:
- Web/scientific tests: **115 passed, 0 failed**; production web build and artifact upload passed.
- Android: debug APK build passed; the API 35 emulator installed and launched the original-identity package `com.nigerdeltawq.mobile`. The workflow observed a live app process and resumed `com.nigerdeltawq.mobile/.MainActivity`. The isolated preview package `com.nigerdeltawq.mobile.preview2` also built and launched successfully.
- Windows: NSIS installer generation and artifact upload passed. Installer creation is not physical Windows installation/runtime acceptance.

Artifacts from run #44088353445 (uploaded ZIP sizes):
- Web `ndwq-integrated-web`: 301,330 bytes; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/44088353445/artifacts/14330407191); SHA-256 `88c88e67b17685351b930a19516314e9b38605b97d372bff258ec419ad75319b`; expires 1 December 2026 at 13:00:21 UTC.
- Android `ndwq-integrated-android-debug-apk`: 8,081,006 bytes; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/44088353445/artifacts/14329574735); SHA-256 `d7f83be72b8e4c6f96bc792b04ea7fa8cc4a032fe8f8cf1262d82f70c40d2b2a`; expires 1 December 2026 at 13:04:23 UTC.
- Windows `ndwq-integrated-windows-desktop`: 95,587,137 bytes; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/44088353445/artifacts/14329679660); SHA-256 `48f2680a182b1d383613b44c6a042cac6161fc7b8ca557fb35c8e5602c11c8b9`; expires 1 December 2026 at 13:02:10 UTC.

Android identity/signing evidence from this run:
- Original-identity APK: package `com.nigerdeltawq.mobile`, label `Niger Delta WQ`, launcher `com.nigerdeltawq.mobile.MainActivity`; APK SHA-256 `92da0cde3efdc09792b8f1a9e6511df96a479a17a628b0d6192a4345a6d873f5`.
- The APK is signed with an Android **debug** certificate, SHA-256 fingerprint `e71224dfd44e30a53db8a755a64fa693c5b5391e56012d4d98c97991376a5154`. This is not a configured production signing identity and does not prove compatibility with the user's installed app.
- The preview APK has a separate package ID `com.nigerdeltawq.mobile.preview2`; it is for side-by-side testing, not an update.

This is a successful CI/emulator build check, not a release approval. Physical Android visual/core-workflow acceptance, signer compatibility and production signing, real-device backup/restore, Windows installation/runtime, public web deployment/browser acceptance, and scientific reference/calibration sign-off remain outstanding. Do not uninstall, clear app data or install over an existing phone copy as part of this CI result.


## Latest backup/restore regression and multi-platform CI — 18 November 2026

The branch now validates backup record primary keys before beginning a restore. NDWQ backup stores use non-empty string IDs and finite numeric IDs (including the auto-increment sync queue); boolean, object, array, blank-string and non-finite keys are rejected during preview rather than being allowed to fail later as IndexedDB write errors.

`upgrade/tests/backup.test.js` now exercises a full backup/replace-restore round trip across all nine stores. The fixture verifies preservation of samples and `null` measurements, settings, sync queue entries, raw VES readings, separate VES interpretations, ERT model cells and original CSV source content, vulnerability records and saved WQI snapshots. Additional tests verify Merge skips an existing ID without overwriting it, partial Replace leaves stores omitted from the backup untouched, and an empty Replace backup is rejected before current records are cleared.

[CI run #44302004508](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/44302004508) completed successfully on exact branch commit `1c8084d75ccdd9a0dda1d8ffc58af5af8e0ba812`. Pull request [#2](https://github.com/gesiyejohn-cmyk/niger-delta-wq/pull/2) remains open and draft; it is not merged.

- `web-and-tests`: **120 tests passed, 0 failed**; web production build and artifact upload passed.
- `android`: debug APK build, API 35 emulator boot, original-identity APK install/launch, preview APK build/launch and artifact upload all passed. Original package `com.nigerdeltawq.mobile`, label `Niger Delta WQ`, version code `1`, version name `1.0`, launcher `com.nigerdeltawq.mobile.MainActivity`. The original APK SHA-256 is `3d1748a8c0f9033ac1f525f45d866db95dfb52d0f310c63c8b620669d350340a`. Its debug signing certificate SHA-256 fingerprint is `5884a3636f39bd8f7b5e6f8c2c461adc22c013ff649612532d392a848e9341e3`.
- `windows-desktop`: NSIS installer generation and upload passed. Installer name `Niger-Delta-WQ-Setup-1.0.0.exe`; no code-signing certificate was configured.

Artifacts from run #44302004508 (sizes are uploaded ZIP artifact sizes):
- Web `ndwq-integrated-web`, ID `14426367566`, 301,361 bytes; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/44302004508/artifacts/14426367566); expires 2 December 2026 at 12:15:05 UTC.
- Android `ndwq-integrated-android-debug-apk`, ID `14425503693`, 8,081,068 bytes; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/44302004508/artifacts/14425503693); expires 2 December 2026 at 12:19:30 UTC. The archive contains the original-identity debug APK, the side-by-side preview APK and build/signing metadata. Preview package ID is `com.nigerdeltawq.mobile.preview2`; preview APK SHA-256 is `74a4d50467a3ee152cd2ec7675bf3203140cce080a13256786ce4644cc20ca1e`.
- Windows `ndwq-integrated-windows-desktop`, ID `14426368029`, 95,587,126 bytes; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/44302004508/artifacts/14426368029); expires 2 December 2026 at 12:17:07 UTC.

This verifies a same-commit three-platform CI build and emulator launch smoke test, not a production release. The Android artifact remains debug-signed; compatibility with the certificate on the user's installed app and an approved persistent production signing key are unverified. Physical Android first-screen/core-workflow acceptance and backup/restore against actual phone data remain untested. The Windows installer has not been installed/runtime-tested on a real Windows machine. The web artifact has not been deployed to an accessible public destination or browser-tested there. Scientific references, local DRASTIC calibration assumptions and formal acceptance sign-off remain outstanding.

Retain the existing product limitations: ERT inversion is not implemented; imported inversion products and their interpolation are not raw-field-data inversion; DRASTIC classes are screening bands requiring local justification; WQI alone does not establish potability. Do not install the debug APK over an existing phone installation, uninstall the current app or clear its data based on this CI result.

## 9. Defect and evidence log

| Issue ID | Platform / device | Test ID | Severity (Critical / High / Medium / Low) | Expected result | Actual result | Evidence / log | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

For each failure, include exact steps to reproduce, test data (sanitized), app/build SHA, device/OS/browser details and relevant logs. Do not attach credentials, private keys or unredacted sensitive records.

## 10. Release decision and sign-off

### Mandatory no-go gates

Do not approve a production release if any of the following is true:

- [ ] A critical/high defect causes data loss, incorrect scientific calculations, wrong coordinate interpretation or a security/privacy exposure.
- [ ] Backup and restore have not passed on the intended target platforms.
- [ ] Android production package identity, signing and safe update/data-migration behavior remain unverified.
- [ ] Windows installation and runtime have not been tested on a real supported Windows device.
- [ ] The production web deployment and exact deployed build have not been verified.
- [ ] Required scientific reference datasets have not been independently checked.
- [ ] Open defects, unsupported features or scientific limitations are being hidden or described inaccurately.
- [ ] Required user documentation, support/rollback plan and release owner approval are missing.

### Acceptance summary

| Platform | CI build check | Physical/device acceptance | Backup/restore | Scientific reference checks | Result |
|---|---|---|---|---|---|
| Android | Pass on CI commit recorded above | Not yet recorded | Not yet recorded | Not yet recorded | Pending |
| Windows desktop | Installer build passed on CI commit recorded above | Not yet recorded | Not yet recorded | Not yet recorded | Pending |
| Web | Tests and production build passed on CI commit recorded above | Deployment/browser acceptance not yet recorded | Not yet recorded | Not yet recorded | Pending |

**Final decision:** Not approved / Approved with documented exceptions / Approved for release

**Release owner:** ____________________  
**QA / acceptance lead:** ____________________  
**Scientific reviewer:** ____________________  
**Date:** ____________________  
**Approved build SHA:** ____________________  
**Outstanding exceptions and expiry dates:** ____________________

Approval must refer to one exact build SHA. Any new code change after acceptance requires the affected tests to be rerun.


## 11. Coordinate-format regression and latest same-commit multi-platform CI — 19 November 2026

The branch head is `2bd19247813d1ab108bd665cfdcffe9aa2e7b461` (`fix(coordinates): preserve partial entries when changing format`). Pull request [#2](https://github.com/gesiyejohn-cmyk/niger-delta-wq/pull/2) remains open and draft, targeting `ndwq-desktop-build-integration`; it has not been merged.

The coordinate-format regression fix converts each populated axis independently when changing DD, DMS or DDM. An empty latitude or longitude remains empty; the populated axis is converted using its own axis limit and the selected N/S or E/W hemisphere. Invalid partial input rejects the format change without silently reinterpreting the value. The regression suite includes separate latitude-only and longitude-only cases, southern/western hemisphere preservation, invalid partial-input rejection, WGS84 UTM round-trip checks, and an independent PROJ/EPSG:32632 reference control.

[CI run #44523260517](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/44523260517) completed successfully on this exact branch-head commit:

- `web-and-tests`: **124 passed, 0 failed**; production web build and artifact upload succeeded.
- `android`: debug APK build succeeded; API 35 emulator installed and launched the original-identity package `com.nigerdeltawq.mobile` (`Niger Delta WQ`) and the separate preview package `com.nigerdeltawq.mobile.preview2`. The original launcher activity `com.nigerdeltawq.mobile.MainActivity` was observed as the resumed activity. APK metadata and debug certificate were recorded.
- `windows-desktop`: NSIS installer `Niger-Delta-WQ-Setup-1.0.0.exe` was generated and uploaded. The workflow explicitly reported that no code-signing certificate was configured.

Artifacts from run #44523260517 (sizes are uploaded ZIP artifact sizes):

- Web `ndwq-integrated-web`, ID `14528891642`, **301,488 bytes**; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/44523260517/artifacts/14528891642); expires **3 December 2026 at 12:22:49 UTC**.
- Android `ndwq-integrated-android-debug-apk`, ID `14529516754`, **8,081,134 bytes**; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/44523260517/artifacts/14529516754); expires **3 December 2026 at 12:27:16 UTC**. The archive contains the original-identity debug APK, side-by-side preview debug APK and build/signing metadata.
- Windows `ndwq-integrated-windows-desktop`, ID `14529401732`, **95,587,261 bytes**; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/44523260517/artifacts/14529401732); expires **3 December 2026 at 12:24:33 UTC**.

Android identity/signing evidence from the run:

- Original package: `com.nigerdeltawq.mobile`; label: `Niger Delta WQ`; launcher: `com.nigerdeltawq.mobile.MainActivity`.
- Original debug APK SHA-256: `c0ab22b15b057398903033c455c424ba00afc2cf5fb4bebe96fdc08c52f03ff0`.
- Debug certificate SHA-256 fingerprint: `cd468ee5cfedd72647e41cdc2d4d8f26c3d57e3af75c9faed5c4073e62713a30`.
- The certificate subject is Android Debug. It is not a persistent production signing identity and does not establish compatibility with the user's installed app.
- Preview package: `com.nigerdeltawq.mobile.preview2`; preview APK SHA-256: `2d63c4c1c2df4d90c000bcf3075c6427d315d17a7476d0a5034b4266d1c28887`.

The specifically requested earlier [run #43762079209](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/43762079209), on commit `0e81667b0876f6d3373fd4aa7b8d227843448676`, is complete but **failed**. Its exact Android step, `Launch APK in Android emulator`, failed after the emulator booted: the settings service returned `Broken pipe (32)` and ADB exited with code `224`. The Android artifact upload was skipped. Its web and Windows artifacts uploaded, but there was no Android APK artifact for that run. The later successful run #44523260517 verifies the corrected emulator workflow on the current branch-head commit; it does not retroactively make the earlier run successful.

This is a same-commit three-platform CI pass and emulator launch smoke test, not production or device acceptance. The web build artifact has **not** been deployed to an accessible public URL. The Windows installer has **not** been installed/runtime-tested on a real Windows computer. Android physical-device first-screen/core-workflow acceptance, a recoverable backup/restore against actual device data, production signing, and compatibility with the currently installed app remain unverified. Do not uninstall, clear app data or install the debug APK over an existing phone installation based on this CI result.

Retain the scientific limitations: ERT inversion is not implemented; imported inversion results and interpolation are not a field-data inversion; DRASTIC bands require local hydrogeological justification; WQI alone does not establish potability. Scientific reference/calibration review and formal sign-off remain outstanding.


## Canonical coordinate CRS and UTM hemisphere validation — 22 November 2026

The coordinate workflow now records the canonical storage reference system explicitly as **WGS84 geographic EPSG:4326** in the coordinateStorageCRS field whenever a complete coordinate pair is validated. The existing coordinateCRS field continues to retain the user's selected display CRS, so derived UTM display metadata is not confused with the stored latitude/longitude values. The coordinate panel labels this as a derived display CRS and identifies EPSG:4326 as the canonical storage CRS.

The UTM display selector supports Zones 31 and 32 in both hemispheres. A selected UTM hemisphere that conflicts with the entered latitude is rejected with a visible validation message rather than displaying a derived EPSG code that disagrees with the saved CRS label. Regression tests cover EPSG:4326 metadata, storage/backup restoration for VES, ERT and sample records, northern and southern UTM EPSG codes, and invalid hemisphere/zone selections. This test fixture verifies persistence of sample coordinate metadata; it does not by itself prove that the source application's sample-entry screen captures coordinates.

The immediately preceding branch-head commit was efb34fbf318c6a60a17e3c929af67c2293a5c856. [CI run #44904683689](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/44904683689) completed successfully on that commit: web/scientific tests passed (125/125), Android debug APK build and API 35 emulator install/launch passed for the original and preview package identities, and the Windows NSIS installer build/upload passed. Artifacts (uploaded ZIP sizes):

- Web ndwq-integrated-web, ID 14707017514, 301,488 bytes; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/44904683689/artifacts/14707017514); expires 5 December 2026 at 12:35:57 UTC.
- Android ndwq-integrated-android-debug-apk, ID 14707940692, 8,081,122 bytes; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/44904683689/artifacts/14707940692); expires 5 December 2026 at 12:40:28 UTC.
- Windows ndwq-integrated-windows-desktop, ID 14707571758, 95,587,175 bytes; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/44904683689/artifacts/14707571758); expires 5 December 2026 at 12:37:29 UTC.

These are build artifacts and CI/emulator evidence only. The Android APK remains debug-signed; signing compatibility with the installed phone app and production signing are not established. Physical-device acceptance, actual phone backup/restore, Windows installation/runtime, accessible web deployment/browser acceptance and scientific sign-off remain outstanding. PR #2 remains open and draft. No merge, production deployment, release publication or signing-key change was performed.


## Missing-coordinate coercion guard and latest same-commit CI — 23 November 2026

Coordinate conversion APIs now reject blank strings, whitespace-only strings, null, undefined, booleans, non-finite numbers and non-numeric types before numeric coercion. This prevents JavaScript conversions such as `Number('')`, `Number(null)` and `Number(false)` from silently creating zero-valued coordinates. The guard covers DD/DMS/DDM parsing, decimal formatting, UTM zone selection and validation, WGS84-to-UTM conversion, and UTM-to-WGS84 conversion. Regression tests exercise missing/invalid inputs across these entry points; existing positive coordinate, hemisphere, UTM round-trip and independent PROJ reference tests remain in place.

The earlier specifically requested [run #43762079209](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/43762079209) is complete and failed on its Android launch step after ADB reported a settings-service broken pipe and exit code 224; the Android artifact upload was skipped. The subsequent current-head [run #45022240411](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45022240411), on commit `36e8d36197c086c5950e26be8adedfb767539a4f`, passed all three platform jobs:

- Web/scientific tests: **127 passed, 0 failed**; production web build and artifact upload passed.
- Android: original-identity debug APK built; API 35 emulator boot, install and launch passed. The logs observed process `2162` and resumed activity `com.nigerdeltawq.mobile/.MainActivity`. The isolated preview package `com.nigerdeltawq.mobile.preview2` also installed and launched.
- Windows: NSIS installer build and artifact upload passed.

Artifacts from run #45022240411 (GitHub-uploaded ZIP archive sizes):

- Web `ndwq-integrated-web`, ID `14754456786`, **301,735 bytes**, SHA-256 `17e9e48b362ea96d2eeb2bf545cac70bfecf36b204cb5f793fd53264bb865236`; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45022240411/artifacts/14754456786); expires **6 December 2026 at 12:26:23 UTC**.
- Android `ndwq-integrated-android-debug-apk`, ID `14754283113`, **8,081,294 bytes**, SHA-256 `23acb6e81342d1646e90850975dcb757bedeebc94c83145cab49004e4b1f5c87`; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45022240411/artifacts/14754283113); expires **6 December 2026 at 12:30:08 UTC**.
- Windows `ndwq-integrated-windows-desktop`, ID `14753808090`, **95,587,429 bytes**, SHA-256 `490b736351c7fc1198c55b5a26c3e4453e93299c13322edf5b309adfd75a0236`; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45022240411/artifacts/14753808090); expires **6 December 2026 at 12:28:02 UTC**.

The original APK metadata confirms package `com.nigerdeltawq.mobile`, label `Niger Delta WQ`, launcher `com.nigerdeltawq.mobile.MainActivity`. Its certificate fingerprint is `281144bed5e4ddb26bcd8473049601a2ed2cf4768a61e313b717f72e605d950f`, with subject `Android Debug`. This remains a CI debug certificate, not a persistent production signing identity; compatibility with the APK already installed on the user's phone is not established. The artifact above is a ZIP containing the APK(s) and metadata, not a direct standalone APK URL.

This CI pass supersedes the failed earlier emulator run for current-branch build evidence, but does not retroactively change that failed run. It does not establish physical-device first-screen/core-workflow acceptance, safe update or backup/restore on actual phone data, Windows installation/runtime on a real PC, public web deployment/browser acceptance, or scientific review/sign-off. PR #2 remains open and draft; no merge, public release, deployment, signing-key change or production signing was performed. Retain the existing scientific limitations: ERT inversion is not implemented, imported inversion/interpolation is not field-data inversion, DRASTIC bands require local justification, and WQI alone does not establish potability.


## Latest coordinate validation and Android emulator CI evidence — 24 November 2026

The branch-head commit `8c174c1112428f5d68578b64fa5ae7ab058263cd` (`fix(coordinates): reject missing values before numeric conversion`) completed [CI run #45172861557](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45172861557) successfully on the exact commit. All three required jobs passed:

- `web-and-tests`: **128 tests passed, 0 failed**; Vite production build and web artifact upload passed.
- `android`: debug APK build, API 35 emulator boot/core-service readiness, original-identity APK installation and launch, preview APK build/launch, and APK artifact upload passed. The original package was `com.nigerdeltawq.mobile`, version code `1`, version name `1.0`, label `Niger Delta WQ`, launcher `com.nigerdeltawq.mobile.MainActivity`. The logs observed the original launcher activity as `topResumedActivity`; the preview package was `com.nigerdeltawq.mobile.preview2`.
- `windows-desktop`: NSIS installer generation and artifact upload passed. The build log explicitly says no code-signing certificate was configured.

Artifacts from run #45172861557 (GitHub-uploaded ZIP archive sizes):

- Web `ndwq-integrated-web`, ID `14817847521`, **301,819 bytes**; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45172861557/artifacts/14817847521); expires **7 December 2026 at 12:17:49 UTC**.
- Android `ndwq-integrated-android-debug-apk`, ID `14817328212`, **8,081,391 bytes**; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45172861557/artifacts/14817328212); expires **7 December 2026 at 12:22:12 UTC**. The ZIP contains the original-identity debug APK, isolated preview debug APK and signing/build metadata.
- Windows `ndwq-integrated-windows-desktop`, ID `14817588349`, **95,587,620 bytes**; [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/45172861557/artifacts/14817588349); expires **7 December 2026 at 12:19:28 UTC**.

Android signing metadata from the same run identifies the original APK as debug-signed, with certificate subject `Android Debug` and SHA-256 certificate fingerprint `9c5904d2dcb7c6720d1b21b7836e89c9f31ebc853ca44245469bfc59c8a892ac`. This is not a production signing identity and does not prove compatibility with the APK already installed on a physical phone.

The specifically requested [run #43762079209](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/43762079209) on commit `0e81667b0876f6d3373fd4aa7b8d227843448676` is complete and **failed**. Its Android job built the APK, but the emulator did not become available to ADB: logs reported inability to connect to the ADB daemon on port 5037, repeated ADB exit-code 1 responses, then a settings-service `Broken pipe (32)` and ADB exit code 224. The exact `Launch APK in Android emulator` step failed and Android artifact upload was skipped. This is an emulator/ADB startup failure, not evidence that the app's launcher activity itself crashed. Later current-branch runs #45022240411 and #45172861557 passed the improved API 35 emulator launch workflow; they do not retroactively change the earlier run's failure.

A workflow reliability cleanup is included with this documentation update: the `/dev/kvm` hardware-acceleration preflight belongs only in the Android job. It was unnecessarily duplicated in `web-and-tests`, making a web-only test/build job fail on a runner without KVM even though that job does not start an emulator. A regression test now asserts that KVM is required only by the Android job. The cleanup commit's own CI result is pending until its workflow run completes.

This is same-commit CI and emulator process/activity evidence, not physical-device acceptance. It does not establish physical Android first-screen/core-workflow acceptance, safe update compatibility, production signing, or backup/restore on actual phone data. The Windows installer has not been installed/runtime-tested on a real Windows machine. The web artifact has not been deployed to an accessible URL or browser-tested there. Scientific reference checks, local DRASTIC calibration justification and formal sign-off remain outstanding. PR #2 remains open and draft.

Retain the scientific limitations: ERT inversion is not implemented; imported inversion results and interpolation are not field-data inversion; DRASTIC bands require local hydrogeological justification; WQI alone does not establish potability. Do not uninstall, clear app data or install a debug APK over an existing phone installation based on CI evidence.
