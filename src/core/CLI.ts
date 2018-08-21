import { FactoryInputOptions, FactoryOutputOptions } from '@/core/Factory';
import EnhanceTypeNamePlugin from '@/core/plugins/EnhanceTypeNamePlugin';
import FixRefPlugin from '@/core/plugins/FixRefPlugin';
import * as identifier from '@/identifier';
import container from '@/inversify.config';
import { injectable } from 'inversify';
import meow from 'meow';
import { resolve as resolvePath } from 'path';

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

    --slice, -s    Prevent output from being displayed in stdout.
    --version, -v  Print current version number.
    --help, -h     Print this message.

  Examples:

  $ ${NAME} --input ./swagger.json --output gateway.js --language js
  $ ${NAME} --input http://petstore.swagger.io/v2/swagger.json --output petsto-
                    re.js`;

@injectable()
class CLI {
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
        },
        dir: {
          type: 'string',
          alias: 'd',
          default: '',
        },
        name: {
          type: 'string',
          alias: 'n',
          default: 'type-document',
        },
        format: {
          type: 'string',
          default: 'es',
          alias: 'f',
        },
        language: {
          type: 'string',
          default: 'js',
          alias: 'l',
        },
        plugin: {
          type: 'string',
          alias: 'p',
        },
        helper: {
          type: 'string',
          default: '',
        },
        helperName: {
          type: 'string',
          default: 'dispatchRequest',
        },
        intro: {
          type: 'string',
          default: '',
        },
        outro: {
          type: 'string',
          default: '',
        },
        silent: {
          type: 'boolean',
          alias: 's',
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

    const {
      name,
      dir,
      language,
      output,
      helper,
      helperName,
    } = this.cli.flags;

    // rule: if provide 'dir' and omit 'output' then create output
    if (!output && dir) {
      this.cli.flags.output = resolvePath(dir, `${name}.${language.substr(-2)}`);
    }

    // rule: if omit 'helper' then use default helper name
    if (!helper) {
      this.cli.flags.helper = `./${helperName}`;
    }
  }

  public get inputOptions() {
    const {
      name,
      input,
    } = this.cli.flags;
    const isUrl = /^[http|https]/.test(input);

    return {
      url: isUrl ? input : '',
      path: isUrl ? '' : (input ? resolvePath(process.cwd(), input) : ''),
      name,
    } as Required<FactoryInputOptions>;
  }

  public get outputOptions() {
    const {
      format,
      language,
      output,
      intro,
      outro,
      silent,
      helper,
      helperName,
    } = this.cli.flags;

    return {
      path: output,
      format,
      language,
      intro,
      outro,
      silent,
      helper,
      helperName,
    } as Required<FactoryOutputOptions>;
  }

  public get plugins() {
    return [
      container.get<EnhanceTypeNamePlugin>(identifier.EnhanceTypeNamePlugin),
      container.get<FixRefPlugin>(identifier.FixRefPlugin),
    ];
  }

  public showHelp() {
    this.cli.showHelp();
  }

  public showVersion() {
    this.cli.showVersion();
  }
}

export default CLI;
