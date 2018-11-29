import { DEFAULT_OUTPUT_OPTIONS } from '@/core/Factory';
import * as identifier from '@/identifier';
import FileSystem from '@/util/FileSystem';
import { inject, injectable } from 'inversify';
import meow from 'meow';
import { resolve as resolvePath } from 'path';

export interface ConfigOutputOptions {
  dir?: string;
  file?: string;
  path?: string;
  format?: 'es'|'cjs';
  language?: 'js'|'ts'|'dts';
  intro?: string;
  outro?: string;
}

export interface ConfigOptions {
  input: string|Array<string>;
  output: ConfigOutputOptions;
  serial?: boolean;
  silent?: boolean;
  plugins?: Array<string>;
}

export type ConfigOptionsRequired = typeof DEFAULT_CONFIG_OPTIONS;

export const DEFAULT_CONFIG_OUTPUT_OPTIONS: Required<ConfigOutputOptions> = {
  dir: '',
  file: '',
  path: '',
  format: DEFAULT_OUTPUT_OPTIONS.format,
  language: DEFAULT_OUTPUT_OPTIONS.language,
  intro: DEFAULT_OUTPUT_OPTIONS.intro,
  outro: DEFAULT_OUTPUT_OPTIONS.outro,
};

export const DEFAULT_CONFIG_OPTIONS = {
  input: '',
  output: DEFAULT_CONFIG_OUTPUT_OPTIONS,
  serial: false,
  silent: false,
  plugins: [] as Array<string>,
};

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

@injectable()
class CLI {
  @inject(identifier.FileSystem) private fileSystem: FileSystem;
  private cli: meow.Result;

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
    const {
      dir,
      file,
      language,
      output,
    } = this.cli.flags;
    const ext = language.substr(-2);

    // rule: if provide 'dir' and omit 'output' then create output
    if (!output && dir && file) {
      this.cli.flags.output = resolvePath(dir, file.endsWith(`.${ext}`) ? file : `${file}.${ext}`);
    }
  }

  public get input(): string {
    return this.cli.flags.input;
  }

  public get output() {
    const {
      format,
      language,
      output,
      intro,
      outro,
    } = this.cli.flags;

    return {
      path: output,
      format,
      language,
      intro,
      outro,
    } as Required<ConfigOutputOptions>;
  }

  public get cliOptions(): Array<ConfigOptionsRequired> {
    const {
      input,
      serial,
      silent,
      plugin,
    } = this.cli.flags;
    const plugins: Array<string> = (Array.isArray(plugin) ? plugin : (plugin ? [plugin] : []));

    if (Array.isArray(this.input)) {
      return this.input.map(singleInput => ({
        input: singleInput,
        output: this.output,
        serial: serial as boolean,
        silent: silent as boolean,
        plugins,
      }));
    }
    return [
      {
        input,
        output: this.output,
        serial: serial as boolean,
        silent: silent as boolean,
        plugins,
      },
    ];
  }

  public get configOptions(): Array<ConfigOptionsRequired> {
    if (typeof this.cli.flags.config === 'undefined') {
      return [];
    }

    const config = this.cli.flags.config || './typegen.json';

    try {
      const options: ConfigOptionsRequired|Array<ConfigOptionsRequired> = this.fileSystem.readJsonSync(config.endsWith('.json') ? config : `${config}.json`);

      if (!options) {
        return [];
      }
      return (Array.isArray(options) ? options : [options]).reduce((expandOptions, currentOptions) => {
        if (Array.isArray(currentOptions.input)) {
          return expandOptions.concat(currentOptions.input.map(input => ({
            ...currentOptions,
            input,
          })));
        } else {
          return expandOptions.concat(currentOptions);
        }
      }, [] as Array<ConfigOptionsRequired>);
    } catch (err) {
      return [];
    }
  }

  public showHelp() {
    this.cli.showHelp();
  }

  public showVersion() {
    this.cli.showVersion();
  }
}

export default CLI;
