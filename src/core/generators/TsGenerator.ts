import Generator, { GeneratorOptions } from '@/core/Generator';
import JsonSchemaUtils from '@/core/libs/JsonSchemaUtils';
import DefinitionFragment from '@/core/oas-fragments/DefinitionFragment';
import OperationRequestFragment from '@/core/oas-fragments/OperationRequestFragment';
import OperationResponseFragment from '@/core/oas-fragments/OperationResponseFragment';
import { FragmentType } from '@/core/OasFragment';
import * as identifier from '@/identifier';
import { inject, injectable } from 'inversify';
import { JSONSchema4 } from 'json-schema';
import { Options } from 'json-schema-to-typescript';

type SupportedFragment = DefinitionFragment|OperationRequestFragment|OperationResponseFragment;

@injectable()
class TsGenerator extends Generator {
  @inject(identifier.JsonSchemaUtils) private jsonSchemaUtils: JsonSchemaUtils;

  public async generate(fragments: Array<SupportedFragment>, options: GeneratorOptions) {
    const sortSchema = (a: JSONSchema4, b: JSONSchema4) => {
      if (a.title && b.title) {
        if (a.title === b.title) { return 0; }
        if (a.title > b.title) { return 1; }
        return -1;
      } else {
        return 0;
      }
    };
    const striveSteam = (fragment: SupportedFragment) => fragment.schema;
    const definitionFragments = fragments.filter(fragment => fragment.type === FragmentType.Definition) as Array<DefinitionFragment>;
    const operationRequestFragments = fragments.filter(fragment => fragment.type === FragmentType.OperationRequest) as Array<OperationRequestFragment>;
    const operationResponseFragments  = fragments.filter(fragment => fragment.type === FragmentType.OperationResponse && (fragment as OperationResponseFragment).responseSuccessCodes.length) as Array<OperationResponseFragment>;

    const definitionSchemas = definitionFragments.map(striveSteam);
    const operationRequestSchemas = operationRequestFragments.filter(fragment => fragment.parameters.length).map(striveSteam);
    const operationResponseSchemas = operationResponseFragments.map(striveSteam);

    // console.log(JSON.stringify(operationRequestSchemas, undefined, 2));

    const definitionInterfaces = await this.generateInterfaces(definitionSchemas);
    const operationInterfaces = await this.generateInterfaces([
      ...operationRequestSchemas,
      ...operationResponseSchemas,
    ].sort(sortSchema));

    return [
      this.generateDispatch(),
      '',
      definitionInterfaces,
      operationInterfaces,
      this.generateOperations(operationRequestFragments),
    ].join('\n');
  }

  private generateDispatch() {
    return `import dispatchRequest from './dispatchRequest'`;
  }

  private async generateInterfaces(schemas: Array<JSONSchema4>) {
    const options: Partial<Options> = {
      bannerComment: '',
      declareExternallyReferenced: false,
      unreachableDefinitions: false,
      $refOptions: {
        dereference: {
          circular: false,
        },
      },
    };
    const trees = await Promise.all(schemas.map(schema => this.jsonSchemaUtils.parse(schema, schema.title || '', options)));

    return trees.map(tree => this.jsonSchemaUtils.generate(tree, options)).join('\n');
  }

  private generateOperations(fragments: Array<OperationRequestFragment>) {
    return fragments.map(fragment => {
      const requestGuard = fragment.parameters.length ? `request: ${fragment.title}` : '';
      const responseGuard = fragment.responseSuccessCodes.length ? fragment.title.replace(/Request$/, 'Response') : 'void';

      return `
        /**
         * ${fragment.deprecated ? '\`DEPRECATED\` ' : ''}${fragment.introduction}
         *
         * \`${fragment.method} ${fragment.path}\`
         */
        export function ${fragment.id}(${requestGuard}): Promise<${responseGuard}> {
          return dispatchRequest(${JSON.stringify(fragment.path)}, ${requestGuard ? 'request' : ''});
        }`;
    }).filter(Boolean).join('\n');
  }
}

export default TsGenerator;
