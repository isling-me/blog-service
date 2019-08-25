import multer = require('multer');
import { Storage } from '@google-cloud/storage';
import { Logger } from '../../utils';
import uuid = require('uuid');

const memStorage = multer.memoryStorage();
const upload = multer({ storage: memStorage });

const storage = new Storage();
const bucketName = process.env.BUCKET;
const islingBucket = storage.bucket(bucketName);

const logger = new Logger('fileUploadMutation');
const uploadDir = 'images/max';
const googlePublicLink = 'https://storage.googleapis.com';

const storeUpload = async ({ fileContent, filename }): Promise<any> => {
  const id: string = uuid.v4();

  const path = `${uploadDir}/${id}.${filename.split('.').pop()}`;
  const file = islingBucket.file(path);

  return new Promise((resolve, reject) => {
    logger.debug('[multiUpload] Start uploading file to Bucket');
    file
      .createWriteStream()
      .on('finish', () => {
        file.makePublic(err => {
          if (err) {
            reject(err);
            return;
          }

          const publicLink = `${googlePublicLink}/${bucketName}/${path}`;
          resolve({ id, url: publicLink, bucketName, path });
        });
      })
      .on('error', reject)
      .end(fileContent);
  });
};

const processUpload = async ({ fileContent, filename, mimetype, encoding }) => {
  logger.debug(`[multiUpload] Starting upload file ${filename}`);
  const { id, url, bucketName, path } = await storeUpload({
    fileContent,
    filename
  });
  logger.info(`[multiUpload] Upload file ${filename} completed. Url ${url}.`);
  return {
    id,
    filename,
    mimetype,
    encoding,
    url,
    delete_url: `/posts/images?bucket=${bucketName}&path=${path}`,
    delete_type: 'delete',
    type: mimetype,
    name: filename
  };
};

const deleteFile = (deleteBucketName, name) => {
  logger.info(`[deleteFile] Bucket: ${deleteBucketName}, name: ${name}`);

  const bucket = storage.bucket(deleteBucketName);
  const file = bucket.file(name);

  return file.delete();
};

const store = async (req, res) => {
  logger.info('[store] Start');
  const { files } = req;
  const tasks = [];

  files.forEach(file => {
    const {
      encoding,
      mimetype,
      originalname: filename,
      buffer: fileContent
    } = file;
    tasks.push(processUpload({ fileContent, filename, mimetype, encoding }));
  });

  try {
    const uploadFiles = await Promise.all(tasks);

    res.status(200).json({
      files: uploadFiles
    });
  } catch (e) {
    logger.debug(`[store] Error: ${JSON.stringify(e)}`);
    res.status(500).json({
      message: 'Something wrong'
    });
  }
};

const deleteHandle = async (req, res) => {
  logger.info(`[deleteHandel] Start`);
  const { bucket, name } = req.query;

  try {
    await deleteFile(bucket, name);

    res.status(200).json({
      status: 'SUCCESS'
    });
  } catch (e) {
    logger.debug(`[deleteHandle] Error: ${JSON.stringify(e)}`);

    res.status(500).json({
      message: 'Something wrong'
    });
  }
};

export default app => {
  app.post('/posts/images', upload.any(), store);
  app.delete('/posts/images', deleteHandle);
};
