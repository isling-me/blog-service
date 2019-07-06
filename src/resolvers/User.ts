const profile = (parent, args, context) =>
  context.prisma.user({ id: parent.id }).profile();

const posts = async (parent, args, context) => {
  const page = args.page || {};
  const { orderBy } = args;
  const where = {
    state: 'PUBLISHED'
  };

  const posts = await context.prisma.user({ id: parent.id }).posts({
    where,
    ...page,
    orderBy
  });

  const total = await context.prisma
    .postsConnection({
      where: {
        ...where,
        author: { id: parent.id }
      }
    })
    .aggregate()
    .count();

  return {
    items: posts,
    total
  };
};

export default {
  profile,
  posts
};
