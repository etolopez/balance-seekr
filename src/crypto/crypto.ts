export type Cipher = { cipher: string; iv: string };

export function isWebCryptoAvailable(): boolean {
  return !!globalThis.crypto && !!globalThis.crypto.subtle;
}

export async function encryptString(plain: string, keyBytes: Uint8Array): Promise<Cipher> {
  if (!isWebCryptoAvailable()) {
    return { cipher: plain, iv: '' };
  }
  const iv = cryptoRandomBytes(12);
  const cryptoKey = await importAesGcmKey(keyBytes);
  const enc = new TextEncoder();
  const ct = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, enc.encode(plain));
  return { cipher: bytesToBase64(new Uint8Array(ct)), iv: bytesToBase64(iv) };
}

export async function decryptString(cipher: string, ivB64: string, keyBytes: Uint8Array): Promise<string> {
  if (!isWebCryptoAvailable()) {
    return cipher;
  }
  const cryptoKey = await importAesGcmKey(keyBytes);
  const iv = base64ToBytes(ivB64);
  const pt = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, base64ToBytes(cipher));
  return new TextDecoder().decode(pt);
}

function importAesGcmKey(keyBytes: Uint8Array) {
  return globalThis.crypto!.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

function cryptoRandomBytes(n: number): Uint8Array {
  const arr = new Uint8Array(n);
  globalThis.crypto!.getRandomValues(arr);
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

