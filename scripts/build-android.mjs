import { spawnSync } from 'node:child_process';
import { mkdirSync, copyFileSync } from 'node:fs';
const release = process.argv[2] === 'release';
const signed = ['PACKLIGHT_KEYSTORE_PATH', 'PACKLIGHT_KEYSTORE_PASSWORD', 'PACKLIGHT_KEY_ALIAS', 'PACKLIGHT_KEY_PASSWORD'].every(name => process.env[name]);
if (release && !signed) {
  console.error('Release signing is required. Set PACKLIGHT_KEYSTORE_PATH, PACKLIGHT_KEYSTORE_PASSWORD, PACKLIGHT_KEY_ALIAS, and PACKLIGHT_KEY_PASSWORD. To prepare an unsigned bundle explicitly, run Gradle bundleRelease in android/.');
  process.exit(1);
}
const windows = process.platform === 'win32';
const result = spawnSync(windows ? 'gradlew.bat' : './gradlew', [release ? 'bundleRelease' : 'assembleDebug', '--no-daemon'], { cwd: 'android', stdio: 'inherit', shell: windows });
if (result.status !== 0) process.exit(result.status ?? 1);
mkdirSync('artifacts/android', { recursive: true });
copyFileSync(release ? 'android/app/build/outputs/bundle/release/app-release.aab' : 'android/app/build/outputs/apk/debug/app-debug.apk', release ? 'artifacts/android/PackLight-1.0.0-release.aab' : 'artifacts/android/PackLight-1.0.0-debug.apk');
