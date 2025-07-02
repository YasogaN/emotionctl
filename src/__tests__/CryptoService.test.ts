import { CryptoService } from '../services/CryptoService';

describe('CryptoService', () => {
  const testData = 'This is a test journal entry with sensitive information.';
  const password = 'mySecurePassword123!';

  test('should encrypt and decrypt data correctly', () => {
    const encrypted = CryptoService.encrypt(testData, password);

    expect(encrypted.data).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.salt).toBeDefined();
    expect(encrypted.data).not.toBe(testData);

    const decrypted = CryptoService.decrypt(encrypted, password);
    expect(decrypted).toBe(testData);
  });

  test('should fail with wrong password', () => {
    const encrypted = CryptoService.encrypt(testData, password);

    expect(() => {
      CryptoService.decrypt(encrypted, 'wrongPassword');
    }).toThrow();
  });

  test('should generate unique encrypted data for same input', () => {
    const encrypted1 = CryptoService.encrypt(testData, password);
    const encrypted2 = CryptoService.encrypt(testData, password);

    expect(encrypted1.data).not.toBe(encrypted2.data);
    expect(encrypted1.iv).not.toBe(encrypted2.iv);
    expect(encrypted1.salt).not.toBe(encrypted2.salt);
  });

  test('should hash and verify passwords correctly', () => {
    const hash = CryptoService.hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).toContain(':');
    expect(CryptoService.verifyPassword(password, hash)).toBe(true);
    expect(CryptoService.verifyPassword('wrongPassword', hash)).toBe(false);
  });

  test('should generate unique IDs', () => {
    const id1 = CryptoService.generateId();
    const id2 = CryptoService.generateId();

    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
  });
});
