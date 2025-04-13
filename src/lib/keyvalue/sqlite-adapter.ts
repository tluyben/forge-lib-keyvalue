import Database from 'better-sqlite3';
import { KeyValueAdapter } from './index';

interface SQLiteRow {
  value: string;
  min_pos?: number;
  max_pos?: number;
  count?: number;
}

export class SQLiteAdapter implements KeyValueAdapter {
  private db: Database.Database;
  private expiryCheckInterval: NodeJS.Timeout | null = null;
  private statements!: {
    get: Database.Statement;
    set: Database.Statement;
    expire: Database.Statement;
    cleanup: Database.Statement;
    getMinPos: Database.Statement;
    getMaxPos: Database.Statement;
    insertListItem: Database.Statement;
    getListItemCount: Database.Statement;
    getListItem: Database.Statement;
    deleteListItem: Database.Statement;
    hset: Database.Statement;
    delete: Database.Statement;
  };

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    this.initializeDatabase();
    this.prepareStatements();
  }

  private initializeDatabase(): void {
    // Create tables if they don't exist
    
    // Key-value store
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT,
        expiry INTEGER DEFAULT NULL
      )
    `);

    // List store
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS list_store (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        position INTEGER NOT NULL,
        UNIQUE(key, position)
      )
    `);

    // Hash store
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS hash_store (
        key TEXT NOT NULL,
        field TEXT NOT NULL,
        value TEXT,
        PRIMARY KEY (key, field)
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_list_store_key ON list_store(key);
      CREATE INDEX IF NOT EXISTS idx_kv_store_expiry ON kv_store(expiry);
    `);

    // Start the expiry checker
    this.startExpiryChecker();
  }

  private prepareStatements(): void {
    // Basic operations
    this.statements = {
      get: this.db.prepare('SELECT value FROM kv_store WHERE key = ? AND (expiry IS NULL OR expiry > unixepoch())'),
      set: this.db.prepare('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)'),
      expire: this.db.prepare('UPDATE kv_store SET expiry = unixepoch() + ? WHERE key = ?'),
      cleanup: this.db.prepare('DELETE FROM kv_store WHERE expiry IS NOT NULL AND expiry <= unixepoch()'),
      getMinPos: this.db.prepare('SELECT MIN(position) as min_pos FROM list_store WHERE key = ?'),
      getMaxPos: this.db.prepare('SELECT MAX(position) as max_pos FROM list_store WHERE key = ?'),
      insertListItem: this.db.prepare('INSERT INTO list_store (key, value, position) VALUES (?, ?, ?)'),
      getListItemCount: this.db.prepare('SELECT COUNT(*) as count FROM list_store WHERE key = ?'),
      getListItem: this.db.prepare('SELECT value FROM list_store WHERE key = ? ORDER BY position ASC LIMIT 1'),
      deleteListItem: this.db.prepare('DELETE FROM list_store WHERE key = ? AND position = ?'),
      hset: this.db.prepare('INSERT OR REPLACE INTO hash_store (key, field, value) VALUES (?, ?, ?)'),
      delete: this.db.prepare('DELETE FROM kv_store WHERE key = ?'),
    };
  }

  private startExpiryChecker(): void {
    // Check for expired keys every 60 seconds
    this.expiryCheckInterval = setInterval(() => {
      try {
        this.statements.cleanup.run();
      } catch (error) {
        console.error('Error cleaning expired keys:', error);
      }
    }, 60000);
  }

  async get(key: string): Promise<string | null> {
    const row = this.statements.get.get(key) as SQLiteRow | undefined;
    return row ? row.value : null;
  }

  async set(key: string, value: string, expiryInSeconds?: number): Promise<void> {
    const expiry = expiryInSeconds ? Math.floor(Date.now() / 1000) + expiryInSeconds : null;
    this.statements.set.run(key, value, expiry);
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    const minPosRow = this.statements.getMinPos.get(key) as SQLiteRow | undefined;
    let nextPos = (minPosRow?.min_pos ?? 0) - 1;

    for (const value of values) {
      this.statements.insertListItem.run(key, value, nextPos);
      nextPos--;
    }

    const countRow = this.statements.getListItemCount.get(key) as SQLiteRow | undefined;
    return countRow?.count ?? 0;
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    const maxPosRow = this.statements.getMaxPos.get(key) as SQLiteRow | undefined;
    let nextPos = (maxPosRow?.max_pos ?? 0) + 1;

    for (const value of values) {
      this.statements.insertListItem.run(key, value, nextPos);
      nextPos++;
    }

    const countRow = this.statements.getListItemCount.get(key) as SQLiteRow | undefined;
    return countRow?.count ?? 0;
  }

  async lpop(key: string): Promise<string | null> {
    const minPosRow = this.statements.getMinPos.get(key) as SQLiteRow | undefined;
    const itemRow = this.statements.getListItem.get(key) as SQLiteRow | undefined;

    if (!itemRow) return null;

    if (minPosRow && minPosRow.min_pos !== null) {
      this.statements.deleteListItem.run(key, minPosRow.min_pos);
    }

    return itemRow.value;
  }

  async rpop(key: string): Promise<string | null> {
    const maxPosRow = this.statements.getMaxPos.get(key) as SQLiteRow | undefined;
    const itemRow = this.statements.getListItem.get(key) as SQLiteRow | undefined;

    if (!itemRow) return null;

    if (maxPosRow && maxPosRow.max_pos !== null) {
      this.statements.deleteListItem.run(key, maxPosRow.max_pos);
    }

    return itemRow.value;
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    this.statements.hset.run(key, field, value);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const result = this.statements.expire.run(key, seconds);
    return result.changes > 0;
  }

  async close(): Promise<void> {
    if (this.expiryCheckInterval) {
      clearInterval(this.expiryCheckInterval);
      this.expiryCheckInterval = null;
    }
    
    this.db.close();
  }
}