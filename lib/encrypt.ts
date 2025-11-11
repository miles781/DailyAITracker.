import { ENCRYPTION_ALGORITHM, ENCRYPTION_KEY_USAGE } from './constants';

export class EncryptionService {
  private key: CryptoKey | null = null;

  async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: ENCRYPTION_ALGORITHM,
        length: 256,
      },
      true,
      ENCRYPTION_KEY_USAGE
    );
  }

  async importKey(rawKey: ArrayBuffer): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
      'raw',
      rawKey,
      ENCRYPTION_ALGORITHM,
      true,
      ENCRYPTION_KEY_USAGE
    );
  }

  async exportKey(key: CryptoKey): Promise<ArrayBuffer> {
    return await crypto.subtle.exportKey('raw', key);
  }

  async encrypt(data: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv,
      },
      key,
      encodedData
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  async decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv,
      },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  }

  // Allow clearing the stored key by passing null
  setUserKey(key: CryptoKey | null) {
    this.key = key;
  }

  async encryptUserData(data: unknown): Promise<string> {
    if (!this.key) throw new Error('Encryption key not set');
    return this.encrypt(JSON.stringify(data), this.key);
  }

  async decryptUserData(encryptedData: string): Promise<unknown> {
    if (!this.key) throw new Error('Encryption key not set');
    const decrypted = await this.decrypt(encryptedData, this.key);
    return JSON.parse(decrypted);
  }
}

export const encryptionService = new EncryptionService();