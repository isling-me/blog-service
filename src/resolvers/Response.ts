const message = parent => parent.message;
const status = parent => parent.status;

export default {
  message,
  status,
  __resolveType(obj) {
    return obj.__typename;
  }
};
