import JSDocument from '@/core/libs/JsDocument';
import * as identifier from '@/identifier';
import container from '@/inversify.config';

const jsDocument = container.get<JSDocument>(identifier.JSDocument);

test('basic', () => {
  // pass
});
