import * as identifier from '@/identifier';
import Queue from '@/util/Queue';
import { inject, injectable } from 'inversify';
import { DEFAULT_OPTIONS, Options } from 'json-schema-to-typescript';
import { AST, hasComment, hasStandaloneName, TEnum, TInterface, TInterfaceParam, TIntersection, TUnion } from 'json-schema-to-typescript/dist/src/types/AST';

const DELIMITER_TAG = Symbol('DELIMITER_TAG');

@injectable()
class JsDocUtils {
  private tags: Array<string|typeof DELIMITER_TAG> = [];
  private options: Options = DEFAULT_OPTIONS;
  @inject(identifier.AstQueue) private astQueue: Queue<AST>;

  public generate(ast: AST, options: Partial<Options> = DEFAULT_OPTIONS) {
    this.options = this.normalizeOptions(options);

    this.astQueue.enqueue(ast);
    while (this.astQueue.length) {
      const astNode = this.astQueue.dequeue();

      this.generateReference(astNode, astNode.standaloneName);
      this.generateStandalone(astNode, astNode.standaloneName);
    }

    if (!this.tags.length) {
      return '';
    }

    const defs: Array<string> = [];

    while (this.tags.length) {
      const defTags: Array<string> = [];

      // skip delimiter
      while (this.tags[0] === DELIMITER_TAG) {
        this.tags.shift();
      }
      while (this.tags.length) {
        const tag = this.tags.shift();

        if (tag && typeof tag === 'string') {
          defTags.push(tag);
        } else {
          break;
        }
      }
      if (defTags.length) {
        defs.push(
          `/**
           ${defTags.filter(Boolean).map(defTag => `* ${defTag}`).join('\n')}
           */`
        );
      }
    }
    return [
      this.options.bannerComment,
      ...defs,
    ].filter(Boolean).join('\n');
  }

  private generateReference(ast: AST, standaloneName?: string, processed: Set<AST> = new Set()) {
    if (processed.has(ast)) {
      return;
    }
    processed.add(ast);
    switch (ast.type) {
      case 'ARRAY':
        this.generateReference(ast.params, standaloneName, processed);
        this.generateReferenceType(ast);
        break;
      case 'INTERFACE':
        ast.params
          .map(param => param.ast)
          .concat(ast.superTypes)
          .map(astNode => {
            if (astNode.standaloneName === standaloneName || this.options.declareExternallyReferenced) {
              this.generateReference(astNode, standaloneName, processed);
            }
          });
        break;
      case 'INTERSECTION':
      case 'TUPLE':
      case 'UNION':
        ast.params.map(astNode => this.generateReference(astNode, standaloneName, processed));
        this.generateReferenceType(ast);
        break;
      default:
        this.generateReferenceType(ast);
        break;
    }
  }

  private generateStandalone(ast: AST, standaloneName?: string, processed: Set<AST> = new Set()) {
    if (processed.has(ast)) {
      return;
    }
    processed.add(ast);
    switch (ast.type) {
      case 'ARRAY':
        this.generateStandalone(ast.params, standaloneName, processed);
        break;
      case 'INTERFACE':
        if (ast.standaloneName === standaloneName || this.options.declareExternallyReferenced) {
          this.generateObject(ast);
          ast.superTypes.forEach(superType => this.tags.push(`@extends ${superType.standaloneName}`));
        }
        ast.params
          .map(param => param.ast)
          .concat(ast.superTypes)
          .map(astNode => this.generateStandalone(astNode, standaloneName, processed));
        break;
      case 'INTERSECTION':
      case 'UNION':
        ast.params.map(astNode => this.generateStandalone(astNode, standaloneName, processed));
        break;
      default:
        break;
    }
  }

  private generateType(ast: AST): string {
    switch (ast.type) {
      case 'ANY': return 'any';
      case 'ARRAY':
        const type = this.generateType(ast.params);

        return type.endsWith('"') ? `Array.<(${type})>` : `Array.<${type}>`;
      case 'BOOLEAN': return 'boolean';
      case 'INTERFACE':
        if (this.options.declareExternallyReferenced) {
          this.generateObject(ast);
        }

        const keyedProperty = ast.params.find(isKeyedProperty);

        return keyedProperty
          ? (!ast.standaloneName || ast.params.length === 1) ? `Object.<string, ${this.generateType(keyedProperty.ast)}>` : ast.standaloneName
          : (ast.standaloneName ? ast.standaloneName : 'object');
      case 'INTERSECTION': return this.generateSetOperation(ast);
      case 'LITERAL': return JSON.stringify(ast.params);
      case 'NUMBER': return 'number';
      case 'NULL': return 'null';
      case 'OBJECT': return 'object';
      case 'REFERENCE': return ast.params;
      case 'STRING': return 'string';
      case 'TUPLE': return `[${ast.params.map(paramAst => this.generateType(paramAst)).join(', ')}]`;
      case 'UNION': return this.generateSetOperation(ast);
      case 'CUSTOM_TYPE': return ast.params;
      default: return '';
    }
  }

  private generateReferenceType(ast: AST) {
    if (hasStandaloneName(ast)) {
      const type = this.generateType(ast);

      this.tags.push(DELIMITER_TAG);
      this.generateComment(ast);
      this.tags.push(`@typedef ${ast.standaloneName}`);
      this.tags.push(`@type {${type}}`);
    }
  }

  private generateComment(ast: AST) {
    if (hasComment(ast)) {
      ast.comment.split('\n').forEach(line => this.tags.push(line));
    }
  }

  private generateSetOperation(ast: TIntersection|TUnion) {
    const members = (ast as TUnion).params.map(paramAst => this.generateType(paramAst));
    const separator = ast.type === 'UNION' ? '|' : '&';

    return members.length === 1 ? members[0] : `(${members.join(separator)})`;
  }

  private generateObject(ast: TInterface) {
    this.tags.push(DELIMITER_TAG);
    this.tags.push(`@typedef ${ast.standaloneName}`);

    const generatedType = this.generateType(ast);

    this.tags.push(`@type {${generatedType === ast.standaloneName ? 'object' : generatedType}}`);
    this.generateProperties(ast.params.filter(isNotKeyedProperty));
  }

  private generateProperties(asts: Array<TInterfaceParam>, keyChain: Array<string> = []) {
    const properties = asts
      .filter(param => !param.isPatternProperty && !param.isUnreachableDefinition)
      .map(param => {
        const keyName = keyChain.concat(param.keyName).join('.');

        return [
          this.generateType(param.ast),
          param.isRequired ? keyName : `[${keyName}]`,
          param.ast,
        ] as [string, string, AST];
      });

    properties.map(([type, name, paramAst]) => {
      this.tags.push(`@property {${type}} ${name} ${paramAst.comment || ''}`);
      if (paramAst.type === 'INTERFACE' && !hasStandaloneName(paramAst)) {
        this.generateProperties((paramAst as TInterface).params.filter(isNotKeyedProperty), paramAst.keyName ? keyChain.concat(paramAst.keyName) : keyChain);
      }
    });
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
}

function isKeyedProperty(ast: TInterfaceParam) {
  return ast.keyName.match(/^\[k: \w+\]$/) !== null;
}

function isNotKeyedProperty(ast: TInterfaceParam) {
  return !isKeyedProperty(ast);
}

export default JsDocUtils;
