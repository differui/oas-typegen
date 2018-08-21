import OasFragment, { DocumentType } from '@/core/OasFragment';
import { injectable } from 'inversify';
import { JSONSchema4 } from 'json-schema';
import { AST } from 'json-schema-to-typescript/dist/src/types/AST';
import { AsyncSeriesHook, Hook } from 'tapable';

export interface GeneratorOptions {
  helper: string;
  helperName: string;
  format: 'es'|'cjs';
}

export interface GeneratorHooks {
  [k: string]: Hook;
}

@injectable()
abstract class Generator {
  public hooks: GeneratorHooks = {
    createSchema: new AsyncSeriesHook<JSONSchema4>(['schema']),
    parse: new AsyncSeriesHook<AST>(['ast']),
    generate: new AsyncSeriesHook<string>(['code']),
  };

  public abstract async generate(fragments: Array<OasFragment<DocumentType>>, options: GeneratorOptions): Promise<string>;
}

export default Generator;
