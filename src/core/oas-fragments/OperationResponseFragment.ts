import OperationFragment from '@/core/oas-fragments/OperationFragment';
import { FragmentType } from '@/core/OasFragment';
import * as identifier from '@/identifier';
import { inject, injectable } from 'inversify';
import { JSONSchema4 } from 'json-schema';
import { Oas20Response } from 'oai-ts-core';

@injectable()
class OperationResponseFragment extends OperationFragment {
  public type = FragmentType.OperationResponse;

  @inject(identifier.OasDocument) private oasDocument;

  public get title() {
    return `${this.document.operationId}Response`;
  }

  public get schema() {
    const { definitions = {} } = this.ownerModal;
    const responseCode = this.document.responses.responseStatusCodes().map(code => parseInt(code, 10)).find(code => code >= 200 && code <= 299);
    const responseSchema = responseCode
      ? this.oasDocument.write((this.document.responses.response(String(responseCode)) as Oas20Response)).schema
      : undefined;

    if (responseSchema) {
      return {
        title: this.title,
        ...responseSchema,
        definitions,
      } as JSONSchema4;
    }
    return {
      type: 'null',
      title: this.title,
    } as JSONSchema4;
  }
}

export default OperationResponseFragment;
