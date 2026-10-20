# PackLight release review

Reviewed October 19–20, 2026. Application ID confirmed by the owner: `ai.pickbits.packlight`. The owner requested unsigned build preparation.

## Intention and audience

PackLight turns an indistinct mental burden into named, organized items. Six compartments cover emotions, responsibilities, abilities, resources, goals, and identity. Users rate energy cost and usefulness, unpack broad concerns into smaller parts, write what/how/why reflections, choose next steps, release items, journal, and review recovery and changes over time.

The strongest positioning is **a private personal reflection and life-inventory tool**. Its differentiated feature is the unpack/classify/review loop, supported by different information-density modes. It is not travel packing software, a clinical assessment, therapy, a scientifically validated stress meter, or an autonomous AI coach. Agent reminders are local rules; AI chat and journal analysis are optional, user-initiated Anthropic calls. Existing external coach-mark.ai links are referral links, not in-app integrations.

Suggested promotional sentence: “See what you carry. Break big concerns into smaller pieces, notice what supports you, and choose one manageable next step.” Avoid promises of treatment, healing, diagnosis, or measured burnout prevention. No retention or market-demand evidence is present in this repository, so commercial readiness is unproven.

## Verdict

**The original project was not ready for store release. The revised project is ready for an unsigned beta handoff, with public promotion held until native device validation, signing, store metadata, and privacy hosting are complete.**

The original was a web-only prototype with a template README, no native projects/CI/tests, failing lint, 12 dependency advisories, fragile backup imports, persistent API secrets, silent AI errors, and no clear privacy disclosure. Automatic aging changed users' self-ratings; improved recovery could incur a score penalty; releasing/restoring nested items had accounting and visibility errors.

## Changes made

- Added Capacitor Android/iOS projects, app identifier, versioning, icons/launch images, safe-area styling, Android back handling, native export sharing, iOS privacy resource, Android backup exclusions, and environment-based release signing.
- Added validation for persisted state and backups, legacy defaults, cycle/duplicate/missing-parent checks, import preview/confirmation, visible errors, startup recovery/export, native Preferences storage, and serialized writes. Existing data is not silently cleared on hydration failure.
- Changed API secrets to session memory; added explicit consent, direct-provider disclosure, timeout/HTTP/response validation, and a local-only Save Entry choice. Fixed incorrect item approval after dismissing an earlier AI suggestion. No production API key was used.
- Stopped automatic changes to self-ratings; corrected recovery scoring, local calendar-day behavior, history updates, nested release/restore behavior, leaf-only totals, cross-category item visibility, and stale context updates during render. Released items now have a Restore action.
- Made display modes available immediately, added modal focus/Escape handling and reduced-motion behavior, removed remote font requests, added production CSP and an offline in-app privacy page, and softened unsupported health/healing claims.
- Updated vulnerable dependencies and added unit/browser checks plus web/mobile CI workflows and build documentation.

## Verification and limits

- Lint, TypeScript, and production web build pass.
- 19 unit tests cover backup validation/round trips, persistence, hierarchy operations, rating/recovery behavior, and AI consent/errors.
- 10 mobile browser checks pass across Chromium and WebKit: complete onboarding, privacy access, pack/journal persistence, export/import, corrupt storage recovery, optional AI consent and suggestion approval, decomposition/classification, main-route widths, and modal Escape.
- Dependency audit: zero reported vulnerabilities after updates and a scoped build-tool override.
- Android debug APK, unsigned release APK, and unsigned release AAB compile successfully. Android lint passes; see the handoff's artifact hashes and native lint report for advisory warnings.
- Xcode project parses locally and includes the required source/assets/privacy resource. **No iOS compilation or signing was possible on this Windows host.** A Mac workflow is prepared but has not been executed here.
- Android runtime testing was attempted but the emulator cannot start: the Android Emulator hypervisor driver is missing. No real phone was connected. Native sharing, lifecycle, accessibility, and platform-specific behavior still require device verification.
- Live Anthropic requests were not tested. The success/error tests use mocked responses; provider availability, billing, and model access must be checked with an authorized real account.
- The main web JS chunk still triggers Vite's advisory size warning (about 185 KB gzipped); chart routes are split. This is an optimization opportunity, not a compile failure.

## Before public promotion

Complete the device and store checklist in [MOBILE_RELEASE.md](MOBILE_RELEASE.md). Start with a small private beta to verify that users understand the ratings and find the unpacking flow helpful rather than burdensome. Public store availability and marketing should follow verified native builds and real user feedback.
