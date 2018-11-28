import * as identifier from '@/identifier';
import { inject, injectable } from 'inversify';
import { JSONSchema4 } from 'json-schema';
import { DEFAULT_OPTIONS, Options } from 'json-schema-to-typescript';
import { format } from 'json-schema-to-typescript/dist/src/formatter';
import { generate } from 'json-schema-to-typescript/dist/src/generator';
import { normalize } from 'json-schema-to-typescript/dist/src/normalizer';
import { optimize } from 'json-schema-to-typescript/dist/src/optimizer';
import { parse } from 'json-schema-to-typescript/dist/src/parser';
import { dereference } from 'json-schema-to-typescript/dist/src/resolver';
import { AST } from 'json-schema-to-typescript/dist/src/types/AST';
import { error } from 'json-schema-to-typescript/dist/src/utils';
import { validate } from 'json-schema-to-typescript/dist/src/validator';
import JsonSchemaMap from './JsonSchemaMap';

@injectable()
class JsonSchemaUtils {
  @inject(identifier.JsonSchemaMap) private jsonSchemaMap: JsonSchemaMap;

  public visit(ast: AST, visitors: Hash<(ast: AST) => void>) {
    switch (ast.type) {
      case 'ARRAY':
        this.visit(ast.params, visitors);
        break;
      case 'ENUM':
        (ast.params || []).forEach(param => this.visit(param.ast, visitors));
        break;
      case 'INTERFACE':
        (ast.params || []).forEach(param => this.visit(param.ast, visitors));
        (ast.superTypes || []).forEach(superType => this.visit(superType, visitors));
        break;
      case 'TUPLE':
      case 'UNION':
      case 'INTERSECTION':
        (ast.params || []).forEach(param => this.visit(param, visitors));
        break;
      default:
        break;
    }
    if (typeof ast.type !== 'undefined' && typeof visitors[ast.type] === 'function') {
      visitors[ast.type](ast);
    }
  }

  public async parse(schema: JSONSchema4, name: string, options?: Partial<Options>) {
    this.validateSchema(schema, name);

    const normalizedOptions = this.normalizeOptions(options);
    const dereferencedSchema = await this.dereferenceSchema(schema, name, normalizedOptions);
    const ast = parse(
      dereferencedSchema,
      normalizedOptions,
      dereferencedSchema.definitions,
      '',
      true,
      this.jsonSchemaMap as any // implemented: get, set, has
    );

    return optimize(ast);
  }

  public generate(ast: AST, options?: Partial<Options>) {
    const normalizedOptions = this.normalizeOptions(options);

    return format(generate(ast, normalizedOptions), normalizedOptions);
  }

  private normalizeOptions(options?: Partial<Options>) {
    const normalizedOptions: Options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    if (!/\/$/.test(normalizedOptions.cwd)) {
      normalizedOptions.cwd += '/';
    }
    return normalizedOptions;
  }

  private validateSchema(schema: JSONSchema4, name: string) {
    const errors = validate(schema as JSONSchema4, name);

    if (errors.length) {
      errors.forEach(e => error(e));
      throw new Error();
    }
  }

  private hasRef(schema: JSONSchema4, processedSet: Set<any> = new Set()) {
    // detect circular reference
    if (processedSet.has(schema)) {
      return false;
    }
    processedSet.add(schema);
    if (typeof schema.type === 'undefined' && (schema.items || typeof schema.additionalItems === 'object')) {
      schema.type = 'array';
    }
    if (typeof schema.type === 'undefined' && (schema.properties || typeof schema.additionalProperties === 'object')) {
      schema.type = 'object';
    }
    switch (schema.type) {
      case 'array':
        if (schema.additionalItems && this.hasRef(schema.additionalItems as JSONSchema4)) {
          return true;
        }
        return Array.isArray(schema.items)
          ? schema.items.some(item => this.hasRef(item, processedSet))
          : schema.items ? this.hasRef(schema.items, processedSet) : false;
      case 'object':
        if (schema.additionalProperties && this.hasRef(schema.additionalProperties as JSONSchema4)) {
          return true;
        }
        return Object.values(schema.properties || {}).some(property => this.hasRef(property, processedSet));
      default:
        return typeof schema.$ref === 'string';
    }
  }

  private async dereferenceSchema(schema: JSONSchema4, name: string, options?: Partial<Options>) {
    const normalizedOptions = this.normalizeOptions(options);
    const definitions = schema.definitions;

    // detach definitions from schema
    // in order to speed up normalize
    delete schema.definitions;
    schema = normalize(schema, name);
    schema.definitions = definitions;
    while (this.hasRef(schema)) {
      schema = await dereference(schema, normalizedOptions);
      delete schema.$ref;
    }
    return schema;
  }
}

export default JsonSchemaUtils;
