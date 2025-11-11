// Only run these tests if WebCrypto (crypto.subtle) is available in the environment.
let encryptionService: typeof import('../lib/encrypt').encryptionService;
const hasWebCrypto = typeof global.crypto !== 'undefined' && !!global.crypto.subtle;

(hasWebCrypto ? describe : describe.skip)('Encryption Service', () => {
  let testKey: CryptoKey;

  beforeAll(async () => {
    // Dynamically import the encryption module only when WebCrypto is available
    const mod = await import('../lib/encrypt');
    encryptionService = mod.encryptionService;
    testKey = await encryptionService.generateKey();
  });

  test('should encrypt and decrypt data correctly', async () => {
    const originalData = 'Sensitive user data';
    
    const encrypted = await encryptionService.encrypt(originalData, testKey);
    const decrypted = await encryptionService.decrypt(encrypted, testKey);
    
    expect(decrypted).toBe(originalData);
    expect(encrypted).not.toBe(originalData);
  });

  test('should handle JSON data', async () => {
    const testData = { 
      message: 'Hello World', 
      number: 42,
      array: [1, 2, 3]
    };
    
    const encrypted = await encryptionService.encryptUserData(testData);
    const decrypted = await encryptionService.decryptUserData(encrypted);
    
    expect(decrypted).toEqual(testData);
  });
}); 