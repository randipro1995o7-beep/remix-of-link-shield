import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.68853c44911b4a5ea19b1a4f452faff0',
  appName: 'Link Guardian',
  webDir: 'dist',
  server: {
    // Enable hot reload during development
    url: 'https://68853c44-911b-4a5e-a19b-1a4f452faff0.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#f5f9f8',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#f5f9f8',
    },
  },
};

export default config;
