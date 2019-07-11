function me(parent, args, context) {
  if (!context.user.auth) {
    return null;
  }

  const userId = context.user.id;

  return context.prisma.user({ id: userId });
}

function user(parent, args, context) {
  if (!context.user.auth) {
    return null;
  }

  const userId = args.id;

  return context.prisma.user({ id: userId });
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
    return null;
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
  return context.prisma.topic({ id: args.id });
}

export default {
  me,
  user,
  posts,
  post,
  ownPost,
  topics,
  topic
};
