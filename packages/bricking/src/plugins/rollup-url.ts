/**
 * 处理 js 模块中的静态资源引用, 使用相对路径引用
 * refer: https://github.com/rollup/plugins/blob/master/packages/url/src/index.js
 */
import fs from 'fs';
import path from 'path';
import util from 'util';
import { btkFunc, btkHash } from '@bricking/toolkit';
import { createFilter, FilterPattern } from '@rollup/pluginutils';

const mkdir = util.promisify(fs.mkdir);
const fsStatPromise = util.promisify(fs.stat);
const fsReadFilePromise = util.promisify(fs.readFile);
const { posix, sep } = path;
const defaultInclude = ['**/*.svg', '**/*.png', '**/*.jp(e)?g', '**/*.gif', '**/*.webp'];

type UrlOptions = {
  include?: FilterPattern,
  exclude?: FilterPattern,
  limit?: number,
  fileName?: string,
  publicPath?: string,
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
export const AssetsMap = new Map<string, string>();

export default function url(options:UrlOptions = {}) {
  const {
    limit = 14 * 1024,
    include = defaultInclude,
    exclude = [],
    publicPath = '',
    fileName = '[hash][extname]',
  } = options;
  const filter = createFilter(include, exclude);

  return {
    name: 'bricking-url',
    load(id: string) {
      if (!filter(id)) {
        return null;
      }
      return Promise.all([fsStatPromise(id), fsReadFilePromise(id)]).then(([stats, buffer]) => {
        if ((limit && stats.size > limit) || limit === 0) {
          const cachePath = AssetsMap.get(id);
          if (cachePath) {
            return getCode(cachePath, publicPath);
          }
          const hash = btkHash.getHash(buffer, id);
          const ext = path.extname(id);
          const name = path.basename(id, ext);

          const outputFileName = fileName
            .replace(/\[hash\]/g, hash)
            .replace(/\[extname\]/g, ext)
            .replace(/\[name\]/g, name);
          AssetsMap.set(id, outputFileName);
          return getCode(outputFileName, publicPath);
        }
        return `export default "${btkFunc.getDataUrl(id, buffer)}"`;
      });
    },
    generateBundle: async function write(outputOptions) {
      if (AssetsMap.size === 0) return;
      const base = outputOptions.dir || path.dirname(outputOptions.file);
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
}
