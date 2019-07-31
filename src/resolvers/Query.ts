import { AuthenticationError, ForbiddenError } from 'apollo-server-errors';
import { Logger } from '../utils';

const logger = new Logger('Query');

function me(parent, args, context) {
  if (!context.user.auth) {
    logger.debug('[me] Unauthorized');
    throw new AuthenticationError('unauthorized');
  }

  const userId = context.user.id;

  logger.debug(`[me] User id ${userId}`);

  return context.prisma.user({ id: userId });
}

function user(parent, args, context) {
  const { username } = args;

  return context.prisma.user({ username });
}

//   const where = args.filter ? {
//     OR: [
//       {
//         description_contains: args.filter,
//       },
//       {
//         url_contains: args.filter,
//       },
//     ],
//   } : {};
async function posts(_parent, args, context) {
  const page = args.page || {};
  const { orderBy } = args;
  const where = {
    state: 'PUBLISHED'
  };

  const posts = await context.prisma.posts({
    where,
    ...page,
    orderBy
  });

  const total = await context.prisma
    .postsConnection({ where })
    .aggregate()
    .count();

  return {
    items: posts,
    total
  };
}

async function post(_parent, args, context) {
  const post = await context.prisma.post({
    id: args.id
  });

  if (post.state !== 'PUBLISHED') {
    throw new ForbiddenError('resource_not_found');
  }

  return post;
}

async function ownPost(_parent, args, context) {
  const post = await context.prisma.post({
    id: args.id
  });

  return post;
}

async function topics(_parent, args, context) {
  const where = args.filter
    ? {
        name_contains: args.filter
      }
    : {};
  const page = args.page || {};
  const orderBy = args.orderBy;

  const items = await context.prisma.topics({
    where,
    ...page,
    orderBy
  });

  const total = await context.prisma
    .topicsConnection({
      where
    })
    .aggregate()
    .count();

  return {
    items,
    total
  };
}

async function topic(parent, args, context) {
  const { slug, id } = args;

  if (!slug && !id) {
    logger.debug('[topic] Missing slug and id when get topic information');
    throw new ForbiddenError('validation_failed');
  }

  return context.prisma.topic({ id, slug });
}

async function popularPosts(parent, args, context) {
  const total = await context.prisma
    .postsConnection({ where: { state: 'PUBLISHED' } })
    .aggregate()
    .count();

  const max = total - args.first > 0 ? total - args.first : 0;
  const randomSkip = Math.floor(Math.random() * max);

  return context.prisma.posts({
    where: {
      state: 'PUBLISHED'
    },
    orderBy: randomSkip % 2 === 0 ? 'publishedDate_DESC' : 'updatedAt_DESC',
    first: args.first,
    skip: randomSkip
  });
}

export default {
  me,
  user,
  posts,
  post,
  ownPost,
  topics,
  topic,
  popularPosts
};
