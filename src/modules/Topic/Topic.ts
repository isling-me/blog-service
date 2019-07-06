import { PostInterface } from '../Post/Post';

export interface TopicInterface {
  id: string;
  name: string;
}

export class Topic implements TopicInterface {
  name: string;
  id: string;
  posts: PostInterface[];

  constructor(name: string, id: string) {
    this.name = name;
    this.id = id;
  }
}
