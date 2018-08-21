const path = require('path');
const alias = require('rollup-plugin-alias');
const json = require('rollup-plugin-json');
const typescript = require('rollup-plugin-typescript');
const replace = require('rollup-plugin-replace');
const pkg = require('./package.json');

const external = [
  'fs',
  'path',
  'util',
  'json-schema-to-typescript/dist/src/types/AST',
  'json-schema-to-typescript/dist/src/formatter',
  'json-schema-to-typescript/dist/src/generator',
  'json-schema-to-typescript/dist/src/normalizer',
  'json-schema-to-typescript/dist/src/optimizer',
  'json-schema-to-typescript/dist/src/parser',
  'json-schema-to-typescript/dist/src/resolver',
  'json-schema-to-typescript/dist/src/utils',
  'json-schema-to-typescript/dist/src/validator',
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
];

export default {
  entry: './src/index.ts',
  dest: './dest/bundle.js',
  format: 'cjs',
  external,
  plugins: [
    alias({
      resolve: ['.ts'],
      '@': path.resolve(process.cwd(), './src'),
    }),
    json(),
    typescript({
      typescript: require('typescript'),
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
  ],
}
