/**
 * 处理 js 模块中的静态资源引用, 使用相对路径引用
 * refer: https://github.com/rollup/plugins/blob/master/packages/url/src/index.js
 */
import fs from 'fs';
import path from 'path';
import util from 'util';
import { Plugin } from 'rollup';
import { parse, print, types, visit } from 'recast';
import { btkFunc, btkHash } from '@bricking/toolkit';
import { createFilter, FilterPattern } from '@rollup/pluginutils';

const mkdir = util.promisify(fs.mkdir);
const PLUGIN_NAME = 'bricking-url';
const PREFIX = `\0${PLUGIN_NAME}:::`;

const fsStatPromise = util.promisify(fs.stat);
const fsReadFilePromise = util.promisify(fs.readFile);
const { posix, sep } = path;
const defaultInclude = ['**/*.svg', '**/*.png', '**/*.jp(e)?g', '**/*.gif', '**/*.webp'];

type UrlOptions = {
  include?: FilterPattern;
  exclude?: FilterPattern;
  /**
   * 小于某个尺寸的回自动转base64
   */
  limit?: number;
  /**
   * 文件名模版
   */
  fileName?: string;
  /**
   * 发布地址&路径
   */
  publicPath?: string;
}

function copy(src: string, dest: string) {
  return new Promise<void>((resolve, reject) => {
    if (fs.existsSync(dest)) {
      resolve();
      return;
    }
    const read = fs.createReadStream(src);
    read.on('error', reject);
    const write = fs.createWriteStream(dest);
    write.on('error', reject);
    write.on('finish', resolve);
    read.pipe(write);
  });
}

async function mkDir(dir: string) {
  if (!fs.existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * 共享资源映射表，保证同一份资源只被处理一次
 */
const AssetsMap = new Map<string, string>();

const url = (options:UrlOptions = {}):Plugin => {
  const {
    limit = 14 * 1024,
    include = defaultInclude,
    exclude = [],
    publicPath = '',
    fileName = '[hash][extname]',
  } = options;
  const filter = createFilter(include, exclude);
  const resolveAssets = async (id, buffer) => {
    const cachePath = AssetsMap.get(id);
    if (cachePath) return cachePath;
    // data url
    const fStat = await fsStatPromise(id);
    if (fStat.size < limit) {
      const dataUrl = btkFunc.getDataUrl(id, buffer);
      AssetsMap.set(id, dataUrl);
      return dataUrl;
    }
    // relative url
    const hash = btkHash.getHash(buffer, id);
    const ext = path.extname(id);
    const name = path.basename(id, ext);

    const outputFileName = fileName
      .replace(/\[hash]/g, hash)
      .replace(/\[extname]/g, ext)
      .replace(/\[name]/g, name);
    AssetsMap.set(id, outputFileName);
    return outputFileName;
  };
  return {
    name: PLUGIN_NAME,
    async load(id: string) {
      if (!filter(id)) {
        return null;
      }
      const buff = await fsReadFilePromise(id);
      const outputFileName = await resolveAssets(id, buff);
      // 导出 base64 URL
      if (/^data:/.test(outputFileName)) {
        return `export default "${outputFileName}"`;
      }
      // 导出字符串模板
      return `export default "${PREFIX}${outputFileName}"`;
    },
    async generateBundle(outputOptions, bundle) {
      if (!Object.keys(bundle).length || !AssetsMap.size) return Promise.resolve();
      // 将模板字符串替换成正确的路径或代码
      const isSourceJs = ['commonjs', 'cjs', 'module', 'esm', 'es'].includes(outputOptions.format);
      Object.entries(bundle).forEach(([, chunk]) => {
        if (chunk.type === 'chunk') {
          // 不存在对静态资源的引用时直接跳过
          if (chunk.code.indexOf(PREFIX) === -1) return;
          const ast = parse(chunk.code, {
            parser: {
              parse: (source: string) => this.parse(source, { ecmaVersion: 'latest', locations: true }),
            },
          });
          const bds = types.builders;
          visit(ast, {
            visitLiteral(nodePath) {
              const { value } = nodePath.node;
              if (typeof value !== 'string' || !value.startsWith(PREFIX)) return this.traverse(nodePath);
              const relativeUrl = value
                .replace(PREFIX, (/^\.\//.test(value) ? '' : './'))
                .split(sep)
                .join(posix.sep); // Windows fix - exports must be in unix format
              const replacementNode = isSourceJs
                ? bds.callExpression( // 编译成 npm 包时，使用 require 语句引入图片
                  bds.identifier('require'),
                  [bds.literal(relativeUrl)],
                )
                : ( // 使用网络路径
                  publicPath
                    ? bds.literal(`${publicPath}${relativeUrl.replace(/^\.\//, '')}`)
                    : bds.memberExpression(
                      bds.newExpression(
                        bds.identifier('URL'),
                        [
                          bds.literal(relativeUrl),
                          bds.identifier('import.meta.url'),
                        ],
                      ),
                      bds.identifier('href'),
                    )
                );
              nodePath.replace(replacementNode);
              this.traverse(nodePath);
            },
          });
          // 修改代码 和 source-map
          const result = print(ast);
          chunk.code = result.code;
          chunk.map = require('merge-source-map')(chunk.map, result.map);
        }
      });

      // 资源写入
      const base = outputOptions.dir || path.dirname(outputOptions.file as string);
      await mkDir(base);
      await Promise.all(
        Array.from(AssetsMap.entries()).map(async ([id, output]) => {
          // data url 不需要写入本地
          if (/^data:/.test(output)) return;
          await mkDir(path.join(base, path.dirname(output)));
          return copy(id, path.join(base, output));
        }),
      );
      AssetsMap.clear();
    },
  };
};

export {
  AssetsMap,
};

export default url;
