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
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `NDWQ_EXISTING_APP_CERT_SHA256`
6. The preflight validates the supplied keystore alias certificate against the supplied fingerprint. It does not build, install, replace, or upload an APK, and a passing check alone does not approve a release.
7. After the signing model and identity are independently confirmed, configure the release build, increment `versionCode`, verify package ID, inspect the final APK using `apksigner verify --print-certs`, and compare its certificate with the correct installed-app signing identity.
8. Conduct update and backup/restore acceptance on a separate test device or isolated test installation first. Preserve the existing installation and its data.

## Stop conditions

Do not attempt an update if the installed certificate, Play App Signing identity, signing lineage, package identity, or backup integrity is uncertain. Never uninstall the existing app or clear its data as a workaround for a signature mismatch.

## Open release blockers

- The existing installed-app certificate fingerprint has not been independently established.
- The production signing model and protected production secrets have not been configured and verified.
- No production-signed APK has been built and verified.
- Physical-device update and backup/restore acceptance remain outstanding.

These are external evidence and authorization gates; they cannot be closed by another debug APK or emulator build.
