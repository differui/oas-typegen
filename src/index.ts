import 'reflect-metadata';

import CLI, { ConfigOptionsRequired } from '@/core/CLI';
import Factory from '@/core/Factory';
import Plugin from '@/core/Plugin';
import AxiosPlugin from '@/core/plugins/AxiosPlugin';
import EnhanceTypeNamePlugin from '@/core/plugins/EnhanceTypeNamePlugin';
import FixRefPlugin from '@/core/plugins/FixRefPlugin';
import * as identifier from '@/identifier';
import container from '@/inversify.config';
import FileSystem from '@/util/FileSystem';
import ModuleSystem from '@/util/ModuleSystem';
import Network from '@/util/Network';
import { OpenAPIV2 } from 'openapi-types';

const factory = container.get<Factory>(identifier.Factory);
const network = container.get<Network>(identifier.Network);
const fileSystem = container.get<FileSystem>(identifier.FileSystem);
const moduleSystem = container.get<ModuleSystem>(identifier.ModuleSystem);
const cli = container.get<CLI>(identifier.CLI);

async function build(options: ConfigOptionsRequired) {
  const {
    input,
    output,
    silent,
    plugins,
  } = options;
  const builtInPlugins: Array<Plugin> = [
    container.get<EnhanceTypeNamePlugin>(identifier.EnhanceTypeNamePlugin),
    container.get<FixRefPlugin>(identifier.FixRefPlugin),
    container.get<AxiosPlugin>(identifier.AxiosPlugin),
  ];
  const externalPlugins: Array<Plugin> = plugins.map(pluginName => {
    const normalizedPluginName = /^(?:(?:typegen-plugin-)|\.|\/)/i.test(pluginName)
      ? pluginName
      : `typegen-plugin-${pluginName.toLowerCase()}`;
    const {
      name,
      pathname,
      module: ModuleFactory,
    } = moduleSystem.resolve(normalizedPluginName);

    if (typeof ModuleFactory === 'function') {
      return new ModuleFactory();
    }
    if (typeof ModuleFactory.apply === 'function') {
      return ModuleFactory;
    }
    throw new Error(`${name} from ${pathname} is not a valid plugin`);
  });
  const url = /^(?:http|https)/i.test(input) ? input : '';
  const path = url ? '' : input;
  let document: OpenAPIV2.Document;

  if (url) {
    if (url.endsWith('.yaml')) {
      document = await network.downloadYAML(url);
    } else {
      document = await network.downloadJSON(url);
    }
  } else {
    if (url.endsWith('.yaml')) {
      document = await fileSystem.readYaml(path);
    } else {
      document = await fileSystem.readJson(path);
    }
  }
  factory.build(document, builtInPlugins.concat(externalPlugins), {
    input,
    output,
    silent,
  });
}

async function run() {
  const {
    cliOptions,
    configOptions,
  } = cli;
  const serialOptions = cliOptions.concat(configOptions).filter(options => options.serial && options.input);
  const parallelOptions = cliOptions.concat(configOptions).filter(options => !options.serial && options.input);

  if (serialOptions.length) {
    for (const options of serialOptions) {
      await build(options);
    }
  }
  if (parallelOptions.length) {
    await Promise.all(parallelOptions.map(options => build(options)));
  }
  if (!serialOptions.length && !parallelOptions.length) {
    cli.showHelp();
  }
}

run();
