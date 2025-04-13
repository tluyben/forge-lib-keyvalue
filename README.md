# forge-lib-keyvalue

A Redis-compatible key-value store library with SQLite fallback support. This library provides a unified interface for working with both Redis and SQLite as key-value stores, making it easy to switch between them or use SQLite as a fallback when Redis is not available.

## Features

- Redis-compatible API
- SQLite fallback support
- Support for basic key-value operations
- List operations (LPUSH, RPUSH, LPOP, RPOP)
- Hash operations (HSET)
- Key expiration support

## Installation

```bash
npm install forge-lib-keyvalue
```

## Usage

### Basic Usage

```typescript
import { kv, REDIS, SQLITE } from "forge-lib-keyvalue";

// Initialize with Redis
const redisKV = await kv.init({
  type: REDIS,
  options: {
    host: "localhost",
    port: 6379,
  },
});

// Or initialize with SQLite
const sqliteKV = await kv.init({
  type: SQLITE,
  options: {
    filename: ":memory:", // Use in-memory SQLite database
  },
});

// Basic operations
await kv.set("mykey", "myvalue");
const value = await kv.get("mykey");

// List operations
await kv.lpush("mylist", "value1", "value2");
await kv.rpush("mylist", "value3");
const firstItem = await kv.lpop("mylist");
const lastItem = await kv.rpop("mylist");

// Hash operations
await kv.hset("myhash", "field1", "value1");

// Expiration
await kv.expire("mykey", 60); // Expire in 60 seconds
```

### Redis Cluster Support

```typescript
const clusterKV = await kv.init({
  type: REDIS,
  options: {
    nodes: [
      { host: "localhost", port: 6379 },
      { host: "localhost", port: 6380 },
    ],
    clusterOptions: {
      // Redis cluster options
    },
  },
});
```

## API Reference

### Key-Value Operations

- `get(key: string): Promise<string | null>`
- `set(key: string, value: string, expiryInSeconds?: number): Promise<void>`
- `expire(key: string, seconds: number): Promise<boolean>`

### List Operations

- `lpush(key: string, ...values: string[]): Promise<number>`
- `rpush(key: string, ...values: string[]): Promise<number>`
- `lpop(key: string): Promise<string | null>`
- `rpop(key: string): Promise<string | null>`

### Hash Operations

- `hset(key: string, field: string, value: string): Promise<void>`

## License

MIT
