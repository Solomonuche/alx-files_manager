import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => {
      console.log(`Connection to redis server failed: ${err}`);
    });
    this.client.connect();
  }

  isAlive() {
    try {
      this.client.ping();
      return true;
    } catch (error) {
      // console.log('server is DEAD' + error);
      return false;
    }
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value;
    } catch (error) {
      return null;
    }
  }

  async set(key, value, duration) {
    try {
      await this.client.set(key, value, { EX: duration });
    } catch (error) {
      console.log(`error setting ${error}`);
    }
  }

  async del(key) {
    await this.client.del(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;