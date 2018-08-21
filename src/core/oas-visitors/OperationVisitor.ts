import OperationRequestFragment from '@/core/oas-fragments/OperationRequestFragment';
import OperationResponseFragment from '@/core/oas-fragments/OperationResponseFragment';
import OasVisitor from '@/core/OasVisitor';
import * as identifier from '@/identifier';
import container from '@/inversify.config';
import { inject, injectable } from 'inversify';
import { Oas20Operation } from 'oai-ts-core';

@injectable()
class OperationVisitor extends OasVisitor {
  @inject(identifier.OasFragmentMap) public request: Map<string, OperationRequestFragment>;
  @inject(identifier.OasFragmentMap) public response: Map<string, OperationResponseFragment>;

  public visitOperation(operationDocument: Oas20Operation) {
    const request = container.get<OperationRequestFragment>(identifier.OperationRequestFragment);
    const response = container.get<OperationResponseFragment>(identifier.OperationResponseFragment);

    request.create(operationDocument);
    response.create(operationDocument);
    this.request.set(request.title, request);
    this.response.set(response.title, response);
  }
}

export default OperationVisitor;
