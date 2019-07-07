const author = (parent, args, context) => {
  return context.prisma.post({ id: parent.id }).author();
};
const content = (parent, args, context) => {
  return context.prisma.post({ id: parent.id }).content();
};
const topic = (parent, args, context) => {
  return context.prisma.post({ id: parent.id }).topic();
};
const publishedDate = parent => {
  if (parent.state === 'PUBLISHED') {
    return parent.publishedDate;
  }

  return null;
};

export default {
  author,
  content,
  topic,
  publishedDate
};
