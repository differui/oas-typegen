import ParameterUtils from '@/core/libs/ParameterUtils';
import OperationFragment from '@/core/oas-fragments/OperationFragment';
import { FragmentType } from '@/core/OasFragment';
import * as identifier from '@/identifier';
import { inject, injectable } from 'inversify';
import { JSONSchema4 } from 'json-schema';

@injectable()
class OperationRequestFragment extends OperationFragment {
  public type = FragmentType.OperationRequest;

  @inject(identifier.ParameterUtils) private parameterUtils: ParameterUtils;

  public get responseStatusCodes() {
    return this.document.responses.responseStatusCodes() || [];
  }

  public get schema() {
    const { parameters } = this.modal;
    const { definitions } = this.ownerModal;

    if (parameters && parameters.length) {
      const properties = this.parameterUtils.transform(parameters);

      if (properties.query) {
        properties.params = properties.query;
        delete properties.query;
      }
      if (properties.body) {
        properties.data = properties.body;
        delete properties.body;
      }
      return {
        type: 'object',
        title: this.title,
        properties,
        required: Object.keys(properties),
        additionalProperties: false,
        definitions,
      } as JSONSchema4;
    }
    return {
      type: 'null',
      title: this.title,
    } as JSONSchema4;
  }
}

export default OperationRequestFragment;
