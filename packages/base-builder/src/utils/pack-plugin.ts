import {
  Compilation,
  Compiler,
} from 'webpack';
import path from 'path';
import { btkFile, btkHash } from '@bricking/toolkit';

import typesPack from './types-pack';
import { getUserOptions } from '../options';
import { getPackageJson } from '../paths';

/**
 * webpack 插件：用于构建 SDK
 */
const PLUGIN_NAME = 'BRICKING_PACK_PLUGIN';
const { Zipper } = btkFile;

export default class BrickingPackPlugin {
  private options = getUserOptions();

  getBundleFilename(compilation: Compilation) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [name, entry] of compilation.entrypoints) {
      if (name === 'bricking') {
        return entry.getFiles().find((filename) => (
          /^base-js-bricking\.\w+\.js$/.test(filename)
                    || filename === 'base-js-bricking.js'
        ));
      }
    }
  }

  apply(compiler: Compiler) {
    const { webpack } = compiler;
    const { RawSource } = webpack.sources;
    const { thisCompilation, ...otherHooks } = this.options.compile.hooks || {}
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
          const publicPath = this.options.publicPath || '/';
          const typesPackPath = typesPack(`${publicPath}${/\/$/ ? '': '/'}${bundleFilename}`);
          const zipper = new Zipper(path.resolve(compiler.outputPath, './pack.zip'));
          Object.entries(assets).forEach(([name, value]) => {
            if (!/\.txt$/.test(name)) {
              const source = value.source();
              const buff = Buffer.isBuffer(source) ? source : Buffer.from(source);
              zipper.add(name, buff);
            }
          });
          const bundlePackBuff = await zipper.finish([]) as Buffer;
          const bundlePackHash = btkHash.getHash(bundlePackBuff);
          const bundlePackName = `bundlePack.${bundlePackHash}.zip`;
          compilation.assets[bundlePackName] = new RawSource(bundlePackBuff);

          const typesPackBuff = await Zipper.tarFolder(typesPackPath, []) as Buffer;
          const typesPackHash = btkHash.getHash(typesPackBuff);
          const typesPackName = `typesPack.${typesPackHash}.tgz`;
          compilation.assets[typesPackName] = new RawSource(typesPackBuff);
          const { name, version, description = '', author = '',dependencies, peerDependencies } = getPackageJson();
          const infoJson = JSON.stringify({
            name,
            version,
            author,
            description,
            dependencies,
            peerDependencies,
            publicPath,
            bundle: bundleFilename,
            typesPack: typesPackName,
            bundlePack: bundlePackName,
          }, null, '\t');
          compilation.assets['package.json'] = new RawSource(infoJson);

          callback();
        },
      );
    });
    Object.entries(otherHooks).forEach(([hookName, callback]) => {
      if (compiler.hooks[hookName]) {
        if (compiler.hooks[hookName].tapAsync) {
          compiler.hooks[hookName].tapAsync(PLUGIN_NAME, async (...args) => {
            await callback(...args);
          })
        } else if (compiler.hooks[hookName].tap) {
          compiler.hooks[hookName].tapAsync(PLUGIN_NAME, (...args) => {
            callback(...args);
          })
        }
      }
    })
  }
}
