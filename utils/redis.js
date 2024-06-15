import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.connected = true;
    this.client.on('error', (err) => {
      this.connected = false;
      console.log(`Connection to redis server failed: ${err}`);
    });
  }

  isAlive() {
    return this.connected;
  }

  async get(key) {
    try {
      const asyncGet = promisify(this.client.get).bind(this.client);
      const value = await asyncGet(key);
      return value;
    } catch (error) {
      return null;
    }
  }

  async set(key, value, duration) {
    try {
      const asyncSet = promisify(this.client.setex).bind(this.client);
      await asyncSet(key, duration, value);
    } catch (error) {
      // console.log(`error setting ${error}`);
    }
  }

  async del(key) {
    const asyncDel = promisify(this.client.del).bind(this.client);
    await asyncDel(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
