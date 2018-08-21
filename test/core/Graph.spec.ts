import Factory from '@/core/Factory';
import * as identifier from '@/identifier';
import container from '@/inversify.config';
import FileSystem from '@/util/FileSystem';

const factory = container.get<Factory>(identifier.Factory);
const fileSystem = container.get<FileSystem>(identifier.FileSystem);

test('basic', async () => {
  const document = await fileSystem.readJSON('test/fixtures/pet-store.json');

  await factory.build(document as any);

  for (const [operationId, operation] of factory.operations) {
    const {
      request,
      response,
    } = operation.generate();

    fileSystem.writeFile(`test/${operationId}.ts`, `${request}\n${response}`);
  }
});
