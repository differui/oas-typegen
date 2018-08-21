import { injectable } from 'inversify';
import { JSONSchema4 } from 'json-schema';
import { convertParametersToJSONSchema } from 'openapi-jsonschema-parameters';
import { OpenAPI } from 'openapi-types';

@injectable()
class ParameterUtils {
  public transform(parameters: OpenAPI.Parameters) {
    return convertParametersToJSONSchema(parameters) as Hash<JSONSchema4>;
  }
}

export default ParameterUtils;
