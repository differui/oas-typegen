import { injectable } from 'inversify';
import { AST } from 'json-schema-to-typescript/dist/src/types/AST';

@injectable()
declare abstract class DtsVisitor {
  public ANY(ast: AST): void;
  public ARRAY(ast: AST): void;
  public BOOLEAN(ast: AST): void;
  public ENUM(ast: AST): void;
  public INTERFACE(ast: AST): void;
  public INTERSECTION(ast: AST): void;
  public LITERAL(ast: AST): void;
  public NUMBER(ast: AST): void;
  public NULL(ast: AST): void;
  public OBJECT(ast: AST): void;
  public REFERENCE(ast: AST): void;
  public STRING(ast: AST): void;
  public TUPLE(ast: AST): void;
  public UNION(ast: AST): void;
  public CUSTOM_TYPE(ast: AST): void;
}

export default DtsVisitor;
