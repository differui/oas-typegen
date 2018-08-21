import Queue from '@/util/Queue';

test('should works', () => {
  const queue = new Queue<number>();

  queue.enqueue(1);
  queue.enqueue(2);
  queue.enqueue(3);
  expect(queue.dequeue()).toBe(1);
  expect(queue.dequeue()).toBe(2);
  expect(queue.dequeue()).toBe(3);
});

test('should throw overflow error', () => {
  const queue = new Queue<number>();

  expect(() => {
    for (let i = 0; i < 101; i += 1) {
      queue.enqueue(i);
    }
  }).toThrowError('overflow');
});

test('should throw empty error', () => {
  const queue = new Queue<number>();

  expect(() => {
    queue.dequeue();
  }).toThrowError('empty');
});
