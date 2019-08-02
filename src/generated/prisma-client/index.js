"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_lib_1 = require("prisma-client-lib");
var typeDefs = require("./prisma-schema").typeDefs;

var models = [
  {
    name: "User",
    embedded: false
  },
  {
    name: "Role",
    embedded: false
  },
  {
    name: "Profile",
    embedded: false
  },
  {
    name: "Topic",
    embedded: false
  },
  {
    name: "PostState",
    embedded: false
  },
  {
    name: "Post",
    embedded: false
  },
  {
    name: "PostContent",
    embedded: false
  },
  {
    name: "Vote",
    embedded: false
  },
  {
    name: "Comment",
    embedded: false
  }
];
exports.Prisma = prisma_lib_1.makePrismaClientClass({
  typeDefs,
  models,
  endpoint: `http://localhost:4468`
});
exports.prisma = new exports.Prisma();
