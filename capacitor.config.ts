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
  // Android-specific configuration for intent handling
  android: {
    // These would be configured in AndroidManifest.xml
    // Intent filters for "Open with" and share handling:
    // - android.intent.action.VIEW for URL handling
    // - android.intent.action.SEND for share intent
  },
};

export default config;

/*
 * ANDROID MANIFEST ADDITIONS (add to android/app/src/main/AndroidManifest.xml):
 *
 * Inside <activity> tag, add these intent filters:
 *
 * <!-- Handle "Open with" for HTTP/HTTPS links -->
 * <intent-filter>
 *   <action android:name="android.intent.action.VIEW" />
 *   <category android:name="android.intent.category.DEFAULT" />
 *   <category android:name="android.intent.category.BROWSABLE" />
 *   <data android:scheme="http" />
 *   <data android:scheme="https" />
 * </intent-filter>
 *
 * <!-- Handle share intent for text/links -->
 * <intent-filter>
 *   <action android:name="android.intent.action.SEND" />
 *   <category android:name="android.intent.category.DEFAULT" />
 *   <data android:mimeType="text/plain" />
 * </intent-filter>
 */
