import Redis from 'ioredis';
import { KeyValueAdapter } from './index';

export interface RedisOptions {
  host?: string;
  port?: number;
  password?: string;
  nodes?: { host: string; port: number }[];
  clusterOptions?: any;
}

export class RedisAdapter implements KeyValueAdapter {
  private client: Redis;

  constructor(options: RedisOptions = {}) {
    if (options.nodes) {
      this.client = new Redis.Cluster(options.nodes, options.clusterOptions) as unknown as Redis;
    } else {
      this.client = new Redis({
        host: options.host || 'localhost',
        port: options.port || 6379,
        password: options.password,
      });
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, expiryInSeconds?: number): Promise<void> {
    if (expiryInSeconds !== undefined) {
      await this.client.set(key, value, 'EX', expiryInSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.client.lpush(key, ...values);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    return this.client.rpush(key, ...values);
  }

  async lpop(key: string): Promise<string | null> {
    return this.client.lpop(key);
  }

  async rpop(key: string): Promise<string | null> {
    return this.client.rpop(key);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds);
    return result === 1;
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}