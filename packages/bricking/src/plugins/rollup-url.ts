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
const PREFIX = `\0${PLUGIN_NAME}:`;

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
  /**
   * - bundle 模式会将文件转化成字符串链接
   * - 非 bundle 模式只会改写文件名和路径
   */
  bundle?: boolean;
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

function getCode(relativePath: string, publicPath = '') {
  // Windows fix - exports must be in unix format
  relativePath = relativePath.split(sep).join(posix.sep);
  if (publicPath && /https?:\/\/.*/.test(publicPath)) {
    return `export default "${publicPath}${relativePath}"`;
  }
  return `export default new URL("${relativePath}", import.meta.url).href`;
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
    bundle = true,
  } = options;
  const filter = createFilter(include, exclude);
  const resolveAssets = (id, buffer) => {
    const cachePath = AssetsMap.get(id);
    if (cachePath) {
      return id;
    }
    const hash = btkHash.getHash(buffer, id);
    const ext = path.extname(id);
    const name = path.basename(id, ext);

    const outputFileName = fileName
      .replace(/\[hash\]/g, hash)
      .replace(/\[extname\]/g, ext)
      .replace(/\[name\]/g, name);
    AssetsMap.set(id, outputFileName);
    return outputFileName;
  };
  return {
    name: PLUGIN_NAME,
    async resolveId(source, importer) {
      if (importer && source.startsWith(PREFIX)) {
        return {
          id: source,
          external: true,
        };
      }
      return null;
    },
    async load(id: string) {
      if (!filter(id)) {
        return null;
      }
      if (!bundle) {
        const buff = await fsReadFilePromise(id);
        const outputFileName = resolveAssets(id, buff);
        return `export * from "${PREFIX + outputFileName}";\n export { default } from "${PREFIX + outputFileName}";\n`;
      }
      return Promise.all([fsStatPromise(id), fsReadFilePromise(id)]).then(([stats, buffer]) => {
        if ((limit && stats.size > limit) || limit === 0) {
          const outputFileName = resolveAssets(id, buffer);
          return getCode(outputFileName, publicPath);
        }
        return `export default "${btkFunc.getDataUrl(id, buffer)}"`;
      });
    },
    async renderChunk(code) {
      if (!bundle) {
        // TODO SourceMap 规则
        const ast = parse(code, {
          parser: {
            parse: (source: string) => this.parse(source, { ecmaVersion: 'latest', locations: true }),
          },
        });
        visit(ast, {
          visitLiteral(nodePath) {
            const { value } = nodePath.node;
            if (typeof value !== 'string' || !value.startsWith(PREFIX)) return this.traverse(nodePath);
            const replacementNode = types.builders.literal(value.replace(PREFIX, ''));
            nodePath.replace(replacementNode);
            this.traverse(nodePath);
          },
        });
        const result = print(ast);
        return {
          code: result.code,
          map: null,
        };
      }
      return null;
    },
    generateBundle: async function write(outputOptions) {
      if (AssetsMap.size === 0) return;
      const base = outputOptions.dir || path.dirname(outputOptions.file as string);
      await mkDir(base);
      await Promise.all(
        Array.from(AssetsMap.entries()).map(async ([id, output]) => {
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
