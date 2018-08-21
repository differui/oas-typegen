import * as identifier from '@/identifier';
import { decorate, inject, injectable } from 'inversify';
import { Oas20CompositeVisitor, Oas20Document, OasLibraryUtils, OasNode, OasNodePath, OasVisitorUtil } from 'oai-ts-core';
import { OpenAPIV2 } from 'openapi-types';

decorate(injectable(), OasLibraryUtils);

@injectable()
class OasDocument {
  @inject(identifier.OasLibraryUtils) private library: OasLibraryUtils;
  private document: Oas20Document;

  public get definitions() {
    return this.document.definitions;
  }

  public get paths() {
    return this.document.paths;
  }

  public get parameters() {
    return this.document.parameters;
  }

  public get responses() {
    return this.document.responses;
  }

  public validate() {
    return this.library.validate(this.document);
  }

  public resolve(path: OasNodePath) {
    return path.resolve(this.write());
  }

  public visit(visitor: Oas20CompositeVisitor) {
    OasVisitorUtil.visitTree(this.document, visitor);
  }

  public write(node: OasNode = this.document) {
    return this.library.writeNode(node);
  }

  public create(document: OpenAPIV2.Document) {
    this.document = this.library.createDocument(document) as Oas20Document;
  }
}

export default OasDocument;
