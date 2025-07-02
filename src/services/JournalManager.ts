import * as fs from 'fs-extra';
import * as path from 'path';
import { format, parseISO } from 'date-fns';
import { JournalEntry, JournalConfig, EncryptedData, BackupData } from '../types';
import { CryptoService } from './CryptoService';
import { AuthManager } from './AuthManager';

export class JournalManager {
  private entries: JournalEntry[] = [];
  private config: JournalConfig | null = null;
  private journalDir: string;
  private configFile: string;
  private entriesFile: string;

  constructor(authManager?: AuthManager) {
    const configDir = authManager?.getConfigDir() || path.join(require('os').homedir(), '.emotionctl');
    this.journalDir = configDir;
    this.configFile = path.join(this.journalDir, 'config.json');
    this.entriesFile = path.join(this.journalDir, 'entries.json');
  }  /**
   * Initializes the journal
   */
  async initialize(password: string): Promise<void> {
    try {
      await fs.ensureDir(this.journalDir);

      this.config = {
        version: '1.0.0',
        created: new Date(),
        lastModified: new Date(),
        entryCount: 0,
        encrypted: true
      };

      this.entries = [];

      await this.saveConfig();
      await this.saveEntries(password);
    } catch (error) {
      throw new Error(`Failed to initialize journal: ${error}`);
    }
  }

  /**
   * Loads the journal configuration and entries
   */
  async load(password: string): Promise<void> {
    try {
      // Load config
      if (await fs.pathExists(this.configFile)) {
        this.config = await fs.readJson(this.configFile);
      } else {
        throw new Error('Journal not found. Run "emotionctl init" first.');
      }      // Load entries
      if (await fs.pathExists(this.entriesFile)) {
        const encryptedData = await fs.readJson(this.entriesFile);
        if (encryptedData && encryptedData.data && encryptedData.iv && encryptedData.salt) {
          try {
            const decryptedData = CryptoService.decrypt(encryptedData, password);
            this.entries = JSON.parse(decryptedData);

            // Convert date strings back to Date objects
            this.entries = this.entries.map(entry => ({
              ...entry,
              date: new Date(entry.date)
            }));
          } catch (decryptError) {
            throw new Error(`Failed to decrypt entries. Please check your password. Details: ${decryptError}`);
          }
        } else {
          this.entries = [];
        }
      } else {
        this.entries = [];
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to decrypt entries')) {
        throw error;
      }
      throw new Error(`Failed to load journal: ${error}`);
    }
  }

  /**
   * Saves the journal configuration
   */
  private async saveConfig(): Promise<void> {
    if (!this.config) return;

    try {
      this.config.lastModified = new Date();
      this.config.entryCount = this.entries.length;
      await fs.writeJson(this.configFile, this.config, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }  /**
   * Saves the journal entries
   */
  private async saveEntries(password: string): Promise<void> {
    try {
      const entriesData = JSON.stringify(this.entries, null, 2);
      const encryptedData = CryptoService.encrypt(entriesData, password);
      await fs.writeJson(this.entriesFile, encryptedData, { spaces: 2 });

      await this.saveConfig();
    } catch (error) {
      throw new Error(`Failed to save entries: ${error}`);
    }
  }

  /**
   * Adds a new journal entry
   */
  async addEntry(title: string, content: string, password: string, mood?: string, tags?: string[]): Promise<JournalEntry> {
    try {
      const entry: JournalEntry = {
        id: CryptoService.generateId(),
        title,
        content,
        date: new Date(),
        mood,
        tags: tags || [],
        encrypted: true
      };

      this.entries.push(entry);
      await this.saveEntries(password);

      return entry;
    } catch (error) {
      throw new Error(`Failed to add entry: ${error}`);
    }
  }

  /**
   * Gets all journal entries
   */
  getEntries(): JournalEntry[] {
    return [...this.entries].sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Gets entries by date
   */
  getEntriesByDate(date: string): JournalEntry[] {
    const targetDate = parseISO(date);
    return this.entries.filter(entry =>
      format(entry.date, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd')
    );
  }

  /**
   * Searches entries by term
   */
  searchEntries(term: string): JournalEntry[] {
    const searchTerm = term.toLowerCase();
    return this.entries.filter(entry =>
      entry.title.toLowerCase().includes(searchTerm) ||
      entry.content.toLowerCase().includes(searchTerm) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Gets an entry by ID
   */
  getEntryById(id: string): JournalEntry | undefined {
    return this.entries.find(entry => entry.id === id);
  }

  /**
   * Deletes an entry by ID
   */
  async deleteEntry(id: string, password: string): Promise<boolean> {
    try {
      const index = this.entries.findIndex(entry => entry.id === id);
      if (index === -1) {
        return false;
      }

      this.entries.splice(index, 1);
      await this.saveEntries(password);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete entry: ${error}`);
    }
  }

  /**
   * Updates an entry
   */
  async updateEntry(id: string, updates: Partial<JournalEntry>, password: string): Promise<boolean> {
    try {
      const index = this.entries.findIndex(entry => entry.id === id);
      if (index === -1) {
        return false;
      }

      this.entries[index] = { ...this.entries[index], ...updates };
      await this.saveEntries(password);
      return true;
    } catch (error) {
      throw new Error(`Failed to update entry: ${error}`);
    }
  }

  /**
   * Creates a backup of the journal
   */
  async createBackup(password: string, outputPath?: string): Promise<string> {
    try {
      const backupData: BackupData = {
        config: this.config!,
        entries: this.entries,
        timestamp: new Date()
      };

      const backupJson = JSON.stringify(backupData, null, 2);
      const encryptedBackup = CryptoService.encrypt(backupJson, password);

      const fileName = `emotionctl-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
      const filePath = outputPath || path.join(this.journalDir, fileName);

      await fs.writeJson(filePath, encryptedBackup, { spaces: 2 });
      return filePath;
    } catch (error) {
      throw new Error(`Failed to create backup: ${error}`);
    }
  }

  /**
   * Restores journal from backup
   */
  async restoreFromBackup(backupPath: string, password: string): Promise<void> {
    try {
      const encryptedBackup = await fs.readJson(backupPath);
      const decryptedBackup = CryptoService.decrypt(encryptedBackup, password);
      const backupData: BackupData = JSON.parse(decryptedBackup);

      // Convert date strings back to Date objects
      this.config = {
        ...backupData.config,
        created: new Date(backupData.config.created),
        lastModified: new Date(backupData.config.lastModified)
      };

      this.entries = backupData.entries.map(entry => ({
        ...entry,
        date: new Date(entry.date)
      }));

      await this.saveConfig();
      await this.saveEntries(password);
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error}`);
    }
  }

  /**
   * Gets journal statistics
   */
  getStats(): { totalEntries: number; oldestEntry?: Date; newestEntry?: Date; avgWordsPerEntry: number } {
    if (this.entries.length === 0) {
      return { totalEntries: 0, avgWordsPerEntry: 0 };
    }

    const sortedEntries = this.entries.sort((a, b) => a.date.getTime() - b.date.getTime());
    const totalWords = this.entries.reduce((sum, entry) => sum + entry.content.split(/\s+/).length, 0);

    return {
      totalEntries: this.entries.length,
      oldestEntry: sortedEntries[0]?.date,
      newestEntry: sortedEntries[sortedEntries.length - 1]?.date,
      avgWordsPerEntry: Math.round(totalWords / this.entries.length)
    };
  }
}
