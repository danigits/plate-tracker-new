import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.appname', // Must match Android package name
  appName: 'plate-tracker',
  webDir: 'dist', // Should match your build output directory
  bundledWebRuntime: false
};

export default config;