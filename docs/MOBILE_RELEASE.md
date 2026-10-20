# Mobile release handoff

Application ID: **ai.pickbits.packlight** · Version: **1.0.0** · Android version code / iOS build number: **1**.

The user requested unsigned builds. No release key was created and no store upload was attempted. Debug APKs use Android's normal development signing and are installable for testing. Unsigned release APK/AAB files are not store-ready.

## Android

Requirements: Node 22.12+, JDK 21, Android SDK platform 36. Minimum Android API 24; target and compile API 36.

```sh
npm ci
npm run mobile:sync
cd android
# Windows
gradlew.bat assembleDebug assembleRelease bundleRelease lint --no-daemon
# macOS/Linux
chmod +x gradlew
./gradlew assembleDebug assembleRelease bundleRelease lint --no-daemon
```

Outputs:

- `android/app/build/outputs/apk/debug/app-debug.apk` — development signed, installable.
- `android/app/build/outputs/apk/release/app-release-unsigned.apk` — unsigned release APK.
- `android/app/build/outputs/bundle/release/app-release.aab` — unsigned release bundle without signing environment variables.
- `android/app/build/reports/lint-results-debug.html` — native lint report.

For a signed upload later, use the existing Play upload key if this app already exists. Set `PACKLIGHT_KEYSTORE_PATH` (absolute path), `PACKLIGHT_KEYSTORE_PASSWORD`, `PACKLIGHT_KEY_ALIAS`, and `PACKLIGHT_KEY_PASSWORD` in your private environment, then run `npm run android:release`. Never commit keys/passwords. Increment `versionCode` before each new store upload. Do not distribute debug builds as the public release.

## iOS

The Xcode project and Swift Package Manager dependencies are prepared in `ios/App/`. Windows cannot compile an iOS app; **the local handoff contains source, not a compiled IPA or xcarchive**.

On a Mac with Xcode 26+:

```sh
npm ci
npm run ios:prepare
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath artifacts/ios-simulator CODE_SIGNING_ALLOWED=NO build
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath artifacts/PackLight-unsigned.xcarchive CODE_SIGNING_ALLOWED=NO archive
```

Alternatively, after committing/pushing the project, manually run `.github/workflows/mobile-builds.yml`. Its macOS 26 job prepares both unsigned products. The workflow was authored and inspected locally; it has not run on GitHub in this review. [GitHub documents the macOS 26 runner](https://github.com/actions/runner-images).

For TestFlight/App Store distribution, open `ios/App/App.xcodeproj`, select your Apple team in Signing & Capabilities, confirm `ai.pickbits.packlight` is registered, increment the build number as needed, and archive/export with the appropriate distribution profile. An unsigned archive cannot be installed on an ordinary iPhone or uploaded to TestFlight. Apple requires the iOS 26 SDK or later for uploads from April 28, 2026. [Apple SDK requirement](https://developer.apple.com/news/?id=ueeok6yw)

The app includes a PrivacyInfo.xcprivacy resource covering UserDefaults and file timestamp APIs plus conservative declarations for health-related ratings and user content sent to optional AI. These declarations do not replace App Store Connect's privacy questionnaire. `ITSAppUsesNonExemptEncryption` is false because this implementation uses platform HTTPS and no custom cryptography; re-evaluate if that changes.

## Store preparation

1. Verify the developer owns the application ID and prepare store listings under the intended accounts.
2. Publish `public/privacy.html` and a support destination on a maintained public HTTPS site. No public hosting was performed in this task.
3. Complete privacy/data-safety and health-content declarations based on optional journal/mood/chat transmission to Anthropic. Do not blindly select “no data collected.” Confirm Anthropic's current terms and the stores' treatment of user-directed processing.
4. Capture screenshots from the actual release on supported phones/tablets. Browser QA screenshots are not a substitute for store screenshots.
5. Test startup offline, app resume, back navigation, notch/gesture areas, keyboard, VoiceOver/TalkBack, native sharing/import, persistence after force-close, and upgrades on real Android/iOS devices.
6. Test optional AI with a real account, including invalid-key/offline/rate-limit behavior. Automated tests mock the provider and incur no charges.
7. Sign, run internal Play/TestFlight testing, resolve review feedback, and only then promote broadly.

## Asset and dependency maintenance

Edit `resources/icon.svg`, then run `npm run mobile:assets` to regenerate native icons and launch images. Regenerate web assets with `npm run mobile:sync` after every source change. The CLI's `xcode` dependency has a scoped `uuid` override to 11.1.1+ (CommonJS-compatible); remove the override when upstream adopts a patched compatible version. Native projects were generated and parsed successfully with it.
