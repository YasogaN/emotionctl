export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: Date;
  mood?: string;
  tags?: string[];
  encrypted: boolean;
}

export interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
}

export interface JournalConfig {
  version: string;
  created: Date;
  lastModified: Date;
  entryCount: number;
  encrypted: boolean;
}

export interface ReadOptions {
  date?: string;
  list?: boolean;
  search?: string;
}

export interface CommandOptions {
  title?: string;
  output?: string;
  input?: string;
  id?: string;
  date?: string;
  list?: boolean;
  search?: string;
}

export interface BackupData {
  config: JournalConfig;
  entries: JournalEntry[];
  timestamp: Date;
}

export enum MoodType {
  HAPPY = '😊',
  SAD = '😢',
  ANGRY = '😠',
  EXCITED = '🤩',
  CALM = '😌',
  ANXIOUS = '😰',
  GRATEFUL = '🙏',
  NEUTRAL = '😐'
}
