import { injectable } from 'inversify';

@injectable()
class Queue<T> {
  public static readonly MAX_LENGTH = 100;

  private items: Array<T> = [];

  public get length() {
    return this.items.length;
  }

  public dequeue(): T {
    if (this.length === 0) {
      throw new Error('empty');
    }
    return this.items.shift() as T;
  }

  public enqueue(item: T) {
    if (this.length >= Queue.MAX_LENGTH) {
      throw new Error('overflow');
    }
    this.items.push(item);
  }
}

export default Queue;
