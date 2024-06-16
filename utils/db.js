import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.url = `mongodb://${this.host}:${this.port}/${this.database}`;

    this.client = new MongoClient(this.url, { useUnifiedTopology: true });

    this.connected = false;
    this.client.connect((err) => {
      if (err) {
        this.connected = false;
      } else {
        this.connected = true;
      }
    });
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    try {
      const db = this.client.db();
      const collection = db.collection('users');
      const count = collection.countDocuments();
      return count;
    } catch (err) {
      console.error('Error counting users:', err);
      return 0;
    }
  }

  async nbFiles() {
    try {
      const db = this.client.db(this.database);
      const collection = db.collection('files');
      const count = collection.countDocuments();
      return count;
    } catch (err) {
      console.error('Error counting files:', err);
      return 0;
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
