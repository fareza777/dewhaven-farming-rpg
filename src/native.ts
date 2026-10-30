import { Capacitor, SystemBars } from '@capacitor/core';
import { App } from '@capacitor/app';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { SplashScreen } from '@capacitor/splash-screen';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export const nativeAndroid = Capacitor.getPlatform() === 'android';
export async function setupAndroid(back: () => void, background: () => void, foreground: () => void) {
  if (!nativeAndroid) return;
  document.body.classList.add('native-android');
  await Promise.allSettled([
    ScreenOrientation.lock({ orientation: 'portrait' }),
    SystemBars.hide(),
    App.addListener('backButton', back),
    App.addListener('pause', background),
    App.addListener('resume', () => { foreground();void SystemBars.hide().catch(() => {}); }),
    App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) background();
      else { foreground();void SystemBars.hide().catch(() => {}); }
    })
  ]);
}
export function finishNativeSplash() {
  if (nativeAndroid) void SplashScreen.hide().catch(() => {});
}
export function exitAndroid() {
  if (nativeAndroid) void App.exitApp();
}
export function haptic() {
  if (nativeAndroid) void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}
export async function shareAndroid(title: string, text: string) {
  await Share.share({ title, text, dialogTitle: 'Share your valley' });
}
export async function exportAndroid(filename: string, text: string) {
  const file = await Filesystem.writeFile({ path: filename, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
  await Share.share({ title: 'Dewhaven save', files: [file.uri], dialogTitle: 'Keep your farm safe' });
}
