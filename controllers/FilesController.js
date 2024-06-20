import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const FilesController = {
  postUpload: async (req, res) => {
    // Retrieve the user based on the token
    const token = req.get('X-Token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unnauthorized' });
    }

    const userCollection = dbClient.client.db().collection('users');
    const user = await userCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // extract attribute from a the request body
    const { name } = req.body;
    const { type } = req.body;
    const { parentId = '0' } = req.body;
    const { isPublic } = req.body;
    let { data } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (type === 'file' || type === 'image') {
      data = Buffer.from(data, 'base64').toString('utf-8');
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== '0') {
      const collection = await dbClient.client.db().collection('files');
      const existingFile = await collection.findOne({ parentId });

      if (!existingFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (existingFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    // create a file
    const file = {
      name,
      type,
      parentId: parentId === '0' ? '0' : new ObjectId(parentId),
      isPublic,
      data,
    };
    // Depening on the type  of file save it to the database
    const fileCollection = await dbClient.client.db().collection('files');

    if (type === 'folder') {
      file.userId = user._id;
      await fileCollection.insertOne(file);
      return res.status(201).json({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    }
    let folderName = process.env.FOLDER_PATH;
    if (!folderName) {
      folderName = '/tmp/files_manager';
    }

    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName, { recursive: true });
    }

    const document = uuidv4();
    const filePath = `${folderName}/${document}`;
    fs.writeFileSync(filePath, data);

    file.userId = user._id;
    file.localPath = filePath;
    await fileCollection.insertOne(file);
    return res.status(201).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
      localPath: file.localPath,
    });
  },
};

export default FilesController;
