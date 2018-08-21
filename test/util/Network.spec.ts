import Network from '@/util/Network';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const network = new Network();
const mock = new MockAdapter(axios);

beforeAll(() => {
  mock.onGet('test.json').reply(200, '{"name": "json"}');
  mock.onGet('test.yaml').reply(200, 'name: yaml');
});

afterAll(() => {
  mock.restore();
});

test('should download json file', async () => {
  const { name } = await network.downloadJSON('test.json');

  expect(name).toBe('json');
});

test('should download yaml file', async () => {
  const { name } = await network.downloadYAML('test.yaml');

  expect(name).toBe('yaml');
});

afterAll(() => {
  mock.restore();
});
