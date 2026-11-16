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

The latest verified CI run is [Run 43826755804](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/43826755804), on commit `2f8c086a71f0c2b6b384fc7fc335dfea075ce45f` (16 November 2026). GitHub reports all three jobs (`web-and-tests`, `windows-desktop`, and `android`) completed with conclusion `success`.

- Web: all 114 automated scientific/geophysics tests passed (114 passed, 0 failed); the production web build and artifact upload passed.
- Android: debug APK build passed; API 35 emulator boot completed, APK installation returned `Success`, launcher activity status was `ok`, and the resumed app activity was detected. This is automated emulator evidence only; it does not establish physical-device acceptance, first-frame rendering on a real phone, or compatibility with an existing installation.
- Windows: the NSIS installer was generated and uploaded successfully with Electron Builder publishing explicitly disabled (`--publish never`). The installer is unsigned in this CI run. This does not establish installation or runtime behavior on a physical Windows computer.
- The source Capacitor configuration was successfully inspected before the workflow's temporary test override. Its original app identity is `com.nigerdeltawq.mobile` and app name `Niger Delta WQ`. The CI workflow deliberately changes only its build workspace to temporary test identity `com.nigerdeltawq.mobile.upgradefix3` / `Niger Delta WQ Upgrade Fix 3` for emulator smoke testing. The original source configuration remains unchanged. This identifies the intended package ID, but does not prove signing compatibility with any existing installed app.
- Artifacts verified through the run's artifact listing (sizes are uploaded ZIP artifact sizes, not installed application sizes):
  - `ndwq-integrated-web`: 300,899 bytes, [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/43826755804/artifacts/14207091534); SHA-256 `cb65d57fca433d7465e0285892772b571ff9a7117c0e0cd4f3c5d99d5c8bc5d3`; expires 30 November 2026 at 07:51:53 UTC.
  - `ndwq-integrated-android-debug-apk`: 4,038,845 bytes, [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/43826755804/artifacts/14207136894); SHA-256 `2ad8dcd891b88ac0f92bce22bcc20ad4c3bc9ce14fcb6497b49a3b05a079d725`; expires 30 November 2026 at 07:55:21 UTC.
  - `ndwq-integrated-windows-desktop`: 95,586,677 bytes, [download](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/43826755804/artifacts/14207091811); SHA-256 `4384aaee16397c4ad3babc4f26bc470f6a615643873559a9656696f558e9a455`; expires 30 November 2026 at 07:53:26 UTC.
- The web test log records 114 tests passed and 0 failed. The Windows job built the NSIS installer with publishing disabled. The Android job records Gradle `BUILD SUCCESSFUL`, API 35 emulator readiness, ADB install success, launcher status `ok`, a detected resumed activity, and successful APK artifact upload.
- GitHub's artifact retention is temporary; these downloads expire on the dates above. Expiry does not disable an installed app or remove the source code. Preserve required build evidence before expiry.

**Do not interpret these checks as proof of full app functionality on physical devices or as approval to distribute/install the artifacts as a production release.**
Release restrictions and product limitations to retain during testing:

1. The Android CI build uses the test application ID `com.nigerdeltawq.mobile.upgradefix3`, the temporary app label `Niger Delta WQ Upgrade Fix 3`, and a debug APK. It is not evidence that this APK can update an existing installed NDWQ application.
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
