import 'reflect-metadata';

import CLI from '@/core/CLI';
import Factory from '@/core/Factory';
import * as identifier from '@/identifier';
import container from '@/inversify.config';
import FileSystem from '@/util/FileSystem';
import Network from '@/util/Network';
import { OpenAPIV2 } from 'openapi-types';

const factory = container.get<Factory>(identifier.Factory);
const network = container.get<Network>(identifier.Network);
const fileSystem = container.get<FileSystem>(identifier.FileSystem);
const cli = container.get<CLI>(identifier.CLI);
const {
  url,
  path,
} = cli.inputOptions;

async function run() {
  if (!url && !path) {
    cli.showHelp();
    return;
  }

  let document: OpenAPIV2.Document;

  if (url) {
    if (url.endsWith('.yaml')) {
      document = await network.downloadYAML(url);
    } else {
      document = await network.downloadJSON(url);
    }
  } else {
    if (url.endsWith('.yaml')) {
      document = await fileSystem.readYAML(path);
    } else {
      document = await fileSystem.readJSON(path);
    }
  }

  factory.build(document, cli.plugins, {
    input: cli.inputOptions,
    output: cli.outputOptions,
  });
}

run();
