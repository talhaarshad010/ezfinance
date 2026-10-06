import { NativeModules, Platform } from 'react-native';

/**
 * Android draws the animated logo splash natively (android/.../splash/SplashOverlay.kt)
 * on top of React while JS loads. On iOS the JS `SplashScreen` route plays instead.
 */
export const HAS_NATIVE_SPLASH = Platform.OS === 'android';

/** Tell the native splash the first screen is rendered so it can fade away. */
export function hideNativeSplash() {
  if (HAS_NATIVE_SPLASH) {
    NativeModules.SplashOverlay?.hide?.();
  }
}
