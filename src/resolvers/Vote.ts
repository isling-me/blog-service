const id = parent => parent.id;
const user = (parent, args, context) => {
  return context.prisma.vote({ id: parent.id }).user();
};
const post = (parent, args, context) => {
  return context.prisma.vote({ id: parent.id }).post();
};

export default {
  id,
  user,
  post
};
