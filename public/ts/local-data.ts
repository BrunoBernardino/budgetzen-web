import { KeyPair } from '/lib/types.ts';

type StorageKey = 'session';
export interface StoredSession {
  sessionId: string;
  userId: string;
  email: string;
  keyPair: KeyPair;
  otherSessions?: Omit<StoredSession, 'otherSessions'>[];
}

export default class LocalData {
  static readonly LOCAL_STORAGE_KEY = 'budgetzen_v0';
  // If localStorage isn't available, use in-memory
  private static storage?: Storage | Map<StorageKey, string>;

  private static initialize() {
    if (!this.storage) {
      try {
        this.storage = window.localStorage;
        this.storage.setItem(`${this.LOCAL_STORAGE_KEY}:test`, 'testing');
        this.storage.removeItem(`${this.LOCAL_STORAGE_KEY}:test`);
      } catch (_error) {
        this.storage = new Map();
      }
    }
  }

  static get<T = StorageKey, R = StoredSession>(key: T): R | null {
    this.initialize();

    let stringifiedValue: string | null = '';

    if (this.storage instanceof Storage) {
      stringifiedValue = this.storage.getItem(`${this.LOCAL_STORAGE_KEY}:${key}`);
    } else {
      stringifiedValue = this.storage!.get(key as StorageKey) || null;
    }

    const value = stringifiedValue ? JSON.parse(stringifiedValue) : null;

    return value as R;
  }

  static set<T = StorageKey, R = StoredSession>(key: T, value: R | null): void {
    this.initialize();

    if (value === null) {
      if (this.storage instanceof Storage) {
        this.storage.removeItem(`${this.LOCAL_STORAGE_KEY}:${key}`);
      } else {
        this.storage!.delete(key as StorageKey);
      }

      return;
    }

    const stringifiedValue = JSON.stringify(value);

    if (this.storage instanceof Storage) {
      this.storage.setItem(`${this.LOCAL_STORAGE_KEY}:${key}`, stringifiedValue);
    } else {
      this.storage!.set(key as StorageKey, stringifiedValue);
    }
  }

  static clear() {
    this.initialize();

    if (this.storage instanceof Storage) {
      this.storage.clear();
    } else {
      this.storage!.clear();
    }
  }
}
