import dbClient from '../utils/db';

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
};

export default UsersController;
