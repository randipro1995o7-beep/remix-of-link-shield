import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safeguard.app',
  appName: 'Safety SHIELD',
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
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["phone"],
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#000000",
      androidScaleType: "CENTER_INSIDE",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
