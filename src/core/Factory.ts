import { GeneratorOptions } from '@/core/Generator';
import JsGenerator from '@/core/generators/JsGenerator';
import TsGenerator from '@/core/generators/TsGenerator';
import OasDocument from '@/core/libs/OasDocument';
import PrettierUtils from '@/core/libs/PrettierUtils';
import Tapable from '@/core/libs/Tapable';
import DefinitionFragment from '@/core/oas-fragments/DefinitionFragment';
import OperationRequestFragment from '@/core/oas-fragments/OperationRequestFragment';
import OperationResponseFragment from '@/core/oas-fragments/OperationResponseFragment';
import DefinitionVisitor from '@/core/oas-visitors/DefinitionVisitor';
import OperationVisitor from '@/core/oas-visitors/OperationVisitor';
import Plugin from '@/core/Plugin';
import * as identifier from '@/identifier';
import FileSystem from '@/util/FileSystem';
import { inject, injectable } from 'inversify';
import { OpenAPIV2 } from 'openapi-types';
import { Options as PrettierOptions } from 'prettier';
import { AsyncParallelHook, AsyncSeriesHook, AsyncSeriesWaterfallHook } from 'tapable';

export interface FactoryOutputOptions {
  path?: string;
  format?: 'es'|'cjs';
  language?: 'ts'|'js'|'dts';
  intro?: string;
  outro?: string;
}

export interface FactoryOptions {
  input?: string;
  output?: FactoryOutputOptions;
  silent?: boolean;
  serial?: boolean;
  plugins?: Array<Plugin>;
  prettier?: PrettierOptions;
}

export type FactoryOptionsRequired = typeof DEFAULT_OPTIONS;

export const DEFAULT_OUTPUT_OPTIONS: Required<FactoryOutputOptions> = {
  path: '',
  format: 'es',
  language: 'js',
  intro: '',
  outro: '',
};

export const DEFAULT_PRETTIER_OPTIONS: PrettierOptions = {
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  bracketSpacing: false,
};

export const DEFAULT_OPTIONS = {
  input: '',
  output: DEFAULT_OUTPUT_OPTIONS as Required<FactoryOutputOptions>,
  silent: false,
  plugins: [] as Array<Plugin>,
  prettier: DEFAULT_PRETTIER_OPTIONS,
};

@injectable()
class Factory extends Tapable {
  public hooks = {
    applyPlugins: new AsyncSeriesHook<Array<Plugin>>(['plugins']),
    options: new AsyncParallelHook<FactoryOptions>(['options']),
    mergeOptions: new AsyncParallelHook<FactoryOptionsRequired>(['mergedOptions']),
    createDocument: new AsyncSeriesHook<OasDocument>(['document']),
    createDefinitionFragment: new AsyncSeriesHook<DefinitionFragment>(['definitionFragment']),
    createRequestOperationFragment: new AsyncSeriesHook<OperationRequestFragment>(['operationRequestFragment']),
    createResponseOperationFragment: new AsyncSeriesHook<OperationResponseFragment>(['operationResponseFragment']),
    createGenerator: new AsyncSeriesHook<JsGenerator|TsGenerator, GeneratorOptions>(['code', 'options']),
    generate: new AsyncSeriesWaterfallHook<string, GeneratorOptions>(['string', 'options']),
    write: new AsyncParallelHook<FactoryOptionsRequired>(['options', 'code']),
  };

  @inject(identifier.OasDocument) private oasDocument: OasDocument;
  @inject(identifier.OperationVisitor) private operationVisitor: OperationVisitor;
  @inject(identifier.DefinitionVisitor) private definitionVisitor: DefinitionVisitor;
  @inject(identifier.TsGenerator) private tsGenerator: TsGenerator;
  @inject(identifier.JsGenerator) private jsGenerator: JsGenerator;
  @inject(identifier.PrettierUtils) private prettierUtils: PrettierUtils;
  @inject(identifier.FileSystem) private fileSystem: FileSystem;

  public constructor() {
    super();
  }

  public async build(document: OpenAPIV2.Document, options?: FactoryOptions);
  public async build(document: OpenAPIV2.Document, plugins?: Array<Plugin>, options?: FactoryOptions);
  public async build(document: OpenAPIV2.Document, plugins?: Array<Plugin>|FactoryOptions, options?: FactoryOptions) {
    // apply plugins and invoke hook
    if (Array.isArray(plugins)) {
      plugins.forEach(plugin => plugin.apply(this));
      await this.hooks.applyPlugins.promise(Array.isArray(plugins) ? plugins : []);
    } else {
      options = plugins;
    }
    await this.hooks.options.promise(options);

    // merge options and invoke hook
    const mergedOptions = this.mergeOptions(options);

    await this.hooks.options.promise(mergedOptions);

    // create oas document use visitors filter out document fragments
    this.oasDocument.create(document);
    await this.hooks.createDocument.promise(this.oasDocument);
    this.oasDocument.visit(this.definitionVisitor);
    this.oasDocument.visit(this.operationVisitor);

    const definitionFragments = Array.from(this.definitionVisitor.definitions.values());
    const requestOperationFragments = Array.from(this.operationVisitor.request.values());
    const responseOperationFragments = Array.from(this.operationVisitor.response.values());

    await Promise.all([
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
    const generateOptions: GeneratorOptions = {
      format: mergedOptions.output.format,
      language: mergedOptions.output.language,
    };
    let code = '';

    switch (mergedOptions.output.language) {
      case 'ts':
        await this.hooks.createGenerator.promise(this.tsGenerator, generateOptions);
        code = await this.tsGenerator.generate(fragments, generateOptions);
        break;
      case 'js':
        await this.hooks.createGenerator.promise(this.jsGenerator, generateOptions);
        code = await this.jsGenerator.generate(fragments, generateOptions);
        break;
      default:
        break;
    }
    code = this.prettierUtils.format([
      mergedOptions.output.intro,
      code,
      mergedOptions.output.outro,
      '\n', // trailing newline
    ].filter(Boolean).join('\n'), mergedOptions.prettier);
    code = await this.hooks.generate.promise(code, generateOptions);
    code = this.prettierUtils.format(code, mergedOptions.prettier);

    // output document or write to stdout
    const {
      path,
    } = mergedOptions.output;

    if (path) {
      await this.hooks.write.promise(mergedOptions, code);
      this.fileSystem.writeFile(path, code);
      if (process.env.NODE_ENV === 'development') {
        this.fileSystem.writeFile(`${path}.json`, JSON.stringify(document, undefined, 2));
      }
    } else if (!mergedOptions.silent) {
      process.stdout.write(code);
    }
  }

  private mergeOptions(options?: FactoryOptions): FactoryOptionsRequired {
    if (!options) {
      return DEFAULT_OPTIONS;
    }
    const output: Required<FactoryOutputOptions> = {
      ...DEFAULT_OUTPUT_OPTIONS,
      ...options.output,
    };
    const prettier: PrettierOptions = {
      ...DEFAULT_PRETTIER_OPTIONS,
      ...options.prettier,
    };

    if (output.language === 'ts') {
      prettier.parser = 'typescript';
    } else {
      prettier.parser = 'babylon';
    }
    return {
      input: options.input || '',
      output,
      silent: options.silent || false,
      plugins: [] as Array<Plugin>,
      prettier,
    };
  }
}

export default Factory;
