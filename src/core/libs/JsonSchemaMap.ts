import { injectable } from 'inversify';
import { JSONSchema4 } from 'json-schema';
import { AST } from 'json-schema-to-typescript/dist/src/types/AST';

@injectable()
class JsonSchemaMap {
  private map: Map<string, AST> = new Map();

  public get(schema) {
    if (schema.title) {
      return this.map.get(schema.title);
    }
  }

  public set(schema: JSONSchema4, ast: AST) {
    if (schema.title) {
      this.map.set(schema.title, ast);
    }
  }

  public has(schema: JSONSchema4) {
    if (schema.title) {
      return this.map.has(schema.title);
    }
    return false;
  }
}

export default JsonSchemaMap;
