import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const hash = require('sha1');

const UsersController = {
  postNew: async (req, res) => {
    const { email } = req.body;
    const { password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const collection = dbClient.client.db().collection('users');
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const hashedPassword = hash(password);

    const result = await collection.insertOne({ email, password: hashedPassword });

    return res.status(201).json({ id: result.insertedId, email });
  },
  getMe: async (req, res) => {
    const token = req.get('X-Token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    const collection = dbClient.client.db().collection('users');
    const user = await collection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.json({ id: user._id, email: user.email });
  },
};

export default UsersController;
