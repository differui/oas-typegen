import IdentifierUtils from '@/core/libs/IdentifierUtils';
import OasFragment, { FragmentType } from '@/core/OasFragment';
import * as identifier from '@/identifier';
import { inject, injectable } from 'inversify';
import { Oas20SchemaDefinition } from 'oai-ts-core';

@injectable()
class DefinitionFragment extends OasFragment<Oas20SchemaDefinition> {
  public type = FragmentType.Definition;

  @inject(identifier.IdentifierUtils) private identifierUtils: IdentifierUtils;

  public get title() {
    return this.identifierUtils.transform(this.document.definitionName());
  }

  public get schema() {
    return {
      title: this.title,
      ...this.modal,
      definitions: this.ownerModal.definitions,
    };
  }

  public create(definitionSchemaDocument: Oas20SchemaDefinition) {
    this.document = definitionSchemaDocument;
    this.document.title = this.title;
  }
}

export default DefinitionFragment;
