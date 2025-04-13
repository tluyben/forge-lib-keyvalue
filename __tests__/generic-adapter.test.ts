import { SQLiteAdapter } from '../src/lib/keyvalue/sqlite-adapter';
import { KV, SQLITE } from '../src/lib/keyvalue';

describe('Generic Adapter Interface', () => {
  let store: KV;
  let adapter: SQLiteAdapter;

  beforeEach(async () => {
    store = new KV();
    await store.init(SQLITE, { filename: ':memory:' });
  });

  afterEach(async () => {
    await store.close();
  });

  describe('Basic Operations', () => {
    it('should handle string values', async () => {
      await store.set('string-key', 'string-value');
      expect(await store.get('string-key')).toBe('string-value');
    });

    it('should handle numeric values', async () => {
      await store.set('number-key', '123');
      expect(await store.get('number-key')).toBe('123');
    });

    it('should handle special characters in keys', async () => {
      const specialKey = 'special!@#$%^&*()_+-=[]{}|;:,.<>?';
      await store.set(specialKey, 'value');
      expect(await store.get(specialKey)).toBe('value');
    });

    it('should handle empty values', async () => {
      await store.set('empty-key', '');
      expect(await store.get('empty-key')).toBe('');
    });
  });

  describe('List Operations', () => {
    it('should handle list operations in sequence', async () => {
      await store.rpush('test-list', 'value1');
      await store.rpush('test-list', 'value2');
      await store.rpush('test-list', 'value3');
      expect(await store.lpop('test-list')).toBe('value1');
      expect(await store.rpop('test-list')).toBe('value3');
    });

    it('should handle empty list operations', async () => {
      expect(await store.lpop('empty-list')).toBeNull();
      expect(await store.rpop('empty-list')).toBeNull();
    });
  });

  describe('Hash Operations', () => {
    it('should handle hash operations', async () => {
      await store.hset('test-hash', 'field1', 'value1');
      await store.hset('test-hash', 'field2', 'value2');
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