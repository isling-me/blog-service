const posts = (parent, args, context) => {
  return context.prisma.topic({ id: parent.id }).posts();
};

export default {
  posts
};
