const author = (parent, args, context) => {
  return context.prisma.post({ id: parent.id }).author();
};
const content = (parent, args, context) => {
  return context.prisma.post({ id: parent.id }).content();
};
const topics = () => [];
const publishedDate = parent => {
  if (parent.state === 'PUBLISHED') {
    return parent.publishedDate;
  }

  return null;
};

export default {
  author,
  content,
  topics,
  publishedDate
};
