import {
  Compilation,
  Compiler,
} from 'webpack';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { updatePkgJson, createTypes } from './create-types';
import { getPackageJson, paths } from '../paths';
import { getUserOptions } from '../options';
import { createWebpackInfo } from './create-webpack-info';

/**
 * webpack 插件：用于构建 SDK
 */
const PLUGIN_NAME = 'BRICKING_PACK_PLUGIN';

export default class BrickingPackPlugin {
  private options = getUserOptions();

  getBundleFilename(compilation: Compilation) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [name, entry] of compilation.entrypoints) {
      if (name === 'bricking') {
        return entry.getFiles().find((filename) => (
          /^browser\/base-js-bricking\.\w+\.js$/.test(filename)
                    || filename === 'browser/base-js-bricking.js'
        ));
      }
    }
  }

  apply(compiler: Compiler) {
    const { webpack } = compiler;
    const { thisCompilation, ...otherHooks } = this.options.compile.hooks || {};
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      if (typeof thisCompilation === 'function') {
        thisCompilation(compilation);
      }
      compilation.hooks.processAssets.tapAsync(
        {
          name: PLUGIN_NAME,
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        async (assets, callback) => {
          const bundleFilename = this.getBundleFilename(compilation);
          const publicPath = this.options.publicPath === 'auto' ? '/' : this.options.publicPath;
          const remoteEntry = `${publicPath}${bundleFilename}`;

          const { name, version, description = '', author = '', peerDependencies } = getPackageJson();

          let document = '';
          if (!existsSync(this.options.output)) {
            mkdirSync(this.options.output, { recursive: true });
          }
          if (existsSync(paths.readme)) {
            writeFileSync(
              path.resolve(this.options.output, 'README.md'),
              readFileSync(paths.readme),
            );
            document = `${publicPath}${'README.md'}`;
          }
          writeFileSync(
            path.resolve(this.options.output, 'package.json'),
            JSON.stringify(updatePkgJson({
              name,
              version,
              author,
              description,
              publicPath,
              remoteEntry,
              peerDependencies,
              bundle: `${bundleFilename}`,
              ...(document ? { document } : {}),
            }), null, '\t'),
          );
          createWebpackInfo();
          createTypes().then(() => console.log('createTypes done ~'));
          callback();
        },
      );
    });
    Object.entries(otherHooks).forEach(([hookName, callback]) => {
      if (/emit/i.test(hookName) && compiler.options.mode === 'development') {
        // 开发模式不执行 emit 钩子
        return;
      }
      if (compiler.hooks[hookName]) {
        if (compiler.hooks[hookName].tapAsync) {
          compiler.hooks[hookName].tapAsync(PLUGIN_NAME, async (...args) => {
            const data = await callback(...args);
            return data;
          });
        } else if (compiler.hooks[hookName].tap) {
          compiler.hooks[hookName].tapAsync(PLUGIN_NAME, (...args) => callback(...args));
        }
      }
    });
  }
}
