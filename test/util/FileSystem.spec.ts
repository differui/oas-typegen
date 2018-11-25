import FileSystem from '@/util/FileSystem';
import * as mock from 'mock-fs';

const fileSystem = new FileSystem();

beforeAll(() => {
  mock({
    'test.json': '{"name":"json"}',
    'test.yaml': 'name: yaml',
  });
});

test('should read file', async () => {
  const document = await fileSystem.readFile('test.json');

  expect(document).toBe('{"name":"json"}');
});

test('should read json file', async () => {
  const { name } = await fileSystem.readJson('test.json');

  expect(name).toBe('json');
});

test('should read yaml file', async () => {
  const { name } = await fileSystem.readYaml('test.yaml');

  expect(name).toBe('yaml');
});

afterAll(() => {
  mock.restore();
});
