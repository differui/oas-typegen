import OasDocument from '@/core/libs/OasDocument';
import * as identifier from '@/identifier';
import container from '@/inversify.config';
import { injectable } from 'inversify';
import { Oas20Operation, Oas20SchemaDefinition } from 'oai-ts-core';
import { OpenAPIV2 } from 'openapi-types';

export enum FragmentType {
  Operation,
  OperationRequest,
  OperationResponse,
  Definition,
}

export type DocumentType = Oas20Operation|Oas20SchemaDefinition;

@injectable()
abstract class OasFragment<T extends DocumentType> {
  public abstract type: FragmentType;
  public document: T;

  public get modal() {
    return container.get<OasDocument>(identifier.OasDocument).write(this.document);
  }

  public get ownerModal(): OpenAPIV2.Document {
    return container.get<OasDocument>(identifier.OasDocument).write(this.document.ownerDocument());
  }

  public create(document: T) {
    this.document = document;
  }
}

export default OasFragment;
