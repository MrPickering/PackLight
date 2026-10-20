# PackLight

PackLight is a local-first personal reflection app. Name what you carry, break large burdens into smaller pieces, identify what helps, and choose a manageable next step. It covers emotions, responsibilities, abilities, resources, goals, and identity.

The core loop is capture → unpack → classify → act or release → review. Journaling, recovery check-ins, contexts, and a weekly repack support that loop. Load Balance is a subjective reflection score, not a validated health measure. PackLight does not diagnose, treat, or monitor emergencies.

## Status

Version **1.0.0**, application ID **`ai.pickbits.packlight`** on Android and iOS. Prepared for an unsigned beta handoff. See [the release review](docs/RELEASE_REVIEW.md) for verified checks and remaining public-launch gates, and [mobile build instructions](docs/MOBILE_RELEASE.md) for artifacts, signing, and iOS compilation.

## Develop and verify

Use Node 22.12+ (latest Node 22 LTS recommended).

```sh
npm ci
npm run dev
npm run check
npx playwright install chromium webkit
npm run test:e2e
```

`check` runs lint, unit tests, TypeScript, and a production build. Browser tests cover mobile Chromium and WebKit. `dist/` is the web release; serve it over HTTPS. Hash routing works on static hosts without rewrite rules. Core mobile features work offline because assets are bundled; the web build requires a network connection for its initial page load and has no service worker.

## Mobile

```sh
npm run mobile:sync
npm run android:debug
npm run ios:prepare
```

Android needs JDK 21 and SDK 36. iOS compilation needs macOS and Xcode 26 or newer. Both native projects are checked in. The manually triggered **Prepare unsigned mobile builds** workflow builds Android packages, an iOS Simulator app, and an unsigned iOS archive on a Mac runner. It does not upload to either store.

`npm run android:release` requires signing environment variables and fails clearly if they are missing. For an explicitly unsigned release, run `gradlew assembleRelease bundleRelease` from `android/` (`./gradlew` on macOS/Linux).

## Data and privacy

- Browser: `packlight-store` in localStorage. Mobile: Capacitor Preferences, with migration from older WebView storage. Native writes are serialized and the app waits for hydration before rendering.
- No accounts, analytics, advertisements, or automatic cloud sync. Android backup/transfer is disabled; iOS system backups depend on device settings.
- Export/import uses validated JSON. Imports preview item counts and require confirmation before replacement. Exports are unencrypted and should be kept private. Mobile exports use the system share sheet.
- Optional AI sends explicitly selected journal text/mood or a chat message and related item context directly to Anthropic. It requires a user's own API key and session consent. The key stays in memory and never enters backups. Plain Save Entry stays local even with AI enabled.
- The prototype's previously persisted API key is removed on startup. Users must re-enter it and consent to optional AI for each session.
- [Public privacy text](public/privacy.html) is also available inside the app before onboarding and in Settings. Host this page at a public HTTPS URL before store submission.

## Architecture

React 19, TypeScript, Vite, Tailwind 4, Zustand, Framer Motion, Recharts, Zod, and Capacitor 8. No application backend. `src/store/` owns state and actions; `src/utils/backup.ts` validates persisted and imported data; `src/utils/storage.ts` handles durable writes; `src/utils/api.ts` owns optional AI. Tests live in `tests/unit/` and `tests/e2e/`.

MIT licensed. Report bugs using the repository issue tracker, without including private journals, API keys, or backup files.
