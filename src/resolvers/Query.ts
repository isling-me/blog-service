const me = (parent, args, context) => {
  if (!context.user.auth) {
    return null;
  }

  const userId = context.user.id;

  return context.prisma.user({ id: userId });
};

const user = (parent, args, context) => {
  if (!context.user.auth) {
    return null;
  }

  const userId = args.id;

  return context.prisma.user({ id: userId });
};

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

export default {
  me,
  user,
  posts,
  post
};
