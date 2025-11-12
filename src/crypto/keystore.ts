import * as SecureStore from 'expo-secure-store';

const KEY_ALIAS = 'solana_seeker_aes_key_v1';

export async function getOrCreateKey(): Promise<Uint8Array> {
  const existing = await SecureStore.getItemAsync(KEY_ALIAS);
  if (existing) return base64ToBytes(existing);
  const key = cryptoRandomBytes(32);
  await SecureStore.setItemAsync(KEY_ALIAS, bytesToBase64(key));
  return key;
}

export async function resetKey(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_ALIAS);
}

function cryptoRandomBytes(n: number): Uint8Array {
  const arr = new Uint8Array(n);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(arr);
    return arr;
  }
  // fallback PRNG
  for (let i = 0; i < n; i++) arr[i] = Math.floor(Math.random() * 256);
  return arr;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return globalThis.btoa ? globalThis.btoa(binary) : Buffer.from(bytes).toString('base64');
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = globalThis.atob ? globalThis.atob(b64) : Buffer.from(b64, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

