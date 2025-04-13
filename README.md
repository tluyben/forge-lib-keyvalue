# forge-lib-keyvalue

A Redis-compatible key-value store library with SQLite fallback support. This library provides a unified interface for working with both Redis and SQLite as key-value stores, making it easy to switch between them or use SQLite as a fallback when Redis is not available.

## Features

- Redis-compatible API
- SQLite fallback support
- Support for basic key-value operations
- List operations (LPUSH, RPUSH, LPOP, RPOP)
- Hash operations (HSET, HGET)
- Key expiration support
- Key deletion support

## Installation

```bash
npm install forge-lib-keyvalue
```

## Usage

### Basic Usage

```typescript
import { KV, REDIS, SQLITE } from "forge-lib-keyvalue";

// Create a new KV instance
const kv = new KV();

// Initialize with Redis
await kv.init(REDIS, {
  host: "localhost",
  port: 6379,
});

// Or initialize with SQLite
await kv.init(SQLITE, {
  filename: ":memory:", // Use in-memory SQLite database
});

// Basic operations
await kv.set("mykey", "myvalue");
const value = await kv.get("mykey");
await kv.del("mykey");

// List operations
await kv.lpush("mylist", "value1", "value2");
await kv.rpush("mylist", "value3");
const firstItem = await kv.lpop("mylist");
const lastItem = await kv.rpop("mylist");

// Hash operations
await kv.hset("myhash", "field1", "value1");
const fieldValue = await kv.hget("myhash", "field1");

// Expiration
await kv.expire("mykey", 60); // Expire in 60 seconds

// Close the connection when done
await kv.close();
```

### Redis Cluster Support

```typescript
const kv = new KV();
await kv.init(REDIS, {
  nodes: [
    { host: "localhost", port: 6379 },
    { host: "localhost", port: 6380 },
  ],
  clusterOptions: {
    // Redis cluster options
  },
});
```

## API Reference

### Key-Value Operations

- `get(key: string): Promise<string | null>` - Get a value by key
- `set(key: string, value: string, expiryInSeconds?: number): Promise<void>` - Set a key to hold a string value
- `del(key: string): Promise<void>` - Delete a key
- `expire(key: string, seconds: number): Promise<boolean>` - Set a key's time to live in seconds

### List Operations

- `lpush(key: string, ...values: string[]): Promise<number>` - Insert values at the head of a list
- `rpush(key: string, ...values: string[]): Promise<number>` - Insert values at the tail of a list
- `lpop(key: string): Promise<string | null>` - Remove and get the first element in a list
- `rpop(key: string): Promise<string | null>` - Remove and get the last element in a list

### Hash Operations

- `hset(key: string, field: string, value: string): Promise<void>` - Set field in the hash stored at key to value
- `hget(key: string, field: string): Promise<string | null>` - Get a field value from a hash

## Testing

The library includes comprehensive tests for both SQLite and Redis adapters. To run the tests:

```bash
# Run all tests
npm test

# Run only SQLite tests
npm test -- __tests__/sqlite-adapter.test.ts

# Run only Redis tests (requires Redis server)
npm test -- __tests__/redis-adapter.test.ts
```

## License

MIT
