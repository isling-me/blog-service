import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AuthenticationError, ForbiddenError } from 'apollo-server-errors';
import { singleUpload } from './fileUploadMutation';

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

  const { username } = args;

  const usernameExist = await context.prisma.$exists.user({
    username
  });

  if (usernameExist) {
    logger.debug(`[signup] Username ${username} has been taken`);
    throw new ForbiddenError('username_has_been_taken');
  }

  const password = await bcrypt.hash(args.password, 10);

  const user = await context.prisma.createUser({
    email: args.email,
    password,
    username,
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

const updateProfile = async (parent, args, context) => {
  if (!context.user.auth) {
    logger.debug('[updateProfile] require login');
    throw new AuthenticationError('unauthorized');
  }

  const { id } = context.user;
  const { username, name, intro, avatar } = args;

  logger.debug(
    `[updateProfile] Update profile username ${username}, name ${name}, avatar ${avatar}, intro ${intro}`
  );

  if (typeof username === 'string') {
    const usernameExist = await context.prisma.$exists.user({
      username
    });
    if (usernameExist) {
      logger.debug('[updateProfile] username has been taken');
      throw new ForbiddenError('user_name_has_been_taken');
    }
  }

  return context.prisma.updateUser({
    where: { id },
    data: {
      username,
      profile: {
        update: {
          name,
          intro,
          avatar
        }
      }
    }
  });
};

interface ConnectInterface {
  connect: {
    id: string;
  };
}

function createPost(_parent, args, context) {
  if (!context.user.auth) {
    logger.debug('[createPost] require login');
    throw new AuthenticationError('unauthorized');
  }

  const userId = context.user.id;
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
  if (!context.user.auth) {
    logger.debug('[updatePost] require login');
    throw new AuthenticationError('unauthorized');
  }

  const userId = context.user.id;
  const postId = args.id;
  logger.info(`[updatePost] Update post ${postId}`);

  const post = await context.prisma.post({ id: postId });

  if (!post) {
    throw new ForbiddenError('resource_not_found');
  }

  const author = await context.prisma.post({ id: postId }).author();

  if (!author || author.id !== userId) {
    throw new AuthenticationError('unauthorized');
  }

  const { title, description, content, state, topic, preview } = args.data;
  let { publishedDate } = args.data;
  logger.debug(
    `[updatePost] Input: title: ${title} | description: ${description} | state: ${state} | topic: ${topic} | preview: ${preview} | publishedDate: ${publishedDate}`
  );

  const topicConnect: ConnectInterface | {} = topic
    ? { connect: { id: topic } }
    : {};

  if (typeof state === 'string') {
    if (state === 'PUBLISHED') {
      logger.debug(
        `[updatePost] New published date; ${publishedDate}. Current published date: ${
          post.publishedDate
        }`
      );
      if (typeof publishedDate !== 'undefined') {
        if (new Date(publishedDate).getTime() < Date.now()) {
          publishedDate = new Date().toISOString();
        }
      } else if (!post.publishedDate) {
        publishedDate = new Date().toISOString();
      }
    } else {
      publishedDate = null;
    }
  }

  const data = {
    title: trimAllowUndefined(title),
    slug: slugifyLower(title),
    description: trimAllowUndefined(description),
    state,
    content: {},
    publishedDate,
    topic: topicConnect,
    preview
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

async function deletePost(parent, args, context) {
  if (!context.user.auth) {
    logger.debug('[deletePost] require login');
    throw new AuthenticationError('unauthorized');
  }

  const { id } = args;
  const userId = context.user.id;
  logger.info(`[deletePost] Delete post ${id}`);

  const post = await context.prisma.post({ id });

  if (!post) {
    throw new ForbiddenError('resource_not_found');
  }

  const author = await context.prisma.post({ id }).author();

  if (!author || author.id !== userId) {
    throw new AuthenticationError('unauthorized');
  }

  await context.prisma.deletePost({ id });

  return {
    status: 'SUCCESS',
    message: 'deleted successfully'
  };
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
  updatePost,
  deletePost,
  singleUpload,
  updateProfile
  // upvote,
  // downvote,
};
