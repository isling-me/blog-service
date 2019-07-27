import { Storage } from '@google-cloud/storage';
import { Logger } from '../utils';
import uuid = require('uuid');

const storage = new Storage();
const bucketName = process.env.BUCKET;
const islingBucket = storage.bucket(bucketName);

const logger = new Logger('fileUploadMutation');
const uploadDir = 'posts/preview';
const googlePublicLink = 'https://storage.googleapis.com';

const storeUpload = async ({ stream, filename }): Promise<any> => {
  const id: string = uuid.v4();
  const path = `${uploadDir}/${id}-${filename}`;
  const file = islingBucket.file(path);

  return new Promise((resolve, reject) => {
    logger.debug('Start uploading file to Bucket');
    stream
      .pipe(file.createWriteStream())
      .on('finish', () => {
        file.makePublic(err => {
          if (err) {
            reject(err);
            return;
          }

          const publicLink = `${googlePublicLink}/${bucketName}/${path}`;
          resolve({ id, path: publicLink });
        });
      })
      .on('error', reject);
  });
};

const processUpload = async upload => {
  const { createReadStream, filename, mimetype, encoding } = await upload;
  logger.debug(`[singleUpload] Starting upload file ${filename}`);
  const stream = createReadStream();
  const { id, path } = await storeUpload({ stream, filename });
  logger.info(
    `[singleUpload] Upload file ${filename} completed. Path ${path}.`
  );
  return {
    id,
    filename,
    mimetype,
    encoding,
    path
  };
};

export const singleUpload = (obj, { file }) => processUpload(file);
