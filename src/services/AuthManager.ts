import * as fs from 'fs-extra';
import * as path from 'path';
import { homedir } from 'os';
import { CryptoService } from './CryptoService';

export class AuthManager {
  private static readonly CONFIG_DIR = path.join(homedir(), '.emotionctl');
  private static readonly AUTH_FILE = path.join(this.CONFIG_DIR, 'auth.json');

  private passwordHash: string | null = null;

  constructor() {
    this.ensureConfigDir();
  }

  /**
   * Ensures the configuration directory exists
   */
  private async ensureConfigDir(): Promise<void> {
    try {
      await fs.ensureDir(AuthManager.CONFIG_DIR);
    } catch (error) {
      throw new Error(`Failed to create config directory: ${error}`);
    }
  }

  /**
   * Checks if the journal is already initialized
   */
  async isInitialized(): Promise<boolean> {
    try {
      return await fs.pathExists(AuthManager.AUTH_FILE);
    } catch (error) {
      return false;
    }
  }

  /**
   * Initializes the journal with a password
   */
  async initialize(password: string): Promise<void> {
    if (await this.isInitialized()) {
      throw new Error('Journal is already initialized');
    }

    try {
      this.passwordHash = CryptoService.hashPassword(password);

      const authData = {
        passwordHash: this.passwordHash,
        created: new Date().toISOString(),
        version: '1.0.0'
      };

      await fs.writeJson(AuthManager.AUTH_FILE, authData, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to initialize authentication: ${error}`);
    }
  }

  /**
   * Authenticates with the provided password
   */
  async authenticate(password: string): Promise<boolean> {
    try {
      if (!await this.isInitialized()) {
        throw new Error('Journal is not initialized. Run "emotionctl init" first.');
      }

      const authData = await fs.readJson(AuthManager.AUTH_FILE);
      const isValid = CryptoService.verifyPassword(password, authData.passwordHash);

      if (isValid) {
        this.passwordHash = authData.passwordHash;
      }

      return isValid;
    } catch (error) {
      throw new Error(`Authentication failed: ${error}`);
    }
  }

  /**
   * Changes the password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!await this.authenticate(currentPassword)) {
      throw new Error('Current password is incorrect');
    }

    try {
      const authData = await fs.readJson(AuthManager.AUTH_FILE);
      authData.passwordHash = CryptoService.hashPassword(newPassword);
      authData.lastModified = new Date().toISOString();

      await fs.writeJson(AuthManager.AUTH_FILE, authData, { spaces: 2 });
      this.passwordHash = authData.passwordHash;
    } catch (error) {
      throw new Error(`Failed to change password: ${error}`);
    }
  }

  /**
   * Gets the configuration directory path
   */
  getConfigDir(): string {
    return AuthManager.CONFIG_DIR;
  }

  /**
   * Checks if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.passwordHash !== null;
  }

  /**
   * Clears authentication state
   */
  logout(): void {
    this.passwordHash = null;
  }
}
