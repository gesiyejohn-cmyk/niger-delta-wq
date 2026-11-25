# Android signing readiness and safe-update gate

## Current state

The integrated CI APKs are debug-signed and intended for automated emulator checks only. They are not safe update packages for an existing NDWQ installation. The CI debug certificate does not establish the signing identity of the app already installed on a user's device.

## Evidence required before a production update

1. Identify the exact installed package ID and version on the target device. The expected package ID is `com.nigerdeltawq.mobile`; package name alone does not prove signing compatibility.
2. Obtain the SHA-256 signing-certificate fingerprint from the exact installed APK or its trusted original release record. Do not infer it from another build.
3. Establish the distribution model:
   - **Direct APK distribution:** the update must use the same app-signing certificate as the installed app, subject to any valid Android signing lineage.
   - **Google Play App Signing:** verify Play Console ownership and the Play app-signing certificate. The upload key authenticates uploads; it is not necessarily the certificate on APKs delivered to devices.
4. Store production keystore material and passwords only in protected CI secrets. Never commit, paste into chat, print, or upload keystore material or passwords.
5. Run the reviewed preflight script from the pinned upgrade overlay with these protected variables:
   - `NDWQ_DISTRIBUTION_MODEL` (must be `direct-apk` for this certificate-equality preflight)
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `NDWQ_EXISTING_APP_CERT_SHA256`
6. The preflight is deliberately limited to `NDWQ_DISTRIBUTION_MODEL=direct-apk`: it validates that the direct-APK signing keystore alias matches the exact installed-app signer fingerprint. It refuses `play-app-signing` because a Play upload key may differ from the app-signing certificate delivered to devices. For Google Play, verify the upload certificate and Play app-signing certificate separately in Play Console; this script does not perform that verification. It does not build, install, replace, or upload an APK, and a passing check alone does not approve a release.
7. After the signing model and identity are independently confirmed, configure the release build, increment `versionCode`, verify package ID, inspect the final APK using `apksigner verify --print-certs`, and compare its certificate with the correct installed-app signing identity.
8. Conduct update and backup/restore acceptance on a separate test device or isolated test installation first. Preserve the existing installation and its data.


## Read-only extraction of the installed APK certificate (direct APK installations)

If the app was installed directly as an APK and an authorized computer with Android Platform Tools is available, the following procedure reads the installed package files; it does not uninstall, update, clear, or modify app data.

1. Enable USB debugging only if permitted by the device owner, connect the phone, unlock it, and approve the computer's ADB authorization prompt.
2. Confirm the package is present:
   `adb shell pm list packages com.nigerdeltawq.mobile`
3. List the installed APK paths:
   `adb shell pm path com.nigerdeltawq.mobile`
4. Pull the path ending in `/base.apk` exactly as returned by the previous command:
   `adb pull "<path-returned-for-base.apk>" ndwq-installed-base.apk`
   If Android reports split APKs, retain the full path list and pull the base and split APKs for the evidence record. Do not alter the files on the device.
5. On the computer, run:
   `apksigner verify --verbose --print-certs ndwq-installed-base.apk`
   Record the signer certificate SHA-256 digest, package ID, app version, device model, Android version, and date. Keep the APK private; it may contain proprietary application code.
6. Compare only against a trusted production signing record or the correct distribution identity. For Google Play installations, confirm the Play app-signing certificate in Play Console; do not treat the upload key as the installed app signer.

Useful read-only package metadata commands:
- `adb shell dumpsys package com.nigerdeltawq`
- `adb shell pm path com.nigerdeltawq.mobile`

If ADB access is unavailable, the package path cannot be read, the installed build came from Google Play, or the signer/lineage is ambiguous, stop and obtain the authoritative signing record from the original distributor. Do not use a third-party APK download as a substitute for the exact installed build.

## Stop conditions

Do not attempt an update if the installed certificate, Play App Signing identity, signing lineage, package identity, or backup integrity is uncertain. Never uninstall the existing app or clear its data as a workaround for a signature mismatch.

## Open release blockers

- The existing installed-app certificate fingerprint has not been independently established.
- The production signing model and protected production secrets have not been configured and verified.
- No production-signed APK has been built and verified.
- Physical-device update and backup/restore acceptance remain outstanding.

These are external evidence and authorization gates; they cannot be closed by another debug APK or emulator build.
