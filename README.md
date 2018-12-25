oas-typegen [![CircleCI](https://img.shields.io/circleci/project/github/differui/oas-typegen/master.svg?style=flat-square)](https://circleci.com/gh/differui/oas-typegen) [![npm](https://img.shields.io/npm/v/oas-typegen.svg?style=flat-square)](https://www.npmjs.com/package/oas-typegen) [![mit](https://img.shields.io/npm/l/oas-typegen.svg?style=flat-square)](https://opensource.org/licenses/MIT)
=====

> Generate JSDoc/TS/DTS type definitions from OpenAPI document(V2).

## Installation

```bash
npm install oas-typegen -g
```

## Usage

```bash
typegen -i http://petstore.swagger.io/v2/swagger.json
```

## Options

```
Generate TS/JS/DTS type definitions from OpenAPI document (V2).

Usage

$ typegen --input <input> --output <output>

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

$ typegen --input ./swagger.json --output gateway.js --language js
$ typegen --input http://petstore.swagger.io/v2/swagger.json --output petsto-
                  re.js
```

## License

&copy; [differui](mailto:differui@gmail.com)
