import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fajar.dewhaven',
  appName: 'Dewhaven',
  webDir: 'dist',
  android: { backgroundColor: '#191e21', allowMixedContent: false },
  plugins: {
    SplashScreen: { launchShowDuration: 700, backgroundColor: '#191e21', showSpinner: false, launchFadeOutDuration: 250 },
    // MainActivity handles cutouts without letterboxing older Android WebViews.
    SystemBars: { hidden: true, style: 'DARK', insetsHandling: 'disable' }
  }
};
export default config;
