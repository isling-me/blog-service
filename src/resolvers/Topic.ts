const posts = async (parent, args, context) => {
  const { first, skip } = args.page;
  const { orderBy } = args;
  const where = {
    state: 'PUBLISHED'
  };

  const itemsPromise = context.prisma.topic({ id: parent.id }).posts({
    where,
    first,
    skip,
    orderBy
  });

  const totalPromise = context.prisma
    .postsConnection({
      where: {
        topic: { id: parent.id },
        state: 'PUBLISHED'
      }
    })
    .aggregate()
    .count();

  const [items, total] = await Promise.all([itemsPromise, totalPromise]);

  return {
    items,
    total
  };
};

export default {
  posts
};
