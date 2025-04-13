import { kv, REDIS, SQLITE } from '../index';

async function redisExample() {
  // Redis standalone connection
  await kv.init(REDIS, {
    host: 'localhost',
    port: 6379,
    password: 'password',
    db: 0
  });

  // Basic operations
  await kv.set('mykey', 'myvalue', 60); // with expiry of 60 seconds
  const value = await kv.get('mykey');
  console.log('Value:', value);

  // List operations
  await kv.lpush('mylist', 'value1', 'value2');
  await kv.rpush('mylist', 'value3');
  const firstItem = await kv.lpop('mylist');
  const lastItem = await kv.rpop('mylist');
  console.log('First item:', firstItem);
  console.log('Last item:', lastItem);

  // Hash operations
  await kv.hset('myhash', 'field1', 'value1');

  // Clean up
  await kv.close();
}

async function redisSentinelExample() {
  // Redis Sentinel connection
  await kv.init(REDIS, {
    sentinels: [
      { host: 'sentinel-1', port: 26379 },
      { host: 'sentinel-2', port: 26379 }
    ],
    name: 'mymaster', // master group name
    password: 'password'
  });

  // Same operations as above
  await kv.set('mykey', 'myvalue');
  // ...

  await kv.close();
}

async function redisClusterExample() {
  // Redis Cluster connection
  await kv.init(REDIS, {
    nodes: [
      { host: 'node-1', port: 6379 },
      { host: 'node-2', port: 6379 },
      { host: 'node-3', port: 6379 }
    ],
    clusterOptions: {
      // Additional cluster options
      redisOptions: {
        password: 'password'
      }
    }
  });

  // Same operations as above
  await kv.set('mykey', 'myvalue');
  // ...

  await kv.close();
}

async function sqliteExample() {
  // SQLite connection - with same API
  await kv.init(SQLITE, {
    filename: ':memory:' // In-memory database for this example
  });

  // Same operations as Redis example
  await kv.set('mykey', 'myvalue', 60);
  const value = await kv.get('mykey');
  console.log('Value:', value);

  // List operations
  await kv.lpush('mylist', 'value1', 'value2');
  await kv.rpush('mylist', 'value3');
  const firstItem = await kv.lpop('mylist');
  const lastItem = await kv.rpop('mylist');
  console.log('First item:', firstItem);
  console.log('Last item:', lastItem);

  // Hash operations
  await kv.hset('myhash', 'field1', 'value1');

  // Clean up
  await kv.close();
}

// Run the examples
async function main() {
  try {
    console.log('--- Redis Example ---');
    await redisExample();
    
    console.log('\n--- Redis Sentinel Example ---');
    await redisSentinelExample();
    
    console.log('\n--- Redis Cluster Example ---');
    await redisClusterExample();
    
    console.log('\n--- SQLite Example ---');
    await sqliteExample();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();