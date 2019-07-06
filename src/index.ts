import { GraphQLServer } from 'graphql-yoga';
import { prisma } from './generated/prisma-client';
import resolvers from './resolvers';
import { getCurrentUser, Logger } from './utils';

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context: request => {
    return {
      ...request,
      prisma,
      user: getCurrentUser(request)
    };
  }
});

const logger = new Logger('index');

server.start(() => logger.info('Server is running on http://localhost:4000'));
