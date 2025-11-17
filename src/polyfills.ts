// Polyfills for Solana web3 + wallet adapter in React Native
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { setAudioModeAsync } from 'expo-audio';
// Optional: SubtleCrypto polyfill (Dev Client). If you install expo-standard-web-crypto,
// you can uncomment the next lines to enable WebCrypto APIs.
// import { polyfillWebCrypto } from 'expo-standard-web-crypto';
// polyfillWebCrypto();

// Buffer - Must be set up before any modules that use it
import { Buffer } from 'buffer';
// @ts-ignore
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}
// Also set on global for compatibility
if (typeof global.Buffer === 'undefined') {
  // @ts-ignore
  global.Buffer = Buffer;
}

// Configure audio so cues play even in iOS silent mode and duck on Android
(async () => {
  try {
    await setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    } as any);
  } catch {}
})();
