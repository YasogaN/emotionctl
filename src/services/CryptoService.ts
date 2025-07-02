import * as CryptoJS from 'crypto-js';
import { EncryptedData } from '../types';

export class CryptoService {
  private static readonly ALGORITHM = CryptoJS.AES;
  private static readonly KEY_SIZE = 256;
  private static readonly IV_SIZE = 128;
  private static readonly SALT_SIZE = 128;
  private static readonly ITERATIONS = 10000;

  /**
   * Generates a cryptographic key from password using PBKDF2
   */
  private static deriveKey(password: string, salt: CryptoJS.lib.WordArray): CryptoJS.lib.WordArray {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: this.KEY_SIZE / 32,
      iterations: this.ITERATIONS,
      hasher: CryptoJS.algo.SHA256
    });
  }

  /**
   * Encrypts data using AES-256-CBC
   */
  static encrypt(data: string, password: string): EncryptedData {
    try {
      // Generate random salt and IV
      const salt = CryptoJS.lib.WordArray.random(this.SALT_SIZE / 8);
      const iv = CryptoJS.lib.WordArray.random(this.IV_SIZE / 8);

      // Derive key from password
      const key = this.deriveKey(password, salt);

      // Encrypt the data
      const encrypted = this.ALGORITHM.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return {
        data: encrypted.toString(),
        iv: iv.toString(),
        salt: salt.toString()
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  /**
   * Decrypts data using AES-256-CBC
   */
  static decrypt(encryptedData: EncryptedData, password: string): string {
    try {
      // Parse salt and IV
      const salt = CryptoJS.enc.Hex.parse(encryptedData.salt);
      const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);

      // Derive key from password
      const key = this.deriveKey(password, salt);

      // Decrypt the data
      const decrypted = this.ALGORITHM.decrypt(encryptedData.data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        throw new Error('Invalid password or corrupted data');
      }

      return decryptedString;
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  /**
   * Generates a secure hash of a password for verification
   */
  static hashPassword(password: string): string {
    const salt = CryptoJS.lib.WordArray.random(128 / 8);
    const hash = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: this.ITERATIONS,
      hasher: CryptoJS.algo.SHA256
    });

    return salt.toString() + ':' + hash.toString();
  }

  /**
   * Verifies a password against its hash
   */
  static verifyPassword(password: string, hash: string): boolean {
    try {
      const [saltStr, hashStr] = hash.split(':');
      const salt = CryptoJS.enc.Hex.parse(saltStr);

      const computedHash = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: this.ITERATIONS,
        hasher: CryptoJS.algo.SHA256
      });

      return computedHash.toString() === hashStr;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generates a random ID for journal entries
   */
  static generateId(): string {
    return CryptoJS.lib.WordArray.random(64 / 8).toString();
  }
}
