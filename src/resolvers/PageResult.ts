const total = parent => parent.total;

export default {
  total,
  __resolveType(obj) {
    return obj.__typename;
  }
};
