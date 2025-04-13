import { SQLiteAdapter } from '../src/lib/keyvalue/sqlite-adapter';
import { KV, SQLITE } from '../src/lib/keyvalue';

describe('SQLiteAdapter', () => {
  let store: KV;

  beforeEach(async () => {
    store = new KV();
    await store.init(SQLITE, { filename: ':memory:' });
  });

  afterEach(async () => {
    await store.close();
  });

  describe('Basic Operations', () => {
    it('should set and get a value', async () => {
      await store.set('test-key', 'test-value');
      const value = await store.get('test-key');
      expect(value).toBe('test-value');
    });

    it('should return null for non-existent key', async () => {
      const value = await store.get('non-existent');
      expect(value).toBeNull();
    });

    it('should handle expiry', async () => {
      await store.set('test-key', 'test-value');
      await store.expire('test-key', 1);
      const value1 = await store.get('test-key');
      expect(value1).toBe('test-value');
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 1100));
      const value2 = await store.get('test-key');
      expect(value2).toBeNull();
    });
  });

  describe('List Operations', () => {
    it('should push and pop from list', async () => {
      await store.rpush('test-list', 'value1');
      await store.rpush('test-list', 'value2');
      const value = await store.lpop('test-list');
      expect(value).toBe('value1');
    });

    it('should handle multiple push operations', async () => {
      await store.lpush('test-list', 'value1', 'value2');
      await store.rpush('test-list', 'value3', 'value4');
      
      const first = await store.lpop('test-list');
      const last = await store.rpop('test-list');
      
      expect(first).toBe('value2');
      expect(last).toBe('value4');
    });

    it('should return null for empty list operations', async () => {
      expect(await store.lpop('empty-list')).toBeNull();
      expect(await store.rpop('empty-list')).toBeNull();
    });
  });

  describe('Hash Operations', () => {
    it('should set hash field', async () => {
      await store.hset('test-hash', 'field1', 'value1');
      // Set it again to verify it works
      await store.hset('test-hash', 'field1', 'value2');
    });

    it('should get hash field value', async () => {
      await store.hset('test-hash', 'field1', 'value1');
      const value = await store.hget('test-hash', 'field1');
      expect(value).toBe('value1');
    });

    it('should return null for non-existent hash field', async () => {
      const value = await store.hget('test-hash', 'non-existent');
      expect(value).toBeNull();
    });

    it('should return null for non-existent hash', async () => {
      const value = await store.hget('non-existent', 'field1');
      expect(value).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle disconnection gracefully', async () => {
      await store.close();
      await expect(store.set('test-key', 'value')).rejects.toThrow();
      await expect(store.get('test-key')).rejects.toThrow();
    });
  });
}); 