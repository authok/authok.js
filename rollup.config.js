import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';
import dev from 'rollup-plugin-dev';
import license from 'rollup-plugin-license';
import json from 'rollup-plugin-json';
import { argv } from 'yargs';
import pkg from './package.json';
import createApp from './scripts/oidc-provider';

const isProduction = argv.prod === true;
const OUTPUT_PATH = 'dist';

const getPlugins = prod => [
  resolve({
    browser: true
  }),
  commonjs(),
  json(),
  replace({
    __DEV__: prod ? 'false' : 'true',
    'process.env.NODE_ENV': prod ? "'production'" : "'development'"
  }),
  prod &&
    terser({
      compress: { warnings: false },
      output: { comments: false },
      mangle: false
    }),
  license({
    banner: `
    <%= pkg.name %> v<%= pkg.version %>
    Author: authok
    Date: <%= moment().format('YYYY-MM-DD') %>
    License: MIT
    `
  })
];

const prodFiles = [
  {
    input: 'src/index.js',
    output: [
      {
        name: 'authok',
        file: pkg.main,
        format: 'umd',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true
      }
    ],
    plugins: getPlugins(isProduction)
  },
  {
    input: 'plugins/cordova/index.js',
    output: {
      name: 'CordovaauthokPlugin',
      file: `${OUTPUT_PATH}/cordova-authok-plugin.min.js`,
      format: 'umd',
      sourcemap: true,
      exports: 'default'
    },
    plugins: getPlugins(isProduction)
  }
];
const devFiles = [
  {
    input: 'src/index.js',
    output: {
      name: 'authok',
      file: `${OUTPUT_PATH}/authok.js`,
      format: 'umd',
      sourcemap: isProduction ? false : 'inline',
      exports: 'named'
    },
    plugins: [
      ...getPlugins(false),
      !isProduction &&
        dev({
          dirs: ['dist', 'example'],
          port: 3000,
          extend(app, modules) {
            app.use(modules.mount(createApp({ port: 3000 })));
          }
        })
      // !isProduction && livereload()
    ]
  },
  {
    input: 'plugins/cordova/index.js',
    output: {
      name: 'CordovaauthokPlugin',
      file: `${OUTPUT_PATH}/cordova-authok-plugin.js`,
      format: 'umd',
      sourcemap: isProduction ? false : 'inline',
      exports: 'default'
    },
    plugins: getPlugins(false)
  }
];

const finalFiles = [...devFiles];
if (isProduction) {
  finalFiles.push(...prodFiles);
}
export default finalFiles;
