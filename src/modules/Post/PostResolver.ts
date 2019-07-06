export default class PostResolver {
  author(parent, _args, context) {
    return context.prisma.post({ id: parent.id }).author();
  }

  content(parent, args, context) {
    return context.prisma.post({ id: parent.id }).content();
  }

  topics() {
    return [];
  }

  publishedDate(parent) {
    if (parent.state === 'PUBLISHED') {
      return parent.publishedDate;
    }

    return null;
  }
}
