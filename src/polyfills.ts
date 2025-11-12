// Polyfills for Solana web3 + wallet adapter in React Native
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { setAudioModeAsync } from 'expo-audio';
// Optional: SubtleCrypto polyfill (Dev Client). If you install expo-standard-web-crypto,
// you can uncomment the next lines to enable WebCrypto APIs.
// import { polyfillWebCrypto } from 'expo-standard-web-crypto';
// polyfillWebCrypto();

// Buffer
import { Buffer } from 'buffer';
// @ts-ignore
if (!globalThis.Buffer) globalThis.Buffer = Buffer;

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
