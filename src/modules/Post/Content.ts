export interface ContentInterface {
  text: string;
  id: string;
}

export class Content implements ContentInterface {
  id: string;
  text: string;

  constructor(id: string, text: string) {
    this.id = id;
    this.text = text;
  }
}
