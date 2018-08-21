import DefinitionFragment from '@/core/oas-fragments/DefinitionFragment';
import OasVisitor from '@/core/OasVisitor';
import * as identifier from '@/identifier';
import container from '@/inversify.config';
import { inject, injectable } from 'inversify';
import { Oas20SchemaDefinition } from 'oai-ts-core';

@injectable()
class DefinitionVisitor extends OasVisitor {
  @inject(identifier.OasFragmentMap) public definitions: Map<string, DefinitionFragment>;

  public visitSchemaDefinition(definitionSchemaDocument: Oas20SchemaDefinition) {
    const definition = container.get<DefinitionFragment>(identifier.DefinitionFragment);

    definition.create(definitionSchemaDocument);
    this.definitions.set(definition.title, definition);
  }
}

export default DefinitionVisitor;
