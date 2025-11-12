# Solana Seeker (Expo + Expo Router)

Quick start to run on Expo Go. Usable flows: Home (daily phrase), Habits (add/log with notes), Breathwork (timed + visuals), Journal (add/view + grid), Tasks (todo list).

## Prereqs
- Node LTS installed
- Expo Go app on your iOS/Android device

## Install
```
cd solana-seeker
npm install
```

## Run (Expo Go)
```
npm run start
```
- Choose Tunnel or LAN
- Open Expo Go and scan the QR code

## Structure
- `src/app/` file-based routes
  - `(tabs)/` contains Home, Habits, Breath, Journal, Tasks
  - `settings.tsx` at root
- Scripts set `EXPO_ROUTER_APP_ROOT=src/app` so everything lives in `src/`

## Notes
- This scaffold avoids native-only deps so it runs in Expo Go.
- Data is in-memory while the app is open. We can add SQLite + Drizzle later (or SecureStore + Dev Client) for persistence and encryption.
- For Skia or Solana wallet later, build a Dev Client via EAS.

## Wallet Verification (Android Dev Client)
- Install deps:
  - `npm i @solana/web3.js @solana-mobile/mobile-wallet-adapter-protocol buffer`
  - `npx expo install react-native-get-random-values react-native-url-polyfill`
- Build a Dev Client:
  - `npx expo install expo-dev-client`
  - `npx expo run:android` (first time) or `eas build --profile development --platform android`
  - Start: `npx expo start --dev-client`
- Polyfills:
  - Loaded in `src/polyfills.ts` (imported by `src/app/_layout.tsx`)
  - Optional WebCrypto (SubtleCrypto): install `expo-standard-web-crypto` and uncomment lines in `src/polyfills.ts`
- Default flow (connect-only):
  - Tap “Verify with Solana” → wallet opens → authorize (connect) → returns to the app → address saved locally.
  - This runs without any on-chain transaction or message signing by default for a smoother return.
  - Optional: enable SIWS (Sign-in-with-Solana) for Seeker verification.
- Enable on-chain verification (optional):
  - Set an env var with your deployed program ID before starting: `EXPO_PUBLIC_VERIFY_PROGRAM_ID=YourProgramPubkey npm run android`
  - Or add it to your env and restart the dev server.
  - If set, the app will prefer on-chain verification via `verifyOnChain()`.

## Breathwork Audio Cues
- Phase Haptics and Phase Audio toggles in Settings
- A tiny base64 beep is embedded (src/audio/beep.ts). Replace with your own or bundle an asset in a Dev Client for better quality

## Persistence (SQLite) and Encryption
- Install native modules for SDK 54:
  - `npx expo install expo-sqlite expo-secure-store`
- Start the app again; the store hydrates from SQLite on launch.
- Settings → “Encrypt Journal” toggles app-layer encryption (AES-GCM) when WebCrypto is available (Dev Client). Expo Go stores plaintext.

## Dev Client (for Skia + Wallet + Crypto)
1) `npx expo install expo-dev-client`
2) Create a dev build:
   - `npx expo run:ios` or `npx expo run:android` (first time), or `eas build --profile development`
3) Start with dev client: `npx expo start --dev-client`
4) Optional packages:
   - Skia: `npm i @shopify/react-native-skia`
   - Solana wallet (Android-first): `npm i @solana/web3.js @solana-mobile/mobile-wallet-adapter-protocol`
   Configure polyfills per Solana Mobile docs.
- Seeker detection and SIWS
  - Detection (client-side, non-secure): uses `Platform.constants.Model === 'Seeker'` with fallbacks via `expo-device`.
  - Secure verification (server-assisted): enable SIWS in the client and verify on your backend that
    the `sign_in_result` is valid and the wallet holds a Seeker Genesis Token (SGT).
  - To enable SIWS in the app UI for Seeker devices, start with:
    - `EXPO_PUBLIC_USE_SIWS=1 npx expo start --dev-client`
  - Backend pieces (not included here):
    - Verify the SIWS payload using `@solana/wallet-standard-util`'s `verifySignIn`.
    - Check SGT ownership for the wallet (e.g., Helius `getTokenAccountsByOwnerV2`).
