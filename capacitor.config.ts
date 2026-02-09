import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safeguard.app',
  appName: 'SafeGuard',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '507578257201-0q919hibo7n20426aj2n0bcl32qaif4v.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
