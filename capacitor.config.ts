import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.pickbits.packlight',
  appName: 'PackLight',
  webDir: 'dist',
  backgroundColor: '#0f172a',
  android: { allowMixedContent: false },
  ios: { contentInset: 'automatic' },
};
export default config;
