# Android signing readiness and safe-update gate

## Current state

The CI APKs are **debug-signed**. They are for automated emulator checks only and must not be installed as updates over an existing NDWQ installation. The CI debug certificate is not evidence of the certificate used by the user's installed app.

## Required evidence before a production update

1. Obtain the SHA-256 signing-certificate fingerprint from the exact NDWQ APK currently installed on the target device, or from its trusted original release record. Do not infer it from the package name.
2. Securely identify the production signing arrangement. For direct APK distribution, the APK must be signed with the same app-signing certificate as the installed app. If Google Play App Signing is used, distinguish the Play app-signing certificate (which signs delivered APKs) from the upload key (which authenticates uploads).
3. Keep keystore files and passwords in protected CI secrets. Never commit them, paste them into chat, print them in logs, or put them in an artifact.
4. Run `upgrade/scripts/android-release-signing-preflight.sh` with protected environment variables:
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `NDWQ_EXISTING_APP_CERT_SHA256`
5. The preflight fails closed unless the keystore alias certificate fingerprint exactly matches the supplied installed-app certificate fingerprint. It does not build, install, replace, or upload an APK.
6. After a successful match, separately configure and review the release build signing task, increment versionCode, verify package ID `com.nigerdeltawq.mobile`, inspect the final APK with `apksigner verify --print-certs`, and compare the final APK certificate fingerprint again before any distribution.
7. Preserve the existing app and its data. Never uninstall, clear app data, or attempt an in-place update until the signer and backup/restore gates have passed.

## Important limitation

The preflight validates one direct-signing certificate match. It is not a substitute for verifying the Google Play App Signing model, Play Console ownership, key-rotation lineage, or the exact certificate on the user's installed build. If the installed app's signing identity cannot be established reliably, stop: a safe update cannot yet be approved.

## Current release blockers

- Existing installed-app certificate fingerprint has not yet been independently established.
- Production keystore and protected CI secrets have not been configured or validated.
- No production-signed APK has been built or distributed.
- Physical-device update and backup/restore acceptance remain outstanding.
