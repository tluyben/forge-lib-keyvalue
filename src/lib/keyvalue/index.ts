import Redis from 'ioredis';
import Database from 'better-sqlite3';
import { RedisAdapter } from './redis-adapter';
import { SQLiteAdapter } from './sqlite-adapter';

// Backend types
export enum BackendType {
  REDIS = 'redis',
  SQLITE = 'sqlite'
}

// Connection configuration types
export type RedisConnectionOptions = {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  // Sentinel specific options
  sentinels?: Array<{ host: string; port: number }>;
  name?: string; // Sentinel master name
  // Cluster specific options
  nodes?: Array<{ host: string; port: number }>;
  clusterOptions?: any;
}

export type SQLiteConnectionOptions = {
  filename: string;
  options?: any;
}

export type ConnectionOptions = RedisConnectionOptions | SQLiteConnectionOptions;

// KV Adapter interface
export interface KVAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, expiryInSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  expire(key: string, seconds: number): Promise<boolean>;
  lpush(key: string, ...values: string[]): Promise<number>;
  rpush(key: string, ...values: string[]): Promise<number>;
  lpop(key: string): Promise<string | null>;
  rpop(key: string): Promise<string | null>;
  hset(key: string, field: string, value: string): Promise<void>;
  close(): Promise<void>;
}

export interface KeyValueAdapter extends KVAdapter {}

// Main KV class
export class KV {
  private adapter: KeyValueAdapter | null = null;

  /**
   * Initialize the KV store with the specified backend
   */
  async init(type: string, options: any): Promise<void> {
    switch (type) {
      case REDIS:
        this.adapter = new RedisAdapter(options);
        break;
      case SQLITE:
        this.adapter = new SQLiteAdapter(options.filename);
        break;
      default:
        throw new Error(`Unsupported backend type: ${type}`);
    }
  }

  /**
   * Get a value by key
   */
  async get(key: string): Promise<string | null> {
    this.ensureAdapter();
    return this.adapter!.get(key);
  }

  /**
   * Set a key to hold a string value
   */
  async set(key: string, value: string, expiryInSeconds?: number): Promise<void> {
    this.ensureAdapter();
    return this.adapter!.set(key, value, expiryInSeconds);
  }

  /**
   * Insert values at the head of a list
   */
  async lpush(key: string, ...values: string[]): Promise<number> {
    this.ensureAdapter();
    return this.adapter!.lpush(key, ...values);
  }

  /**
   * Insert values at the tail of a list
   */
  async rpush(key: string, ...values: string[]): Promise<number> {
    this.ensureAdapter();
    return this.adapter!.rpush(key, ...values);
  }

  /**
   * Remove and get the first element in a list
   */
  async lpop(key: string): Promise<string | null> {
    this.ensureAdapter();
    return this.adapter!.lpop(key);
  }

  /**
   * Remove and get the last element in a list
   */
  async rpop(key: string): Promise<string | null> {
    this.ensureAdapter();
    return this.adapter!.rpop(key);
  }

  /**
   * Set field in the hash stored at key to value
   */
  async hset(key: string, field: string, value: string): Promise<void> {
    this.ensureAdapter();
    return this.adapter!.hset(key, field, value);
  }

  /**
   * Set a key's time to live in seconds
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    this.ensureAdapter();
    return this.adapter!.expire(key, seconds);
  }

  /**
   * Close the connection to the database
   */
  async close(): Promise<void> {
    if (this.adapter) {
      await this.adapter.close();
      this.adapter = null;
    }
  }

  async del(key: string): Promise<void> {
    await this.ensureAdapter();
    await this.adapter!.del(key);
  }

  private ensureAdapter(): void {
    if (!this.adapter) {
      throw new Error('KV adapter not initialized. Call init() first.');
    }
  }
}

// Export a singleton instance
export const kv = new KV();

// Export backend types
export const REDIS = BackendType.REDIS;
export const SQLITE = BackendType.SQLITE;