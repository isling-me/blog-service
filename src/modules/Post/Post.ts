import { Content, ContentInterface } from './Content';
import { Topic, TopicInterface } from '../Topic/Topic';

export interface PostInterface {
  id: string;
  title: string;
}

export class Post implements PostInterface {
  id: string;
  title: string;
  description?: string;
  content: Content;
  createdAt: Date;
  topics: Topic[];

  constructor(
    id: string,
    title: string,
    content: ContentInterface,
    createdAt: string,
    topics: TopicInterface[],
    description?: string
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.content = new Content(content.id, content.text);
    this.createdAt = new Date(createdAt);
    this.topics = topics.map(t => new Topic(t.name, t.id));
  }
}
