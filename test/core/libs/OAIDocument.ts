import OasDocument from '@/core/libs/OasDocument';
import * as identifier from '@/identifier';
import container from '@/inversify.config';

const OasDocument = container.get<OasDocument>(identifier.OasDocument);

test('basic', () => {
  // pass
});
