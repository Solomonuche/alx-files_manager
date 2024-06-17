import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const AppController = {
  getStatus: (req, res) => {
    if (redisClient.isAlive() && dbClient.isAlive()) {
      return res.status(200).json({ redis: true, db: true });
    }
    return null;
  },

  getStats: async (req, res) => {
    const nbUsers = await dbClient.nbUsers();
    const nbFiles = await dbClient.nbFiles();
    return res.status(200).json({ users: nbUsers, files: nbFiles });
  },
};

export default AppController;
