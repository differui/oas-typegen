import Generator, { GeneratorOptions } from '@/core/Generator';
import JsDocUtils from '@/core/libs/JsDocUtils';
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
class JsGenerator extends Generator {
  @inject(identifier.JsonSchemaUtils) private jsonSchemaUtils: JsonSchemaUtils;
  @inject(identifier.JsDocUtils) private jsDocUtils: JsDocUtils;

  public async generate(fragments: Array<SupportedFragment>, options: GeneratorOptions) {
    const sortSchema = (a: JSONSchema4, b: JSONSchema4) => {
      if (a.title && b.title) {
        if (a.title === b.title) {
          return 0;
        }
        if (a.title > b.title) {
          return 1;
        }
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

    const [
      definitionTypeDefs,
      operationTypeDefs,
    ] = await Promise.all([
      this.generateTypeDef(definitionSchemas),
      this.generateTypeDef([
        ...operationRequestSchemas,
        ...operationResponseSchemas,
      ].sort(sortSchema)),
    ]);

    return [
      this.generateDispatch(options),
      definitionTypeDefs,
      operationTypeDefs,
      '\n',
      `void 'A DELIMITER LINE DISTINGUISH TYPE-DEFS AND API DEFINITIONS'`,
      this.generateOperations(operationRequestFragments, options),
    ].join('\n');
  }

  private generateDispatch(options: GeneratorOptions) {
    if (options.format === 'es') {
      return `import ${options.helperName} from '${options.helper}'`;
    }
    return `const ${options.helperName} = require('${options.helper}')`;
  }

  private async generateTypeDef(schemas: Array<JSONSchema4>) {
    const options: Partial<Options> = {
      bannerComment: '',
      declareExternallyReferenced: false,
      unreachableDefinitions: false,
    };
    const trees = await Promise.all(schemas.map(schema => this.jsonSchemaUtils.parse(schema, schema.title || '', options)));

    return trees.map(tree => this.jsDocUtils.generate(tree, options)).join('\n');
  }

  private generateOperations(fragments: Array<OperationRequestFragment>, options: GeneratorOptions) {
    return fragments.map(fragment => {
      const requestGuard = fragment.parameters.length ? fragment.title : '';
      const responseGuard = fragment.responseSuccessCodes.length ? fragment.title.replace(/Request$/, 'Response') : 'void';
      const tags: Array<string> = [];

      if (requestGuard) {
        tags.push(`@param {${requestGuard}} request`);
      }
      if (fragment.deprecated) {
        tags.push('@deprecated');
      }
      tags.push(`@returns {Promise<${responseGuard}>}`);

      return `
        /**
         * ${fragment.introduction}
         *
         * \`${fragment.method} ${fragment.path}\`
         *
         ${tags.map(tag => `* ${tag}`).join('\n')}
         */
        export function ${fragment.id}(${requestGuard ? 'request' : ''}) {
          return ${options.helperName}(${JSON.stringify(fragment.method)}, ${JSON.stringify(fragment.path)}, ${requestGuard ? 'request' : ''});
        }`;
    }).filter(Boolean).join('\n');
  }
}

export default JsGenerator;
