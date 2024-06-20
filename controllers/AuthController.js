import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const hash = require('sha1');
const { v4: uuidv4 } = require('uuid');

const AuthController = {
  getConnect: async (req, res) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const [, authCredentail] = authHeader.split(' ');
    const decodedAuthCredentail = Buffer.from(authCredentail, 'base64').toString('utf-8');
    const [email, password] = decodedAuthCredentail.split(':');

    // check is user exist in the database
    const collection = await dbClient.client.db().collection('users');
    const user = await collection.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Unathorized' });
    }

    if (user.password !== hash(password)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // create a token and save the user's id in the redis client
    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id, 86400);
    return res.status(200).json({ token });
  },

  getDisconnect: async (req, res) => {
    /**
     * get the user token from the request header
     * retrieve the user id from the redis server using the token key
     * delete the key from redis store if user is found
     * if no user return the appropriate response
     */

    const token = req.get('X-Token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unnauthorized' });
    }

    await redisClient.del(key);
    return res.status(204).json();
  },
};

export default AuthController;
