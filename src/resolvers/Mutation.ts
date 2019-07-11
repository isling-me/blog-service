import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AuthenticationError, ForbiddenError } from 'apollo-server-errors';

import {
  APP_SECRET,
  Logger,
  AuthPayloadInterface,
  jwtOptions,
  trimAllowUndefined,
  slugifyLower
} from '../utils';

const logger = new Logger('Mutation');

const signup = async (_parent, args, context) => {
  const userExist = await context.prisma.$exists.user({
    email: args.email
  });

  if (userExist) {
    logger.debug(`[signup] Email ${args.email} has been taken`);
    throw new ForbiddenError('email_has_been_taken');
  }

  const password = await bcrypt.hash(args.password, 10);

  const user = await context.prisma.createUser({
    email: args.email,
    password,
    profile: {
      create: {
        name: args.name
      }
    }
  });

  logger.debug(`[signup] Created user ${args.email} successfully`);

  const payload: AuthPayloadInterface = {
    sub: user.id,
    role: user.role
  };

  const token = jwt.sign(payload, APP_SECRET, jwtOptions);

  return {
    token,
    user
  };
};

const login = async (_parent, args, context) => {
  const user = await context.prisma.user({ email: args.email });

  if (!user) {
    logger.debug(`[login] Email ${args.email} is not register`);
    throw new AuthenticationError('authentication_failed');
  }

  const valid = await bcrypt.compare(args.password, user.password);

  if (!valid) {
    logger.debug(`[login] Password not match with account ${args.email}`);
    throw new AuthenticationError('authentication_failed');
  }

  const payload: AuthPayloadInterface = {
    sub: user.id,
    role: user.role
  };

  const token = jwt.sign(payload, APP_SECRET, jwtOptions);

  logger.debug(`[login] Login success with account ${args.email}`);

  return {
    token,
    user
  };
};

interface ConnectInterface {
  connect: {
    id: string;
  };
}

function createPost(_parent, args, context) {
  // if (!context.user.auth) {
  //   logger.debug('[createPost] require login');
  //   throw new AuthenticationError('unauthorized');
  // }

  const userId = 'cjxixiks8opkf0b12guntdpvd' || context.user.id;
  const { title, description, content, state, topic } = args.data;
  let { publishedDate } = args.data;

  const topicConnect: ConnectInterface | {} = topic
    ? { connect: { id: topic } }
    : {};

  if (!state || state === 'PUBLISHED') {
    if (!publishedDate || new Date(publishedDate).getTime() < Date.now()) {
      publishedDate = new Date().toISOString();
    }
  }

  return context.prisma.createPost({
    title: trimAllowUndefined(title),
    slug: slugifyLower(title) || 'untitled',
    description: trimAllowUndefined(description),
    content: {
      create: {
        text: content.text
      }
    },
    state,
    publishedDate,
    author: { connect: { id: userId } },
    topic: topicConnect
  });
}

async function updatePost(_parent, args, context) {
  // if (!context.user.auth) {
  //   logger.debug('[createPost] require login');
  //   throw new AuthenticationError('unauthorized');
  // }

  const userId = 'cjxixiks8opkf0b12guntdpvd' || context.user.id;
  const postId = args.id;

  const post = await context.prisma.post({ id: postId });

  if (!post) {
    throw new ForbiddenError('resource_not_found');
  }

  const author = await context.prisma.post({ id: postId }).author();

  if (!author || author.id !== userId) {
    throw new AuthenticationError('unauthorized');
  }

  const { title, description, content, state, topic } = args.data;
  let { publishedDate } = args.data;

  const topicConnect: ConnectInterface | {} = topic
    ? { connect: { id: topic } }
    : {};

  if (state === 'PUBLISHED') {
    if (publishedDate) {
      if (new Date(publishedDate).getTime() < Date.now()) {
        publishedDate = new Date().toISOString();
      }
    } else if (!post.publishedDate) {
      publishedDate = new Date().toISOString();
    }
  } else if (publishedDate) {
    publishedDate = undefined;
  }

  const data = {
    title: trimAllowUndefined(title),
    slug: slugifyLower(title) || 'untitled',
    description: trimAllowUndefined(description),
    state,
    content: {},
    publishedDate,
    topic: topicConnect
  };

  if (content) {
    data.content = {
      update: {
        text: content.text
      }
    };
  }

  return context.prisma.updatePost({
    where: { id: postId },
    data
  });
}

// const deleteLink = async (parent, args, context) => {
//   if (!context.user.login) {
//     logger.info('[deleteLink] Error: not login');
//     throw new AuthenticationError('unauthorized');
//   }
//
//   const userId = context.user.id;
//   const owner = await context.prisma.link({ id: args.id }).postedBy();
//
//   if (!owner || userId !== owner.id) {
//     logger.info('[deleteLink] Error: do not have permission');
//     throw new AuthenticationError('unauthorized');
//   }
//
//   await context.prisma.deleteLink({ id: args.id });
//
//   return {
//     message: 'delete_success',
//     status: 'SUCCESS',
//   };
// };
//
// const upvote = async (parent, args, context) => {
//   if (!context.user.login) {
//     logger.info('[upvote] Require login');
//     throw new AuthenticationError('unauthorized');
//   }
//
//   const userId = context.user.id;
//
//   const voteExists = await context.prisma.$exists.vote({
//     user: { id: userId },
//     link: { id: args.linkId },
//   });
//
//   if (voteExists) {
//     logger.info('[upvote] You has been vote this link');
//     throw new ForbiddenError('resource_has_been_taken');
//   }
//
//   return context.prisma.createVote({
//     link: { connect: { id: args.linkId } },
//     user: { connect: { id: userId } },
//   });
// };
//
// const downvote = async (parent, args, context) => {
//   if (!context.user.login) {
//     logger.info('[downvote] Require login');
//     throw new AuthenticationError('unauthorized');
//   }
//
//   const userId = context.user.id;
//
//   const voteExists = await context.prisma.votes({
//     where: {
//       user: { id: userId },
//       link: { id: args.linkId },
//     }
//   });
//
//   if (voteExists.length === 0) {
//     logger.info(`[downvote] You do not vote link ${args.linkId} before`);
//     throw new ForbiddenError('resource_does_not_exist');
//   }
//
//   await context.prisma.deleteVote({
//     id: voteExists[0].id,
//   });
//
//   return {
//     message: 'delete_success',
//     status: 'SUCCESS',
//   };
// };

export default {
  signup,
  login,
  createPost,
  updatePost
  // deleteLink,
  // upvote,
  // downvote,
};
