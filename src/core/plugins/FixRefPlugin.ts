import Factory from '@/core/Factory';
import OasDocument from '@/core/libs/OasDocument';
import OasVisitor from '@/core/OasVisitor';
import Plugin from '@/core/Plugin';
import { injectable } from 'inversify';
import { OasNodePath, OasSchema } from 'oai-ts-core';

@injectable()
class FixRefPlugin extends OasVisitor implements Plugin {
  public name: string = 'FixRefPlugin';
  public refs: Set<string> = new Set();

  public apply(factory: Factory) {
    factory.hooks.createDocument.tap(this.name, this.handleCreateDocument.bind(this));
  }

  public handleCreateDocument(document: OasDocument) {
    document.visit(this);

    const refs = new Set(Array.from(this.refs.values()));

    refs.forEach(ref => {
      if (!/#\//.test(ref)) {
        return;
      }
      if (document.resolve(new OasNodePath(ref.substr(1)))) {
        return;
      }

      const segments = ref.substr(2).split('/');

      if (segments.length !== 2) {
        return;
      }
      switch (segments.shift()) {
        case 'definitions':
          const definitionSchemaName = segments.pop() || '';
          const definitionSchema = document.definitions.createSchemaDefinition(definitionSchemaName);

          definitionSchema.type = 'any';
          document.definitions.addDefinition(definitionSchemaName, definitionSchema);
          break;
        case 'response':
          const responseName = segments.pop() || '';
          const response = document.responses.createResponse(responseName);

          document.responses.addResponse(responseName, response);
          break;
        case 'parameters':
          const parameterName = segments.pop() || '';
          const parameter = document.parameters.createParameter(parameterName);

          document.parameters.addParameter(parameterName, parameter);
          break;
        default:
          break;
      }
    });
  }

  // visitors

  public visitSchema(schema: OasSchema) {
    if (schema.$ref) {
      this.refs.add(schema.$ref);
    }
  }

  public visitPropertySchema(schema: OasSchema) {
    this.visitSchema(schema);
  }

  public visitSchemaDefinition(schema: OasSchema) {
    this.visitSchema(schema);
  }

  public visitAllOfSchema(schema: OasSchema) {
    this.visitSchema(schema);
  }

  public visitItemsSchema(schema: OasSchema) {
    this.visitSchema(schema);
  }

  public visitAdditionalPropertiesSchema(schema: OasSchema) {
    this.visitSchema(schema);
  }
}

export default FixRefPlugin;
