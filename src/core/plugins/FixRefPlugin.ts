import Factory from '@/core/Factory';
import OasDocument from '@/core/libs/OasDocument';
import OasVisitor from '@/core/OasVisitor';
import Plugin from '@/core/Plugin';
import { injectable } from 'inversify';
import { OasNodePath, OasSchema } from 'oai-ts-core';

@injectable()
class FixRefPlugin extends OasVisitor implements Plugin {
  public name: string = 'FixRefPlugin';
  public schemas: Set<OasSchema> = new Set();

  public apply(factory: Factory) {
    factory.hooks.createDocument.tap(this.name, this.handleCreateDocument.bind(this));
  }

  public handleCreateDocument(document: OasDocument) {
    document.visit(this);

    const schemas = new Set(Array.from(this.schemas.values()));

    schemas.forEach(schema => {
      if (!schema.$ref || !/#\//.test(schema.$ref)) {
        return;
      }
      if (document.resolve(new OasNodePath(schema.$ref.substr(1)))) {
        return;
      }
      schema.$ref = '';
      schema.type = 'any';
    });
  }

  // visitors

  public visitSchema(schema: OasSchema) {
    this.schemas.add(schema);
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
