import { GraphQLServer } from 'graphql-yoga';
import cors = require('cors');
import { Prisma } from './generated/prisma-client';
import resolvers from './resolvers';
import { getCurrentUser, Logger, getHTTPuri } from './utils';
import fileUploadAPI from './modules/FileUpload/fileUploadAPI';

const logger = new Logger('index');

const start = () => {
  const server = new GraphQLServer({
    typeDefs: './src/schema.graphql',
    resolvers,
    context: request => {
      return {
        ...request,
        prisma: new Prisma({
          endpoint: getHTTPuri(process.env.PRISMA_PORT)
        }),
        user: getCurrentUser(request)
      };
    }
  });

  server.express.use(cors());
  fileUploadAPI(server.express);

  server.start(
    {
      port: process.env.PORT || 4000,
      uploads: {
        maxFileSize: 10000000,
        maxFiles: 10
      }
    },
    () => logger.info(`Server is running on port ${process.env.PORT || 4000}`)
  );
};

const checkPrismaEndpoint = async () => {
  if (!process.env.PRISMA_PORT) {
    return false;
  }
  return true;
};

const waitUntil = checkCondition => async task => {
  const runTask = async (taskId?) => {
    const isRunnable = await checkCondition();
    if (!isRunnable) {
      logger.info('Server can not start right now. Try start after 5 seconds.');
    } else {
      task();
      if (taskId) {
        clearInterval(taskId);
        return false;
      } else {
        return true;
      }
    }
  };

  const success = await runTask();

  if (!success) {
    const taskId = setInterval(async () => {
      await runTask(taskId);
    }, 5000);
  }
};

waitUntil(checkPrismaEndpoint)(start);
