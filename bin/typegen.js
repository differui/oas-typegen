#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var tslib_1 = require('tslib');
require('reflect-metadata');
var inversify = require('inversify');
var tapable = require('tapable');
var jsonSchemaToTypescript = require('json-schema-to-typescript');
var jsonSchemaToTypescript_dist_src_types_AST = require('json-schema-to-typescript/dist/src/types/AST');
var jsonSchemaToTypescript_dist_src_formatter = require('json-schema-to-typescript/dist/src/formatter');
var jsonSchemaToTypescript_dist_src_generator = require('json-schema-to-typescript/dist/src/generator');
var jsonSchemaToTypescript_dist_src_normalizer = require('json-schema-to-typescript/dist/src/normalizer');
var jsonSchemaToTypescript_dist_src_optimizer = require('json-schema-to-typescript/dist/src/optimizer');
var jsonSchemaToTypescript_dist_src_parser = require('json-schema-to-typescript/dist/src/parser');
var jsonSchemaToTypescript_dist_src_resolver = require('json-schema-to-typescript/dist/src/resolver');
var jsonSchemaToTypescript_dist_src_utils = require('json-schema-to-typescript/dist/src/utils');
var jsonSchemaToTypescript_dist_src_validator = require('json-schema-to-typescript/dist/src/validator');
var oaiTsCore = require('oai-ts-core');
var prettier = require('prettier');
var fs = require('fs');
var util = require('util');
var YAML = _interopDefault(require('yaml'));
var meow = _interopDefault(require('meow'));
var path = require('path');
var openapiJsonschemaParameters = require('openapi-jsonschema-parameters');
var md5 = _interopDefault(require('md5'));
var ora = _interopDefault(require('ora'));
var axios = _interopDefault(require('axios'));
var resolve$1 = require('resolve');

// libs
const Tapable$1 = Symbol('Tapable');
const Spinner = Symbol('Spinner');
const PrettierUtils = Symbol('PrettierUtils');
const IdentifierUtils = Symbol('IdentifierUtils');
const JsonSchemaUtils = Symbol('JsonSchemaUtils');
const OasLibraryUtils$1 = Symbol('OasLibraryUtils');
const JsDocUtils = Symbol('JsDocUtils');
const ParameterUtils = Symbol('ParameterUtils');
// core
const Factory = Symbol('Factory');
const CLI = Symbol('CLI');

const OasDocument = Symbol('OasDocument');
// fragments
const DefinitionFragment = Symbol('DefinitionFragment');
const OperationFragment = Symbol('OperationFragment');
const OperationRequestFragment = Symbol('OperationRequestFragment');
const OperationResponseFragment = Symbol('OperationResponseFragment');
// oas visitors
const Oas20CompositeVisitor$1 = Symbol('Oas20CompositeVisitor');
const OperationVisitor = Symbol('OperationVisitor');
const DefinitionVisitor = Symbol('DefinitionVisitor');
// generators
const TsGenerator = Symbol('TsGenerator');
const JsGenerator = Symbol('JsGenerator');
// built-in plugins
const EnhanceTypeNamePlugin = Symbol('EnhanceTypeNamePlugin');
const FixRefPlugin = Symbol('FixRefPlugin');
const LogPlugin = Symbol('LogPlugin');
// maps
const HookMap = Symbol('HookMap');
const OasFragmentMap = Symbol('OasFragmentMap');
const JsonSchemaMap = Symbol('JsonSchemaMap');
// queues
const AstQueue = Symbol('AstQueue');
// utils
const Timer = Symbol('Timer');
const Network = Symbol('Network');
const FileSystem = Symbol('FileSystem');
const ModuleSystem = Symbol('ModuleSystem');

let Generator = class Generator {
    constructor() {
        this.hooks = {
            createSchema: new tapable.AsyncSeriesHook(['schema']),
            parse: new tapable.AsyncSeriesHook(['ast']),
            generate: new tapable.AsyncSeriesHook(['code']),
        };
    }
};
Generator = tslib_1.__decorate([
    inversify.injectable()
], Generator);
var Generator$1 = Generator;

var Queue_1;
let Queue = Queue_1 = class Queue {
    constructor() {
        this.items = [];
    }
    get length() {
        return this.items.length;
    }
    dequeue() {
        if (this.length === 0) {
            throw new Error('empty');
        }
        return this.items.shift();
    }
    enqueue(item) {
        if (this.length >= Queue_1.MAX_LENGTH) {
            throw new Error('overflow');
        }
        this.items.push(item);
    }
};
Queue.MAX_LENGTH = 100;
Queue = Queue_1 = tslib_1.__decorate([
    inversify.injectable()
], Queue);
var Queue$1 = Queue;

var _a$3;
const DELIMITER_TAG = Symbol('DELIMITER_TAG');
let JsDocUtils$1 = class JsDocUtils$$1 {
    constructor() {
        this.tags = [];
        this.options = jsonSchemaToTypescript.DEFAULT_OPTIONS;
    }
    generate(ast, options = jsonSchemaToTypescript.DEFAULT_OPTIONS) {
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
        const defs = [];
        while (this.tags.length) {
            const defTags = [];
            // skip delimiter
            while (this.tags[0] === DELIMITER_TAG) {
                this.tags.shift();
            }
            while (this.tags.length) {
                const tag = this.tags.shift();
                if (tag && typeof tag === 'string') {
                    defTags.push(tag);
                }
                else {
                    break;
                }
            }
            if (defTags.length) {
                defs.push(`/**
           ${defTags.filter(Boolean).map(defTag => `* ${defTag}`).join('\n')}
           */`);
            }
        }
        return [
            this.options.bannerComment,
            ...defs,
        ].filter(Boolean).join('\n');
    }
    generateReference(ast, standaloneName, processed = new Set()) {
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
    generateStandalone(ast, standaloneName, processed = new Set()) {
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
    generateType(ast) {
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
    generateReferenceType(ast) {
        if (jsonSchemaToTypescript_dist_src_types_AST.hasStandaloneName(ast)) {
            const type = this.generateType(ast);
            this.tags.push(DELIMITER_TAG);
            this.generateComment(ast);
            this.tags.push(`@typedef ${ast.standaloneName}`);
            this.tags.push(`@type {${type}}`);
        }
    }
    generateComment(ast) {
        if (jsonSchemaToTypescript_dist_src_types_AST.hasComment(ast)) {
            ast.comment.split('\n').forEach(line => this.tags.push(line));
        }
    }
    generateSetOperation(ast) {
        const members = ast.params.map(paramAst => this.generateType(paramAst));
        const separator = ast.type === 'UNION' ? '|' : '&';
        return members.length === 1 ? members[0] : `(${members.join(separator)})`;
    }
    generateObject(ast) {
        this.tags.push(DELIMITER_TAG);
        this.tags.push(`@typedef ${ast.standaloneName}`);
        const generatedType = this.generateType(ast);
        this.tags.push(`@type {${generatedType === ast.standaloneName ? 'object' : generatedType}}`);
        this.generateProperties(ast.params.filter(isNotKeyedProperty));
    }
    generateProperties(asts, keyChain = []) {
        const properties = asts
            .filter(param => !param.isPatternProperty && !param.isUnreachableDefinition)
            .map(param => {
            const keyName = keyChain.concat(param.keyName).join('.');
            return [
                this.generateType(param.ast),
                param.isRequired ? keyName : `[${keyName}]`,
                param.ast,
            ];
        });
        properties.map(([type, name, paramAst]) => {
            this.tags.push(`@property {${type}} ${name} ${paramAst.comment || ''}`);
            if (paramAst.type === 'INTERFACE' && !jsonSchemaToTypescript_dist_src_types_AST.hasStandaloneName(paramAst)) {
                this.generateProperties(paramAst.params.filter(isNotKeyedProperty), paramAst.keyName ? keyChain.concat(paramAst.keyName) : keyChain);
            }
        });
    }
    normalizeOptions(options) {
        const normalizedOptions = Object.assign({}, jsonSchemaToTypescript.DEFAULT_OPTIONS, options);
        if (!/\/$/.test(normalizedOptions.cwd)) {
            normalizedOptions.cwd += '/';
        }
        return normalizedOptions;
    }
};
tslib_1.__decorate([
    inversify.inject(AstQueue),
    tslib_1.__metadata("design:type", typeof (_a$3 = typeof Queue$1 !== "undefined" && Queue$1) === "function" ? _a$3 : Object)
], JsDocUtils$1.prototype, "astQueue", void 0);
JsDocUtils$1 = tslib_1.__decorate([
    inversify.injectable()
], JsDocUtils$1);
function isKeyedProperty(ast) {
    return ast.keyName.match(/^\[k: \w+\]$/) !== null;
}
function isNotKeyedProperty(ast) {
    return !isKeyedProperty(ast);
}
var JsDocUtils$2 = JsDocUtils$1;

let JsonSchemaMap$1 = class JsonSchemaMap {
    constructor() {
        this.map = new Map();
    }
    get(schema) {
        if (schema.title) {
            return this.map.get(schema.title);
        }
    }
    set(schema, ast) {
        if (schema.title) {
            this.map.set(schema.title, ast);
        }
    }
    has(schema) {
        if (schema.title) {
            return this.map.has(schema.title);
        }
        return false;
    }
};
JsonSchemaMap$1 = tslib_1.__decorate([
    inversify.injectable()
], JsonSchemaMap$1);
var JsonSchemaMap$2 = JsonSchemaMap$1;

var _a$4;
let JsonSchemaUtils$1 = class JsonSchemaUtils$$1 {
    visit(ast, visitors) {
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
    parse(schema, name, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.validateSchema(schema, name);
            const normalizedOptions = this.normalizeOptions(options);
            const dereferencedSchema = yield this.dereferenceSchema(schema, name, normalizedOptions);
            const ast = jsonSchemaToTypescript_dist_src_parser.parse(dereferencedSchema, normalizedOptions, dereferencedSchema.definitions, '', true, this.jsonSchemaMap // implemented: get, set, has
            );
            return jsonSchemaToTypescript_dist_src_optimizer.optimize(ast);
        });
    }
    generate(ast, options) {
        const normalizedOptions = this.normalizeOptions(options);
        return jsonSchemaToTypescript_dist_src_formatter.format(jsonSchemaToTypescript_dist_src_generator.generate(ast, normalizedOptions), normalizedOptions);
    }
    normalizeOptions(options) {
        const normalizedOptions = Object.assign({}, jsonSchemaToTypescript.DEFAULT_OPTIONS, options);
        if (!/\/$/.test(normalizedOptions.cwd)) {
            normalizedOptions.cwd += '/';
        }
        return normalizedOptions;
    }
    validateSchema(schema, name) {
        const errors = jsonSchemaToTypescript_dist_src_validator.validate(schema, name);
        if (errors.length) {
            errors.forEach(e => jsonSchemaToTypescript_dist_src_utils.error(e));
            throw new Error();
        }
    }
    hasRef(schema, processedSet = new Set()) {
        // detect circular reference
        if (processedSet.has(schema)) {
            return false;
        }
        processedSet.add(schema);
        if (typeof schema.type === 'undefined' && schema.items) {
            schema.type = 'array';
        }
        if (typeof schema.type === 'undefined' && schema.properties) {
            schema.type = 'object';
        }
        switch (schema.type) {
            case 'array':
                return Array.isArray(schema.items)
                    ? schema.items.some(item => this.hasRef(item, processedSet))
                    : schema.items ? this.hasRef(schema.items, processedSet) : false;
            case 'object':
                return Object.values(schema.properties || {}).some(property => this.hasRef(property, processedSet));
            default:
                return typeof schema.$ref === 'string';
        }
    }
    dereferenceSchema(schema, name, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const normalizedOptions = this.normalizeOptions(options);
            const definitions = schema.definitions;
            // detach definitions from schema
            // in order to speed up normalize
            delete schema.definitions;
            schema = jsonSchemaToTypescript_dist_src_normalizer.normalize(schema, name);
            schema.definitions = definitions;
            while (this.hasRef(schema)) {
                schema = yield jsonSchemaToTypescript_dist_src_resolver.dereference(schema, normalizedOptions);
                delete schema.$ref;
            }
            return schema;
        });
    }
};
tslib_1.__decorate([
    inversify.inject(JsonSchemaMap),
    tslib_1.__metadata("design:type", typeof (_a$4 = typeof JsonSchemaMap$2 !== "undefined" && JsonSchemaMap$2) === "function" ? _a$4 : Object)
], JsonSchemaUtils$1.prototype, "jsonSchemaMap", void 0);
JsonSchemaUtils$1 = tslib_1.__decorate([
    inversify.injectable()
], JsonSchemaUtils$1);
var JsonSchemaUtils$2 = JsonSchemaUtils$1;

var FragmentType;
(function (FragmentType) {
    FragmentType[FragmentType["Operation"] = 0] = "Operation";
    FragmentType[FragmentType["OperationRequest"] = 1] = "OperationRequest";
    FragmentType[FragmentType["OperationResponse"] = 2] = "OperationResponse";
    FragmentType[FragmentType["Definition"] = 3] = "Definition";
})(FragmentType || (FragmentType = {}));
let OasFragment$1 = class OasFragment$$1 {
    get modal() {
        return container.get(OasDocument).write(this.document);
    }
    get ownerModal() {
        return container.get(OasDocument).write(this.document.ownerDocument());
    }
    create(document) {
        this.document = document;
    }
};
OasFragment$1 = tslib_1.__decorate([
    inversify.injectable()
], OasFragment$1);
var OasFragment$2 = OasFragment$1;

var _a$2;
var _b$1;
let JsGenerator$1 = class JsGenerator$$1 extends Generator$1 {
    generate(fragments, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const sortSchema = (a, b) => {
                if (a.title && b.title) {
                    if (a.title === b.title) {
                        return 0;
                    }
                    if (a.title > b.title) {
                        return 1;
                    }
                    return -1;
                }
                else {
                    return 0;
                }
            };
            const striveSteam = (fragment) => fragment.schema;
            const definitionFragments = fragments.filter(fragment => fragment.type === FragmentType.Definition);
            const operationRequestFragments = fragments.filter(fragment => fragment.type === FragmentType.OperationRequest);
            const operationResponseFragments = fragments.filter(fragment => fragment.type === FragmentType.OperationResponse && fragment.responseSuccessCodes.length);
            const definitionSchemas = definitionFragments.map(striveSteam);
            const operationRequestSchemas = operationRequestFragments.filter(fragment => fragment.parameters.length).map(striveSteam);
            const operationResponseSchemas = operationResponseFragments.map(striveSteam);
            const [definitionTypeDefs, operationTypeDefs,] = yield Promise.all([
                this.generateTypeDef(definitionSchemas),
                this.generateTypeDef([
                    ...operationRequestSchemas,
                    ...operationResponseSchemas,
                ].sort(sortSchema)),
            ]);
            return [
                this.generateDispatch(options),
                definitionTypeDefs,
                operationTypeDefs,
                '\n',
                `void 'A DELIMITER LINE DISTINGUISH TYPE-DEFS AND API DEFINITIONS'`,
                this.generateOperations(operationRequestFragments, options),
            ].join('\n');
        });
    }
    generateDispatch(options) {
        if (options.format === 'es') {
            return `import ${options.helperName} from '${options.helper}'`;
        }
        return `const ${options.helperName} = require('${options.helper}')`;
    }
    generateTypeDef(schemas) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const options = {
                bannerComment: '',
                declareExternallyReferenced: false,
                unreachableDefinitions: false,
            };
            const trees = yield Promise.all(schemas.map(schema => this.jsonSchemaUtils.parse(schema, schema.title || '', options)));
            return trees.map(tree => this.jsDocUtils.generate(tree, options)).join('\n');
        });
    }
    generateOperations(fragments, options) {
        return fragments.map(fragment => {
            const requestGuard = fragment.parameters.length ? fragment.title : '';
            const responseGuard = fragment.responseSuccessCodes.length ? fragment.title.replace(/Request$/, 'Response') : 'void';
            const tags = [];
            if (requestGuard) {
                tags.push(`@param {${requestGuard}} request`);
            }
            if (fragment.deprecated) {
                tags.push('@deprecated');
            }
            tags.push(`@returns {Promise<${responseGuard}>}`);
            return `
        /**
         * ${fragment.introduction}
         *
         * \`${fragment.method} ${fragment.path}\`
         *
         ${tags.map(tag => `* ${tag}`).join('\n')}
         */
        export function ${fragment.id}(${requestGuard ? 'request' : ''}) {
          return ${options.helperName}(${JSON.stringify(fragment.path)}, ${requestGuard ? 'request' : ''});
        }`;
        }).filter(Boolean).join('\n');
    }
};
tslib_1.__decorate([
    inversify.inject(JsonSchemaUtils),
    tslib_1.__metadata("design:type", typeof (_a$2 = typeof JsonSchemaUtils$2 !== "undefined" && JsonSchemaUtils$2) === "function" ? _a$2 : Object)
], JsGenerator$1.prototype, "jsonSchemaUtils", void 0);
tslib_1.__decorate([
    inversify.inject(JsDocUtils),
    tslib_1.__metadata("design:type", typeof (_b$1 = typeof JsDocUtils$2 !== "undefined" && JsDocUtils$2) === "function" ? _b$1 : Object)
], JsGenerator$1.prototype, "jsDocUtils", void 0);
JsGenerator$1 = tslib_1.__decorate([
    inversify.injectable()
], JsGenerator$1);
var JsGenerator$2 = JsGenerator$1;

var _a$5;
let TsGenerator$1 = class TsGenerator$$1 extends Generator$1 {
    generate(fragments, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const sortSchema = (a, b) => {
                if (a.title && b.title) {
                    if (a.title === b.title) {
                        return 0;
                    }
                    if (a.title > b.title) {
                        return 1;
                    }
                    return -1;
                }
                else {
                    return 0;
                }
            };
            const striveSteam = (fragment) => fragment.schema;
            const definitionFragments = fragments.filter(fragment => fragment.type === FragmentType.Definition);
            const operationRequestFragments = fragments.filter(fragment => fragment.type === FragmentType.OperationRequest);
            const operationResponseFragments = fragments.filter(fragment => fragment.type === FragmentType.OperationResponse && fragment.responseSuccessCodes.length);
            const definitionSchemas = definitionFragments.map(striveSteam);
            const operationRequestSchemas = operationRequestFragments.filter(fragment => fragment.parameters.length).map(striveSteam);
            const operationResponseSchemas = operationResponseFragments.map(striveSteam);
            // console.log(JSON.stringify(operationRequestSchemas, undefined, 2));
            const definitionInterfaces = yield this.generateInterfaces(definitionSchemas);
            const operationInterfaces = yield this.generateInterfaces([
                ...operationRequestSchemas,
                ...operationResponseSchemas,
            ].sort(sortSchema));
            return [
                this.generateDispatch(),
                '',
                definitionInterfaces,
                operationInterfaces,
                this.generateOperations(operationRequestFragments),
            ].join('\n');
        });
    }
    generateDispatch() {
        return `import dispatchRequest from './dispatchRequest'`;
    }
    generateInterfaces(schemas) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const options = {
                bannerComment: '',
                declareExternallyReferenced: false,
                unreachableDefinitions: false,
                $refOptions: {
                    dereference: {
                        circular: false,
                    },
                },
            };
            const trees = yield Promise.all(schemas.map(schema => this.jsonSchemaUtils.parse(schema, schema.title || '', options)));
            return trees.map(tree => this.jsonSchemaUtils.generate(tree, options)).join('\n');
        });
    }
    generateOperations(fragments) {
        return fragments.map(fragment => {
            const requestGuard = fragment.parameters.length ? `request: ${fragment.title}` : '';
            const responseGuard = fragment.responseSuccessCodes.length ? fragment.title.replace(/Request$/, 'Response') : 'void';
            return `
        /**
         * ${fragment.deprecated ? '\`DEPRECATED\` ' : ''}${fragment.introduction}
         *
         * \`${fragment.method} ${fragment.path}\`
         */
        export function ${fragment.id}(${requestGuard}): Promise<${responseGuard}> {
          return dispatchRequest(${JSON.stringify(fragment.path)}, ${requestGuard ? 'request' : ''});
        }`;
        }).filter(Boolean).join('\n');
    }
};
tslib_1.__decorate([
    inversify.inject(JsonSchemaUtils),
    tslib_1.__metadata("design:type", typeof (_a$5 = typeof JsonSchemaUtils$2 !== "undefined" && JsonSchemaUtils$2) === "function" ? _a$5 : Object)
], TsGenerator$1.prototype, "jsonSchemaUtils", void 0);
TsGenerator$1 = tslib_1.__decorate([
    inversify.injectable()
], TsGenerator$1);
var TsGenerator$2 = TsGenerator$1;

var _a$6;
inversify.decorate(inversify.injectable(), oaiTsCore.OasLibraryUtils);
let OasDocument$1 = class OasDocument$$1 {
    get definitions() {
        return this.document.definitions;
    }
    get paths() {
        return this.document.paths;
    }
    get parameters() {
        return this.document.parameters;
    }
    get responses() {
        return this.document.responses;
    }
    validate() {
        return this.library.validate(this.document);
    }
    resolve(path$$1) {
        return path$$1.resolve(this.write());
    }
    visit(visitor) {
        oaiTsCore.OasVisitorUtil.visitTree(this.document, visitor);
    }
    write(node = this.document) {
        return this.library.writeNode(node);
    }
    create(document) {
        this.document = this.library.createDocument(document);
    }
};
tslib_1.__decorate([
    inversify.inject(OasLibraryUtils$1),
    tslib_1.__metadata("design:type", typeof (_a$6 = typeof oaiTsCore.OasLibraryUtils !== "undefined" && oaiTsCore.OasLibraryUtils) === "function" ? _a$6 : Object)
], OasDocument$1.prototype, "library", void 0);
OasDocument$1 = tslib_1.__decorate([
    inversify.injectable()
], OasDocument$1);
var OasDocument$2 = OasDocument$1;

let PrettierUtils$1 = class PrettierUtils {
    format(code, options) {
        return prettier.format(code, options);
    }
};
PrettierUtils$1 = tslib_1.__decorate([
    inversify.injectable()
], PrettierUtils$1);
var PrettierUtils$2 = PrettierUtils$1;

inversify.decorate(inversify.injectable(), tapable.Tapable);
let Tap = class Tap extends tapable.Tapable {
};
Tap = tslib_1.__decorate([
    inversify.injectable()
], Tap);
var Tapable$2 = Tap;

inversify.decorate(inversify.injectable(), oaiTsCore.OasCompositeVisitor);
inversify.decorate(inversify.injectable(), oaiTsCore.Oas20CompositeVisitor);
let OasVisitor = class OasVisitor extends oaiTsCore.Oas20CompositeVisitor {
};
OasVisitor = tslib_1.__decorate([
    inversify.injectable()
], OasVisitor);
var OasVisitor$1 = OasVisitor;

var _a$7;
let DefinitionVisitor$1 = class DefinitionVisitor$$1 extends OasVisitor$1 {
    visitSchemaDefinition(definitionSchemaDocument) {
        const definition = container.get(DefinitionFragment);
        definition.create(definitionSchemaDocument);
        this.definitions.set(definition.title, definition);
    }
};
tslib_1.__decorate([
    inversify.inject(OasFragmentMap),
    tslib_1.__metadata("design:type", typeof (_a$7 = typeof Map !== "undefined" && Map) === "function" ? _a$7 : Object)
], DefinitionVisitor$1.prototype, "definitions", void 0);
DefinitionVisitor$1 = tslib_1.__decorate([
    inversify.injectable()
], DefinitionVisitor$1);
var DefinitionVisitor$2 = DefinitionVisitor$1;

var _a$8;
var _b$2;
let OperationVisitor$1 = class OperationVisitor$$1 extends OasVisitor$1 {
    visitOperation(operationDocument) {
        const request = container.get(OperationRequestFragment);
        const response = container.get(OperationResponseFragment);
        request.create(operationDocument);
        response.create(operationDocument);
        this.request.set(request.title, request);
        this.response.set(response.title, response);
    }
};
tslib_1.__decorate([
    inversify.inject(OasFragmentMap),
    tslib_1.__metadata("design:type", typeof (_a$8 = typeof Map !== "undefined" && Map) === "function" ? _a$8 : Object)
], OperationVisitor$1.prototype, "request", void 0);
tslib_1.__decorate([
    inversify.inject(OasFragmentMap),
    tslib_1.__metadata("design:type", typeof (_b$2 = typeof Map !== "undefined" && Map) === "function" ? _b$2 : Object)
], OperationVisitor$1.prototype, "response", void 0);
OperationVisitor$1 = tslib_1.__decorate([
    inversify.injectable()
], OperationVisitor$1);
var OperationVisitor$2 = OperationVisitor$1;

let FileSystem$1 = class FileSystem {
    readFile(src) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return (yield util.promisify(fs.readFile)(src, 'utf8')).toString();
        });
    }
    readFileSync(src) {
        return fs.readFileSync(src, 'utf8').toString();
    }
    writeFile(dest, content) {
        return util.promisify(fs.writeFile)(dest, content, 'utf8');
    }
    readJson(src) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return JSON.parse((yield this.readFile(src)));
        });
    }
    readJsonSync(src) {
        return JSON.parse(this.readFileSync(src));
    }
    readYaml(src) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return YAML.parse((yield this.readFile(src)));
        });
    }
    readYamlSync(src) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return YAML.parse(this.readFileSync(src));
        });
    }
};
FileSystem$1 = tslib_1.__decorate([
    inversify.injectable()
], FileSystem$1);
var FileSystem$2 = FileSystem$1;

var _a$1;
var _b;
var _c;
var _d;
var _e;
var _f;
var _g;
const DEFAULT_OUTPUT_OPTIONS = {
    path: '',
    format: 'es',
    language: 'js',
    intro: '',
    outro: '',
    helper: './dispatchRequest',
    helperName: 'dispatchRequest',
};
const DEFAULT_PRETTIER_OPTIONS = {
    parser: 'babylon',
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    bracketSpacing: false,
};
const DEFAULT_OPTIONS$1 = {
    input: '',
    output: DEFAULT_OUTPUT_OPTIONS,
    silent: false,
    plugins: [],
    prettier: DEFAULT_PRETTIER_OPTIONS,
};
let Factory$1 = class Factory$$1 extends Tapable$2 {
    constructor() {
        super();
        this.hooks = {
            applyPlugins: new tapable.AsyncSeriesHook(['plugins']),
            options: new tapable.AsyncParallelHook(['options']),
            mergeOptions: new tapable.AsyncParallelHook(['mergedOptions']),
            createDocument: new tapable.AsyncSeriesHook(['document']),
            createDefinitionFragment: new tapable.AsyncSeriesHook(['definitionFragment']),
            createRequestOperationFragment: new tapable.AsyncSeriesHook(['operationRequestFragment']),
            createResponseOperationFragment: new tapable.AsyncSeriesHook(['operationResponseFragment']),
            createGenerator: new tapable.AsyncSeriesHook(['code', 'options']),
            generate: new tapable.AsyncSeriesBailHook(['string']),
            write: new tapable.AsyncParallelHook(['options', 'code']),
        };
    }
    build(document, plugins, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // apply plugins and invoke hook
            if (Array.isArray(plugins)) {
                plugins.forEach(plugin => plugin.apply(this));
                yield this.hooks.applyPlugins.promise(Array.isArray(plugins) ? plugins : []);
            }
            else {
                options = plugins;
            }
            yield this.hooks.options.promise(options);
            // merge options and invoke hook
            const mergedOptions = this.mergeOptions(options);
            yield this.hooks.options.promise(mergedOptions);
            // create oas document use visitors filter out document fragments
            this.oasDocument.create(document);
            yield this.hooks.createDocument.promise(this.oasDocument);
            this.oasDocument.visit(this.definitionVisitor);
            this.oasDocument.visit(this.operationVisitor);
            const definitionFragments = Array.from(this.definitionVisitor.definitions.values());
            const requestOperationFragments = Array.from(this.operationVisitor.request.values());
            const responseOperationFragments = Array.from(this.operationVisitor.response.values());
            yield Promise.all([
                ...definitionFragments.map(fragment => this.hooks.createDefinitionFragment.promise(fragment)),
                ...requestOperationFragments.map(fragment => this.hooks.createRequestOperationFragment.promise(fragment)),
                ...responseOperationFragments.map(fragment => this.hooks.createResponseOperationFragment.promise(fragment)),
            ]);
            // generate code
            const fragments = [
                ...definitionFragments,
                ...requestOperationFragments,
                ...responseOperationFragments,
            ];
            const generateOptions = {
                format: mergedOptions.output.format,
                helper: mergedOptions.output.helper,
                helperName: mergedOptions.output.helperName,
            };
            let code = '';
            switch (mergedOptions.output.language) {
                case 'ts':
                    yield this.hooks.createGenerator.promise(this.tsGenerator, generateOptions);
                    code = yield this.tsGenerator.generate(fragments, generateOptions);
                    break;
                case 'js':
                    yield this.hooks.createGenerator.promise(this.jsGenerator, generateOptions);
                    code = yield this.jsGenerator.generate(fragments, generateOptions);
                    break;
                default:
                    break;
            }
            code = this.prettierUtils.format([
                mergedOptions.output.intro,
                code,
                mergedOptions.output.outro,
                '\n',
            ].filter(Boolean).join('\n'), mergedOptions.prettier);
            code = yield this.hooks.generate.promise(code);
            // output document or write to stdout
            const { path: path$$1, } = mergedOptions.output;
            if (path$$1) {
                yield this.hooks.write.promise(mergedOptions, code);
                this.fileSystem.writeFile(path$$1, code);
                {
                    this.fileSystem.writeFile(`${path$$1}.json`, JSON.stringify(document, undefined, 2));
                }
            }
            else if (!mergedOptions.silent) {
                process.stdout.write(code);
            }
        });
    }
    mergeOptions(options) {
        if (!options) {
            return DEFAULT_OPTIONS$1;
        }
        const output = Object.assign({}, DEFAULT_OUTPUT_OPTIONS, options.output);
        const prettier$$1 = Object.assign({}, DEFAULT_PRETTIER_OPTIONS, options.prettier);
        return {
            input: options.input || '',
            output,
            silent: options.silent || false,
            plugins: [],
            prettier: prettier$$1,
        };
    }
};
tslib_1.__decorate([
    inversify.inject(OasDocument),
    tslib_1.__metadata("design:type", typeof (_a$1 = typeof OasDocument$2 !== "undefined" && OasDocument$2) === "function" ? _a$1 : Object)
], Factory$1.prototype, "oasDocument", void 0);
tslib_1.__decorate([
    inversify.inject(OperationVisitor),
    tslib_1.__metadata("design:type", typeof (_b = typeof OperationVisitor$2 !== "undefined" && OperationVisitor$2) === "function" ? _b : Object)
], Factory$1.prototype, "operationVisitor", void 0);
tslib_1.__decorate([
    inversify.inject(DefinitionVisitor),
    tslib_1.__metadata("design:type", typeof (_c = typeof DefinitionVisitor$2 !== "undefined" && DefinitionVisitor$2) === "function" ? _c : Object)
], Factory$1.prototype, "definitionVisitor", void 0);
tslib_1.__decorate([
    inversify.inject(TsGenerator),
    tslib_1.__metadata("design:type", typeof (_d = typeof TsGenerator$2 !== "undefined" && TsGenerator$2) === "function" ? _d : Object)
], Factory$1.prototype, "tsGenerator", void 0);
tslib_1.__decorate([
    inversify.inject(JsGenerator),
    tslib_1.__metadata("design:type", typeof (_e = typeof JsGenerator$2 !== "undefined" && JsGenerator$2) === "function" ? _e : Object)
], Factory$1.prototype, "jsGenerator", void 0);
tslib_1.__decorate([
    inversify.inject(PrettierUtils),
    tslib_1.__metadata("design:type", typeof (_f = typeof PrettierUtils$2 !== "undefined" && PrettierUtils$2) === "function" ? _f : Object)
], Factory$1.prototype, "prettierUtils", void 0);
tslib_1.__decorate([
    inversify.inject(FileSystem),
    tslib_1.__metadata("design:type", typeof (_g = typeof FileSystem$2 !== "undefined" && FileSystem$2) === "function" ? _g : Object)
], Factory$1.prototype, "fileSystem", void 0);
Factory$1 = tslib_1.__decorate([
    inversify.injectable(),
    tslib_1.__metadata("design:paramtypes", [])
], Factory$1);
var Factory$2 = Factory$1;

var _a;


const NAME = 'typegen';
const HELP_MESSAGE = `
  Usage

  $ ${NAME} --input <input> --output <output>

  Options:

    --input, -i    (required) Path to OpenAPI document in local file system or
                   url on lines.
    --output, -o   The output path and file for generated assets.
    --dir, -d      The output directory for generated assets. Use current dire-
                   tory by default.

    --name, -n     Specifies the name of your swagger document.
    --config, -c   Use this config file(if argument is used but value is unspe-
                   cified, defaults to typegen.json).
    --format, -f   Type of output assets (cjs, es).Use "es" by default.
    --language, -l Choice one output language in js ts and dts
                   > js: (default) create a .js file and comment with JSDoc
                   > ts: create a .ts file and declare types as interfaces
                   > dts: create a .js file and declare types in a .d.ts
    --plugin, -p   Load the plugin from local node_modules.

    --helper       Path or url for customize ajax helper.
    --helper-name  Name for ajax helper. Use "dispatchRequest" by default.

    --intro        Content to insert at top of generated type file.
    --outro        Content to insert at bottom of generated type file.

    --serial, -e   Force build multi-documents one by one.
    --silent, -s   Prevent output from being displayed in stdout.
    --version, -v  Print current version number.
    --help, -h     Print this message.

  Examples:

  $ ${NAME} --input ./swagger.json --output gateway.js --language js
  $ ${NAME} --input http://petstore.swagger.io/v2/swagger.json --output petsto-
                    re.js`;
let CLI$1 = class CLI$$1 {
    constructor() {
        this.cli = meow(HELP_MESSAGE, {
            autoHelp: true,
            autoVersion: true,
            flags: {
                input: {
                    type: 'string',
                    alias: 'i',
                },
                output: {
                    type: 'string',
                    alias: 'o',
                    default: '',
                },
                dir: {
                    type: 'string',
                    alias: 'd',
                    default: '',
                },
                format: {
                    type: 'string',
                    alias: 'f',
                    default: DEFAULT_OUTPUT_OPTIONS.format,
                },
                config: {
                    type: 'string',
                    alias: 'c',
                },
                language: {
                    type: 'string',
                    alias: 'l',
                    default: DEFAULT_OUTPUT_OPTIONS.language,
                },
                helper: {
                    type: 'string',
                    default: DEFAULT_OUTPUT_OPTIONS.helper,
                },
                helperName: {
                    type: 'string',
                    default: DEFAULT_OUTPUT_OPTIONS.helperName,
                },
                intro: {
                    type: 'string',
                    default: DEFAULT_OUTPUT_OPTIONS.intro,
                },
                outro: {
                    type: 'string',
                    default: DEFAULT_OUTPUT_OPTIONS.outro,
                },
                serial: {
                    type: 'boolean',
                    alias: 'e',
                    default: false,
                },
                silent: {
                    type: 'boolean',
                    alias: 's',
                    default: false,
                },
                plugin: {
                    type: 'string',
                    alias: 'p',
                },
                version: {
                    type: 'boolean',
                    alias: 'v',
                },
                help: {
                    type: 'boolean',
                    alias: 'h',
                },
            },
        });
        // apply implicit rules
        const { dir, file, language, output, helper, helperName, } = this.cli.flags;
        const ext = language.substr(-2);
        // rule: if provide 'dir' and omit 'output' then create output
        if (!output && dir && file) {
            this.cli.flags.output = path.resolve(dir, file.endsWith(`.${ext}`) ? file : `${file}.${ext}`);
        }
        // rule: if omit 'helper' then use default helper name
        if (!helper && helperName) {
            this.cli.flags.helper = `./${helperName}`;
        }
    }
    get input() {
        return this.cli.flags.input;
    }
    get output() {
        const { format: format$$1, language, output, intro, outro, helper, helperName, } = this.cli.flags;
        return {
            path: output,
            format: format$$1,
            language,
            intro,
            outro,
            helper,
            helperName,
        };
    }
    get cliOptions() {
        const { input, serial, silent, plugin, } = this.cli.flags;
        const plugins = (Array.isArray(plugin) ? plugin : (plugin ? [plugin] : []));
        if (Array.isArray(this.input)) {
            return this.input.map(singleInput => ({
                input: singleInput,
                output: this.output,
                serial: serial,
                silent: silent,
                plugins,
            }));
        }
        return [
            {
                input,
                output: this.output,
                serial: serial,
                silent: silent,
                plugins,
            },
        ];
    }
    get configOptions() {
        if (typeof this.cli.flags.config === 'undefined') {
            return [];
        }
        const config = this.cli.flags.config || './typegen.json';
        try {
            const options = this.fileSystem.readJsonSync(config.endsWith('.json') ? config : `${config}.json`);
            if (!options) {
                return [];
            }
            return (Array.isArray(options) ? options : [options]).reduce((expandOptions, currentOptions) => {
                if (Array.isArray(currentOptions.input)) {
                    return expandOptions.concat(currentOptions.input.map(input => (Object.assign({}, currentOptions, { input }))));
                }
                else {
                    return expandOptions.concat(currentOptions);
                }
            }, []);
        }
        catch (err) {
            return [];
        }
    }
    showHelp() {
        this.cli.showHelp();
    }
    showVersion() {
        this.cli.showVersion();
    }
};
tslib_1.__decorate([
    inversify.inject(FileSystem),
    tslib_1.__metadata("design:type", typeof (_a = typeof FileSystem$2 !== "undefined" && FileSystem$2) === "function" ? _a : Object)
], CLI$1.prototype, "fileSystem", void 0);
CLI$1 = tslib_1.__decorate([
    inversify.injectable(),
    tslib_1.__metadata("design:paramtypes", [])
], CLI$1);
var CLI$2 = CLI$1;

/**
 * more:
 * https://github.com/Microsoft/TypeScript/blob/master/src/compiler/scanner.ts
 */
const Codes = {
    A: 0x41,
    Z: 0x5a,
    a: 0x61,
    z: 0x7A,
    _0: 0x30,
    _9: 0x39,
    _: 0x5F,
    $: 0x24,
    maxAsciiCharacter: 0x7F,
};
const unicodeES5IdentifierStart = [170, 170, 181, 181, 186, 186, 192, 214, 216, 246, 248, 705, 710, 721, 736, 740, 748, 748, 750, 750, 880, 884, 886, 887, 890, 893, 902, 902, 904, 906, 908, 908, 910, 929, 931, 1013, 1015, 1153, 1162, 1319, 1329, 1366, 1369, 1369, 1377, 1415, 1488, 1514, 1520, 1522, 1568, 1610, 1646, 1647, 1649, 1747, 1749, 1749, 1765, 1766, 1774, 1775, 1786, 1788, 1791, 1791, 1808, 1808, 1810, 1839, 1869, 1957, 1969, 1969, 1994, 2026, 2036, 2037, 2042, 2042, 2048, 2069, 2074, 2074, 2084, 2084, 2088, 2088, 2112, 2136, 2208, 2208, 2210, 2220, 2308, 2361, 2365, 2365, 2384, 2384, 2392, 2401, 2417, 2423, 2425, 2431, 2437, 2444, 2447, 2448, 2451, 2472, 2474, 2480, 2482, 2482, 2486, 2489, 2493, 2493, 2510, 2510, 2524, 2525, 2527, 2529, 2544, 2545, 2565, 2570, 2575, 2576, 2579, 2600, 2602, 2608, 2610, 2611, 2613, 2614, 2616, 2617, 2649, 2652, 2654, 2654, 2674, 2676, 2693, 2701, 2703, 2705, 2707, 2728, 2730, 2736, 2738, 2739, 2741, 2745, 2749, 2749, 2768, 2768, 2784, 2785, 2821, 2828, 2831, 2832, 2835, 2856, 2858, 2864, 2866, 2867, 2869, 2873, 2877, 2877, 2908, 2909, 2911, 2913, 2929, 2929, 2947, 2947, 2949, 2954, 2958, 2960, 2962, 2965, 2969, 2970, 2972, 2972, 2974, 2975, 2979, 2980, 2984, 2986, 2990, 3001, 3024, 3024, 3077, 3084, 3086, 3088, 3090, 3112, 3114, 3123, 3125, 3129, 3133, 3133, 3160, 3161, 3168, 3169, 3205, 3212, 3214, 3216, 3218, 3240, 3242, 3251, 3253, 3257, 3261, 3261, 3294, 3294, 3296, 3297, 3313, 3314, 3333, 3340, 3342, 3344, 3346, 3386, 3389, 3389, 3406, 3406, 3424, 3425, 3450, 3455, 3461, 3478, 3482, 3505, 3507, 3515, 3517, 3517, 3520, 3526, 3585, 3632, 3634, 3635, 3648, 3654, 3713, 3714, 3716, 3716, 3719, 3720, 3722, 3722, 3725, 3725, 3732, 3735, 3737, 3743, 3745, 3747, 3749, 3749, 3751, 3751, 3754, 3755, 3757, 3760, 3762, 3763, 3773, 3773, 3776, 3780, 3782, 3782, 3804, 3807, 3840, 3840, 3904, 3911, 3913, 3948, 3976, 3980, 4096, 4138, 4159, 4159, 4176, 4181, 4186, 4189, 4193, 4193, 4197, 4198, 4206, 4208, 4213, 4225, 4238, 4238, 4256, 4293, 4295, 4295, 4301, 4301, 4304, 4346, 4348, 4680, 4682, 4685, 4688, 4694, 4696, 4696, 4698, 4701, 4704, 4744, 4746, 4749, 4752, 4784, 4786, 4789, 4792, 4798, 4800, 4800, 4802, 4805, 4808, 4822, 4824, 4880, 4882, 4885, 4888, 4954, 4992, 5007, 5024, 5108, 5121, 5740, 5743, 5759, 5761, 5786, 5792, 5866, 5870, 5872, 5888, 5900, 5902, 5905, 5920, 5937, 5952, 5969, 5984, 5996, 5998, 6000, 6016, 6067, 6103, 6103, 6108, 6108, 6176, 6263, 6272, 6312, 6314, 6314, 6320, 6389, 6400, 6428, 6480, 6509, 6512, 6516, 6528, 6571, 6593, 6599, 6656, 6678, 6688, 6740, 6823, 6823, 6917, 6963, 6981, 6987, 7043, 7072, 7086, 7087, 7098, 7141, 7168, 7203, 7245, 7247, 7258, 7293, 7401, 7404, 7406, 7409, 7413, 7414, 7424, 7615, 7680, 7957, 7960, 7965, 7968, 8005, 8008, 8013, 8016, 8023, 8025, 8025, 8027, 8027, 8029, 8029, 8031, 8061, 8064, 8116, 8118, 8124, 8126, 8126, 8130, 8132, 8134, 8140, 8144, 8147, 8150, 8155, 8160, 8172, 8178, 8180, 8182, 8188, 8305, 8305, 8319, 8319, 8336, 8348, 8450, 8450, 8455, 8455, 8458, 8467, 8469, 8469, 8473, 8477, 8484, 8484, 8486, 8486, 8488, 8488, 8490, 8493, 8495, 8505, 8508, 8511, 8517, 8521, 8526, 8526, 8544, 8584, 11264, 11310, 11312, 11358, 11360, 11492, 11499, 11502, 11506, 11507, 11520, 11557, 11559, 11559, 11565, 11565, 11568, 11623, 11631, 11631, 11648, 11670, 11680, 11686, 11688, 11694, 11696, 11702, 11704, 11710, 11712, 11718, 11720, 11726, 11728, 11734, 11736, 11742, 11823, 11823, 12293, 12295, 12321, 12329, 12337, 12341, 12344, 12348, 12353, 12438, 12445, 12447, 12449, 12538, 12540, 12543, 12549, 12589, 12593, 12686, 12704, 12730, 12784, 12799, 13312, 19893, 19968, 40908, 40960, 42124, 42192, 42237, 42240, 42508, 42512, 42527, 42538, 42539, 42560, 42606, 42623, 42647, 42656, 42735, 42775, 42783, 42786, 42888, 42891, 42894, 42896, 42899, 42912, 42922, 43000, 43009, 43011, 43013, 43015, 43018, 43020, 43042, 43072, 43123, 43138, 43187, 43250, 43255, 43259, 43259, 43274, 43301, 43312, 43334, 43360, 43388, 43396, 43442, 43471, 43471, 43520, 43560, 43584, 43586, 43588, 43595, 43616, 43638, 43642, 43642, 43648, 43695, 43697, 43697, 43701, 43702, 43705, 43709, 43712, 43712, 43714, 43714, 43739, 43741, 43744, 43754, 43762, 43764, 43777, 43782, 43785, 43790, 43793, 43798, 43808, 43814, 43816, 43822, 43968, 44002, 44032, 55203, 55216, 55238, 55243, 55291, 63744, 64109, 64112, 64217, 64256, 64262, 64275, 64279, 64285, 64285, 64287, 64296, 64298, 64310, 64312, 64316, 64318, 64318, 64320, 64321, 64323, 64324, 64326, 64433, 64467, 64829, 64848, 64911, 64914, 64967, 65008, 65019, 65136, 65140, 65142, 65276, 65313, 65338, 65345, 65370, 65382, 65470, 65474, 65479, 65482, 65487, 65490, 65495, 65498, 65500];
const unicodeES5IdentifierPart = [170, 170, 181, 181, 186, 186, 192, 214, 216, 246, 248, 705, 710, 721, 736, 740, 748, 748, 750, 750, 768, 884, 886, 887, 890, 893, 902, 902, 904, 906, 908, 908, 910, 929, 931, 1013, 1015, 1153, 1155, 1159, 1162, 1319, 1329, 1366, 1369, 1369, 1377, 1415, 1425, 1469, 1471, 1471, 1473, 1474, 1476, 1477, 1479, 1479, 1488, 1514, 1520, 1522, 1552, 1562, 1568, 1641, 1646, 1747, 1749, 1756, 1759, 1768, 1770, 1788, 1791, 1791, 1808, 1866, 1869, 1969, 1984, 2037, 2042, 2042, 2048, 2093, 2112, 2139, 2208, 2208, 2210, 2220, 2276, 2302, 2304, 2403, 2406, 2415, 2417, 2423, 2425, 2431, 2433, 2435, 2437, 2444, 2447, 2448, 2451, 2472, 2474, 2480, 2482, 2482, 2486, 2489, 2492, 2500, 2503, 2504, 2507, 2510, 2519, 2519, 2524, 2525, 2527, 2531, 2534, 2545, 2561, 2563, 2565, 2570, 2575, 2576, 2579, 2600, 2602, 2608, 2610, 2611, 2613, 2614, 2616, 2617, 2620, 2620, 2622, 2626, 2631, 2632, 2635, 2637, 2641, 2641, 2649, 2652, 2654, 2654, 2662, 2677, 2689, 2691, 2693, 2701, 2703, 2705, 2707, 2728, 2730, 2736, 2738, 2739, 2741, 2745, 2748, 2757, 2759, 2761, 2763, 2765, 2768, 2768, 2784, 2787, 2790, 2799, 2817, 2819, 2821, 2828, 2831, 2832, 2835, 2856, 2858, 2864, 2866, 2867, 2869, 2873, 2876, 2884, 2887, 2888, 2891, 2893, 2902, 2903, 2908, 2909, 2911, 2915, 2918, 2927, 2929, 2929, 2946, 2947, 2949, 2954, 2958, 2960, 2962, 2965, 2969, 2970, 2972, 2972, 2974, 2975, 2979, 2980, 2984, 2986, 2990, 3001, 3006, 3010, 3014, 3016, 3018, 3021, 3024, 3024, 3031, 3031, 3046, 3055, 3073, 3075, 3077, 3084, 3086, 3088, 3090, 3112, 3114, 3123, 3125, 3129, 3133, 3140, 3142, 3144, 3146, 3149, 3157, 3158, 3160, 3161, 3168, 3171, 3174, 3183, 3202, 3203, 3205, 3212, 3214, 3216, 3218, 3240, 3242, 3251, 3253, 3257, 3260, 3268, 3270, 3272, 3274, 3277, 3285, 3286, 3294, 3294, 3296, 3299, 3302, 3311, 3313, 3314, 3330, 3331, 3333, 3340, 3342, 3344, 3346, 3386, 3389, 3396, 3398, 3400, 3402, 3406, 3415, 3415, 3424, 3427, 3430, 3439, 3450, 3455, 3458, 3459, 3461, 3478, 3482, 3505, 3507, 3515, 3517, 3517, 3520, 3526, 3530, 3530, 3535, 3540, 3542, 3542, 3544, 3551, 3570, 3571, 3585, 3642, 3648, 3662, 3664, 3673, 3713, 3714, 3716, 3716, 3719, 3720, 3722, 3722, 3725, 3725, 3732, 3735, 3737, 3743, 3745, 3747, 3749, 3749, 3751, 3751, 3754, 3755, 3757, 3769, 3771, 3773, 3776, 3780, 3782, 3782, 3784, 3789, 3792, 3801, 3804, 3807, 3840, 3840, 3864, 3865, 3872, 3881, 3893, 3893, 3895, 3895, 3897, 3897, 3902, 3911, 3913, 3948, 3953, 3972, 3974, 3991, 3993, 4028, 4038, 4038, 4096, 4169, 4176, 4253, 4256, 4293, 4295, 4295, 4301, 4301, 4304, 4346, 4348, 4680, 4682, 4685, 4688, 4694, 4696, 4696, 4698, 4701, 4704, 4744, 4746, 4749, 4752, 4784, 4786, 4789, 4792, 4798, 4800, 4800, 4802, 4805, 4808, 4822, 4824, 4880, 4882, 4885, 4888, 4954, 4957, 4959, 4992, 5007, 5024, 5108, 5121, 5740, 5743, 5759, 5761, 5786, 5792, 5866, 5870, 5872, 5888, 5900, 5902, 5908, 5920, 5940, 5952, 5971, 5984, 5996, 5998, 6000, 6002, 6003, 6016, 6099, 6103, 6103, 6108, 6109, 6112, 6121, 6155, 6157, 6160, 6169, 6176, 6263, 6272, 6314, 6320, 6389, 6400, 6428, 6432, 6443, 6448, 6459, 6470, 6509, 6512, 6516, 6528, 6571, 6576, 6601, 6608, 6617, 6656, 6683, 6688, 6750, 6752, 6780, 6783, 6793, 6800, 6809, 6823, 6823, 6912, 6987, 6992, 7001, 7019, 7027, 7040, 7155, 7168, 7223, 7232, 7241, 7245, 7293, 7376, 7378, 7380, 7414, 7424, 7654, 7676, 7957, 7960, 7965, 7968, 8005, 8008, 8013, 8016, 8023, 8025, 8025, 8027, 8027, 8029, 8029, 8031, 8061, 8064, 8116, 8118, 8124, 8126, 8126, 8130, 8132, 8134, 8140, 8144, 8147, 8150, 8155, 8160, 8172, 8178, 8180, 8182, 8188, 8204, 8205, 8255, 8256, 8276, 8276, 8305, 8305, 8319, 8319, 8336, 8348, 8400, 8412, 8417, 8417, 8421, 8432, 8450, 8450, 8455, 8455, 8458, 8467, 8469, 8469, 8473, 8477, 8484, 8484, 8486, 8486, 8488, 8488, 8490, 8493, 8495, 8505, 8508, 8511, 8517, 8521, 8526, 8526, 8544, 8584, 11264, 11310, 11312, 11358, 11360, 11492, 11499, 11507, 11520, 11557, 11559, 11559, 11565, 11565, 11568, 11623, 11631, 11631, 11647, 11670, 11680, 11686, 11688, 11694, 11696, 11702, 11704, 11710, 11712, 11718, 11720, 11726, 11728, 11734, 11736, 11742, 11744, 11775, 11823, 11823, 12293, 12295, 12321, 12335, 12337, 12341, 12344, 12348, 12353, 12438, 12441, 12442, 12445, 12447, 12449, 12538, 12540, 12543, 12549, 12589, 12593, 12686, 12704, 12730, 12784, 12799, 13312, 19893, 19968, 40908, 40960, 42124, 42192, 42237, 42240, 42508, 42512, 42539, 42560, 42607, 42612, 42621, 42623, 42647, 42655, 42737, 42775, 42783, 42786, 42888, 42891, 42894, 42896, 42899, 42912, 42922, 43000, 43047, 43072, 43123, 43136, 43204, 43216, 43225, 43232, 43255, 43259, 43259, 43264, 43309, 43312, 43347, 43360, 43388, 43392, 43456, 43471, 43481, 43520, 43574, 43584, 43597, 43600, 43609, 43616, 43638, 43642, 43643, 43648, 43714, 43739, 43741, 43744, 43759, 43762, 43766, 43777, 43782, 43785, 43790, 43793, 43798, 43808, 43814, 43816, 43822, 43968, 44010, 44012, 44013, 44016, 44025, 44032, 55203, 55216, 55238, 55243, 55291, 63744, 64109, 64112, 64217, 64256, 64262, 64275, 64279, 64285, 64296, 64298, 64310, 64312, 64316, 64318, 64318, 64320, 64321, 64323, 64324, 64326, 64433, 64467, 64829, 64848, 64911, 64914, 64967, 65008, 65019, 65024, 65039, 65056, 65062, 65075, 65076, 65101, 65103, 65136, 65140, 65142, 65276, 65296, 65305, 65313, 65338, 65343, 65343, 65345, 65370, 65382, 65470, 65474, 65479, 65482, 65487, 65490, 65495, 65498, 65500];
let IdentifierUtils$1 = class IdentifierUtils {
    transform(text) {
        const len = text.length;
        let identifier = '';
        let startIndex = -1;
        let endIndex = -1;
        for (let i = 0; i < len; i += 1) {
            if (startIndex === -1) {
                if (this.isStart(text[i].charCodeAt(0))) {
                    startIndex = i;
                }
            }
            else {
                if (this.isPart(text[i].charCodeAt(0))) {
                    endIndex = endIndex === -1 ? i : endIndex + 1;
                }
                else {
                    identifier += text.substring(startIndex, endIndex + 1);
                    startIndex = -1;
                    endIndex = -1;
                }
            }
        }
        if (startIndex !== -1) {
            identifier += text.substring(startIndex, endIndex + 1);
        }
        return identifier;
    }
    isStart(ch) {
        return ch >= Codes.A && ch <= Codes.Z || ch >= Codes.a && ch <= Codes.z ||
            ch === Codes.$ || ch === Codes._ ||
            ch > Codes.maxAsciiCharacter && this.isUnicodeIdentifierStart(ch);
    }
    isPart(ch) {
        return ch >= Codes.A && ch <= Codes.Z || ch >= Codes.a && ch <= Codes.z ||
            ch >= Codes._0 && ch <= Codes._9 || ch === Codes.$ || ch === Codes._ ||
            ch > Codes.maxAsciiCharacter && this.isUnicodeIdentifierPart(ch);
    }
    isUnicodeIdentifierStart(code) {
        return this.lookupInUnicodeMap(code, unicodeES5IdentifierStart);
    }
    isUnicodeIdentifierPart(code) {
        return this.lookupInUnicodeMap(code, unicodeES5IdentifierPart);
    }
    lookupInUnicodeMap(code, map) {
        // Bail out quickly if it couldn't possibly be in the map.
        if (code < map[0]) {
            return false;
        }
        // Perform binary search in one of the Unicode range maps
        let lo = 0;
        let hi = map.length;
        let mid;
        while (lo + 1 < hi) {
            mid = lo + (hi - lo) / 2;
            // mid has to be even to catch a range's beginning
            mid -= mid % 2;
            if (map[mid] <= code && code <= map[mid + 1]) {
                return true;
            }
            if (code < map[mid]) {
                hi = mid;
            }
            else {
                lo = mid + 2;
            }
        }
        return false;
    }
};
IdentifierUtils$1 = tslib_1.__decorate([
    inversify.injectable()
], IdentifierUtils$1);
var IdentifierUtils$2 = IdentifierUtils$1;

let ParameterUtils$1 = class ParameterUtils {
    transform(parameters) {
        return openapiJsonschemaParameters.convertParametersToJSONSchema(parameters);
    }
};
ParameterUtils$1 = tslib_1.__decorate([
    inversify.injectable()
], ParameterUtils$1);
var ParameterUtils$2 = ParameterUtils$1;

var _a$9;
let DefinitionFragment$1 = class DefinitionFragment$$1 extends OasFragment$2 {
    constructor() {
        super(...arguments);
        this.type = FragmentType.Definition;
    }
    get title() {
        return this.identifierUtils.transform(this.document.definitionName());
    }
    get schema() {
        return Object.assign({ title: this.title }, this.modal, { definitions: this.ownerModal.definitions });
    }
    create(definitionSchemaDocument) {
        this.document = definitionSchemaDocument;
        this.document.title = this.title;
    }
};
tslib_1.__decorate([
    inversify.inject(IdentifierUtils),
    tslib_1.__metadata("design:type", typeof (_a$9 = typeof IdentifierUtils$2 !== "undefined" && IdentifierUtils$2) === "function" ? _a$9 : Object)
], DefinitionFragment$1.prototype, "identifierUtils", void 0);
DefinitionFragment$1 = tslib_1.__decorate([
    inversify.injectable()
], DefinitionFragment$1);
var DefinitionFragment$2 = DefinitionFragment$1;

let OperationFragment$1 = class OperationFragment extends OasFragment$2 {
    constructor() {
        super(...arguments);
        this.type = FragmentType.Operation;
    }
    get id() {
        return this.document.operationId;
    }
    get introduction() {
        const { deprecated, summary, description, } = this.document;
        return `${summary || describe} ${summary && description ? '-' : ''} ${description || ''}`.trim();
    }
    get deprecated() {
        return this.document.deprecated;
    }
    get method() {
        return this.document.method().toUpperCase();
    }
    get path() {
        return this.document.parent().path();
    }
    get title() {
        const t = `${this.document.operationId}Request`;
        return `${t.charAt(0).toUpperCase()}${t.substr(1)}`;
    }
    get parameters() {
        return this.document.parameters || [];
    }
    get responseStatusCodes() {
        return this.document.responses.responseStatusCodes() || [];
    }
    get responseSuccessCodes() {
        return this.responseStatusCodes.filter(code => code >= '200' && code <= '299');
    }
    get responseFailCodes() {
        return this.responseStatusCodes.filter(code => code < '200' || code > '299');
    }
};
OperationFragment$1 = tslib_1.__decorate([
    inversify.injectable()
], OperationFragment$1);
var OperationFragment$2 = OperationFragment$1;

var _a$10;
let OperationRequestFragment$1 = class OperationRequestFragment$$1 extends OperationFragment$2 {
    constructor() {
        super(...arguments);
        this.type = FragmentType.OperationRequest;
    }
    get responseStatusCodes() {
        return this.document.responses.responseStatusCodes() || [];
    }
    get schema() {
        const { parameters } = this.modal;
        const { definitions } = this.ownerModal;
        if (parameters && parameters.length) {
            const properties = this.parameterUtils.transform(parameters);
            return {
                type: 'object',
                title: this.title,
                properties,
                required: Object.keys(properties),
                additionalProperties: false,
                definitions,
            };
        }
        return {
            type: 'null',
            title: this.title,
        };
    }
};
tslib_1.__decorate([
    inversify.inject(ParameterUtils),
    tslib_1.__metadata("design:type", typeof (_a$10 = typeof ParameterUtils$2 !== "undefined" && ParameterUtils$2) === "function" ? _a$10 : Object)
], OperationRequestFragment$1.prototype, "parameterUtils", void 0);
OperationRequestFragment$1 = tslib_1.__decorate([
    inversify.injectable()
], OperationRequestFragment$1);
var OperationRequestFragment$2 = OperationRequestFragment$1;

let OperationResponseFragment$1 = class OperationResponseFragment$$1 extends OperationFragment$2 {
    constructor() {
        super(...arguments);
        this.type = FragmentType.OperationResponse;
    }
    get title() {
        return `${this.document.operationId}Response`;
    }
    get schema() {
        const { definitions = {} } = this.ownerModal;
        const responseCode = this.document.responses.responseStatusCodes().map(code => parseInt(code, 10)).find(code => code >= 200 && code <= 299);
        const responseSchema = responseCode
            ? this.oasDocument.write(this.document.responses.response(String(responseCode))).schema
            : undefined;
        if (responseSchema) {
            return Object.assign({ title: this.title }, responseSchema, { definitions });
        }
        return {
            type: 'null',
            title: this.title,
        };
    }
};
tslib_1.__decorate([
    inversify.inject(OasDocument),
    tslib_1.__metadata("design:type", Object)
], OperationResponseFragment$1.prototype, "oasDocument", void 0);
OperationResponseFragment$1 = tslib_1.__decorate([
    inversify.injectable()
], OperationResponseFragment$1);
var OperationResponseFragment$2 = OperationResponseFragment$1;

let EnhanceTypeNamePlugin$1 = class EnhanceTypeNamePlugin {
    constructor() {
        this.name = 'EnhanceTypeNamePlugin';
        this.typeNameMap = new Map();
    }
    apply(factory) {
        factory.hooks.createDefinitionFragment.tap(this.name, this.handleCreateDefinitionFragment.bind(this));
        factory.hooks.generate.tap(this.name, this.handleGenerate.bind(this));
    }
    handleCreateDefinitionFragment(definitionFragment) {
        const safeTitle = `MD${md5(definitionFragment.title).toUpperCase()}`;
        this.typeNameMap.set(safeTitle, definitionFragment.title);
        definitionFragment.document.title = safeTitle;
    }
    handleGenerate(code) {
        Array.from(this.typeNameMap.entries()).map(([key, value]) => {
            code = code.replace(new RegExp(key, 'gm'), value);
        });
        return code;
    }
};
EnhanceTypeNamePlugin$1 = tslib_1.__decorate([
    inversify.injectable()
], EnhanceTypeNamePlugin$1);
var EnhanceTypeNamePlugin$2 = EnhanceTypeNamePlugin$1;

let FixRefPlugin$1 = class FixRefPlugin extends OasVisitor$1 {
    constructor() {
        super(...arguments);
        this.name = 'FixRefPlugin';
        this.refs = new Set();
    }
    apply(factory) {
        factory.hooks.createDocument.tap(this.name, this.handleCreateDocument.bind(this));
    }
    handleCreateDocument(document) {
        document.visit(this);
        const refs = new Set(Array.from(this.refs.values()));
        refs.forEach(ref => {
            if (!/#\//.test(ref)) {
                return;
            }
            if (document.resolve(new oaiTsCore.OasNodePath(ref.substr(1)))) {
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
    visitSchema(schema) {
        if (schema.$ref) {
            this.refs.add(schema.$ref);
        }
    }
    visitPropertySchema(schema) {
        this.visitSchema(schema);
    }
    visitSchemaDefinition(schema) {
        this.visitSchema(schema);
    }
    visitAllOfSchema(schema) {
        this.visitSchema(schema);
    }
    visitItemsSchema(schema) {
        this.visitSchema(schema);
    }
    visitAdditionalPropertiesSchema(schema) {
        this.visitSchema(schema);
    }
};
FixRefPlugin$1 = tslib_1.__decorate([
    inversify.injectable()
], FixRefPlugin$1);
var FixRefPlugin$2 = FixRefPlugin$1;

let Spinner$1 = class Spinner {
    constructor() {
        this.spinner = ora('Loading unicorns');
    }
    start(text) {
        this.spinner.start(text);
    }
    stop() {
        this.spinner.stop();
    }
    refresh(text) {
        this.spinner.text = text;
    }
    succeed(text) {
        this.spinner.succeed(text);
    }
    fail(text) {
        this.spinner.fail(text);
    }
    warn(text) {
        this.spinner.warn(text);
    }
    info(text) {
        this.spinner.info(text);
    }
};
Spinner$1 = tslib_1.__decorate([
    inversify.injectable()
], Spinner$1);
var Spinner$2 = Spinner$1;

var _a$11;
let LogPlugin$1 = class LogPlugin$$1 {
    constructor() {
        this.name = 'LogPlugin';
    }
    apply(factory) {
        factory.hooks.applyPlugins.tap(this.name, this.handleStart.bind(this, 'apply plugins'));
        factory.hooks.options.tap(this.name, this.handleProcess.bind(this, 'loading options'));
        factory.hooks.createDocument.tap(this.name, this.handleProcess.bind(this, 'creating oai document instance'));
        factory.hooks.createDefinitionFragment.tap(this.name, definitionFragment => this.handleProcess(`creating definition fragment: ${definitionFragment.title}`));
        factory.hooks.createRequestOperationFragment.tap(this.name, requestOperationFragment => this.handleProcess(`creating request operation fragment: ${requestOperationFragment.title}`));
        factory.hooks.createResponseOperationFragment.tap(this.name, responseOperationFragment => this.handleProcess(`creating response operation fragment: ${responseOperationFragment.title}`));
        factory.hooks.generate.tap(this.name, this.handleStop.bind(this, 'generating code'));
    }
    handleProcess(text) {
        this.spinner.refresh(text);
    }
    handleStart(text) {
        this.spinner.start(text);
    }
    handleStop(text) {
        this.spinner.refresh(text);
        this.spinner.stop();
    }
};
tslib_1.__decorate([
    inversify.inject(Spinner),
    tslib_1.__metadata("design:type", typeof (_a$11 = typeof Spinner$2 !== "undefined" && Spinner$2) === "function" ? _a$11 : Object)
], LogPlugin$1.prototype, "spinner", void 0);
LogPlugin$1 = tslib_1.__decorate([
    inversify.injectable()
], LogPlugin$1);
var LogPlugin$2 = LogPlugin$1;

let Network$1 = class Network {
    downloadJSON(url) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return this.download(url);
        });
    }
    downloadYAML(url) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return YAML.parse(yield this.download(url));
        });
    }
    download(url) {
        return axios.get(url).then(result => result.data);
    }
};
Network$1 = tslib_1.__decorate([
    inversify.injectable()
], Network$1);
var Network$2 = Network$1;

let Timer$1 = class Timer {
    constructor() {
        this.records = new Map();
    }
    start(id) {
        this.records.set(id, {
            id,
            startTimestamp: Date.now(),
            endTimestamp: 0,
        });
    }
    end(id) {
        if (!this.records.has(id)) {
            return;
        }
        this.records.get(id).endTimestamp = Date.now();
    }
    usage(id) {
        if (!this.records.has(id)) {
            return 0;
        }
        const { startTimestamp, endTimestamp, } = this.records.get(id);
        return endTimestamp
            ? endTimestamp - startTimestamp
            : 0;
    }
};
Timer$1 = tslib_1.__decorate([
    inversify.injectable()
], Timer$1);
var Timer$2 = Timer$1;

let ModuleSystem$1 = class ModuleSystem {
    constructor() {
        this.loadingModules = new Set();
    }
    resolve(name, dirname = process.cwd()) {
        try {
            const pathname = resolve$1.sync(name, {
                basedir: dirname,
            });
            return {
                name,
                pathname,
                module: this.require(pathname),
            };
        }
        catch (err) {
            throw new Error(`Plugin ${name} not found relative to ${dirname}`);
        }
    }
    require(name) {
        if (this.loadingModules.has(name)) {
            throw new Error('dependency cycle detected');
        }
        try {
            this.loadingModules.add(name);
            return require(name);
        }
        finally {
            this.loadingModules.delete(name);
        }
    }
};
ModuleSystem$1 = tslib_1.__decorate([
    inversify.injectable()
], ModuleSystem$1);
var ModuleSystem$2 = ModuleSystem$1;

const container = new inversify.Container({
    skipBaseClassChecks: true,
});
inversify.decorate(inversify.injectable(), Map);
// libs
container.bind(Tapable$1).to(Tapable$2);
container.bind(Spinner).to(Spinner$2);
container.bind(PrettierUtils).toConstantValue(new PrettierUtils$2());
container.bind(IdentifierUtils).toConstantValue(new IdentifierUtils$2());
container.bind(JsonSchemaMap).to(JsonSchemaMap$2);
container.bind(JsonSchemaUtils).to(JsonSchemaUtils$2);
container.bind(OasLibraryUtils$1).toConstantValue(new oaiTsCore.OasLibraryUtils());
container.bind(JsDocUtils).to(JsDocUtils$2);
container.bind(ParameterUtils).toConstantValue(new ParameterUtils$2());
// core
container.bind(CLI).to(CLI$2);
container.bind(Factory).to(Factory$2);
container.bind(OasDocument).to(OasDocument$2);
// fragments
container.bind(DefinitionFragment).to(DefinitionFragment$2);
container.bind(OperationFragment).to(OperationFragment$2);
container.bind(OperationRequestFragment).to(OperationRequestFragment$2);
container.bind(OperationResponseFragment).to(OperationResponseFragment$2);
// oas visitors
container.bind(Oas20CompositeVisitor$1).to(oaiTsCore.Oas20CompositeVisitor);
container.bind(OperationVisitor).to(OperationVisitor$2);
container.bind(DefinitionVisitor).to(DefinitionVisitor$2);
// generators
container.bind(TsGenerator).to(TsGenerator$2);
container.bind(JsGenerator).to(JsGenerator$2);
// built-in plugins
container.bind(EnhanceTypeNamePlugin).to(EnhanceTypeNamePlugin$2);
container.bind(FixRefPlugin).to(FixRefPlugin$2);
container.bind(LogPlugin).to(LogPlugin$2);
// maps
container.bind(HookMap).to(Map);
container.bind(OasFragmentMap).to(Map);
// queues
container.bind(AstQueue).to(Queue$1);
// utils
container.bind(Timer).to(Timer$2);
container.bind(Network).to(Network$2);
container.bind(FileSystem).to(FileSystem$2);
container.bind(ModuleSystem).to(ModuleSystem$2);

const factory = container.get(Factory);
const network = container.get(Network);
const fileSystem = container.get(FileSystem);
const moduleSystem = container.get(ModuleSystem);
const cli = container.get(CLI);
function build(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { input, output, silent, plugins, } = options;
        const builtInPlugins = [
            container.get(LogPlugin),
            container.get(EnhanceTypeNamePlugin),
            container.get(FixRefPlugin),
        ];
        const externalPlugins = plugins.map(pluginName => {
            const normalizedPluginName = /^(?:(?:typegen-plugin-)|\.|\/)/i.test(pluginName)
                ? pluginName
                : `typegen-plugin-${pluginName.toLowerCase()}`;
            const { name, pathname, module: ModuleFactory, } = moduleSystem.resolve(normalizedPluginName);
            if (typeof ModuleFactory === 'function') {
                return new ModuleFactory();
            }
            if (typeof ModuleFactory.apply === 'function') {
                return ModuleFactory;
            }
            throw new Error(`${name} from ${pathname} is not a valid plugin`);
        });
        const url = /^(?:http|https)/i.test(input) ? input : '';
        const path$$1 = url ? '' : input;
        let document;
        if (url) {
            if (url.endsWith('.yaml')) {
                document = yield network.downloadYAML(url);
            }
            else {
                document = yield network.downloadJSON(url);
            }
        }
        else {
            if (url.endsWith('.yaml')) {
                document = yield fileSystem.readYaml(path$$1);
            }
            else {
                document = yield fileSystem.readJson(path$$1);
            }
        }
        factory.build(document, builtInPlugins.concat(externalPlugins), {
            input,
            output,
            silent,
        });
    });
}
function run() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { cliOptions, configOptions, } = cli;
        const serialOptions = cliOptions.concat(configOptions).filter(options => options.serial && options.input);
        const parallelOptions = cliOptions.concat(configOptions).filter(options => !options.serial && options.input);
        if (serialOptions.length) {
            for (const options of serialOptions) {
                yield build(options);
            }
        }
        if (parallelOptions.length) {
            yield Promise.all(parallelOptions.map(options => build(options)));
        }
        if (!serialOptions.length && !parallelOptions.length) {
            cli.showHelp();
        }
    });
}
run();
