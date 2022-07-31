/**
 * 拷贝资源文件，并将引用地址改成相对于 Css 文件的相对路径
 */
import * as fs from 'fs';
import * as Url from 'url';
import * as path from 'path';
import { btkHash } from '@bricking/toolkit';
import { Declaration, Result } from 'postcss';

/**
 * 将资源文件全部转为相对路径引用的方式
 */
type RelativeUrlOptions = {
    /**
     * Css 文件输出目录(绝对路径)
     */
    cssOutput: string;
    /**
     * 资源文件输出目录(绝对路径)
     */
    assetsOutput?: string;
    /**
     * 小于 limit 的文件转化为 base64
     */
    limit?: number;
    /**
     * 文件名称模块字符串
     * @default `[hash].[ext]`
     */
    filename?: string;
    /**
     * 查找文件的特定目录
     */
    loadPaths?: string[];
}

const WITH_QUOTES = /^['"]/;

const URL_PATTERNS = [
  /(url\(\s*['"]?)([^"')]+)(["']?\s*\))/g,
  /(AlphaImageLoader\(\s*src=['"]?)([^"')]+)(["'])/g,
];

const isLocalUrl = (url) => !(
  url[0] === '#'
    || url.indexOf('%23') === 0
    || url.indexOf('data:') === 0
    || /^[a-z]+:\/\//.test(url)
    || /^\/\//.test(url)
);

/**
 * 获取资源信息
 * @param url
 * @param loadPaths
 * @returns
 */
const getAssetInfo = (url: string, loadPaths: string[]) => {
  const { pathname, search = '', hash = '' } = Url.parse(url, true);
  let absolutePath = '';
  loadPaths.some((base) => {
    // @ts-ignore
    const _absolutePath = path.resolve(base, pathname);
    if (fs.existsSync(_absolutePath)) {
      absolutePath = _absolutePath;
      return true;
    }
    return false;
  });
  return { absolutePath, pathname, search, hash };
};

/**
 * 对文件进行处理，然后返回一个新的路径
 */
const handleFile = async ({
  url,
  limit,
  filename,
  loadPaths,
  cssOutput,
  assetsOutput,
}) => {
  // 获取资源信息，绝对路径、search 、hash
  const { absolutePath, search, hash } = getAssetInfo(url, loadPaths);
  if (!absolutePath) return '';
  const fstat = await fs.promises.stat(absolutePath);
  const fdata = await fs.promises.readFile(absolutePath);
  if (fstat.size < limit) {
    // tranform to base64
    return fdata.toString('base64url');
  }
  // 大于 limit 时，计算 hash -> 使用 hash 命名文件 -> 输出到输出目录 -> 返回相对路径
  const fHash = btkHash.getHash(fdata);
  const fName = filename.replace(/\[hash\]/g, fHash).replace(/\[ext\]/g, path.extname(absolutePath));
  const rUrl = path.join(path.relative(cssOutput, assetsOutput), fName);
  // copy
  await fs.promises.writeFile(path.resolve(assetsOutput, fName), fdata);
  return `${/\.+\//.test(rUrl) ? '' : './'}${rUrl}${search}${hash}`;
};

const urlDeclProcessor = (options: Required<RelativeUrlOptions>, result: Result, decl: Declaration) => {
  const promises = [];
  // 源文件地址和目录
  const sourceFilename = decl.source && decl.source.input && decl.source.input.file;
  // @ts-ignore
  const sourceDirname = path.dirname(sourceFilename);
  const pattern = URL_PATTERNS.find((item) => item.test(decl.value));
  // @ts-ignore 使用 replace 进行多次匹配
  decl.value.replace(pattern, (matched, before, url, after) => {
    if (isLocalUrl(url)) { // 仅处理本地文件
      // @ts-ignore
      promises.push(handleFile({ url, ...options, loadPaths: [sourceDirname, ...options.loadPaths] }).then((newUrl) => {
        if (!newUrl) return matched;
        if (WITH_QUOTES.test(newUrl) && WITH_QUOTES.test(after)) {
          before = before.slice(0, -1);
          after = after.slice(1);
        }
        decl.value = decl.value.replace(matched, `${before}${newUrl}${after}`);
      }));
    }
    return matched;
  });
  return Promise.all(promises);
};

const relativeUrl = (options: RelativeUrlOptions) => {
  // init options
  options.assetsOutput = options.assetsOutput || options.cssOutput;
  options.limit = options.limit ? options.limit : (options.limit === 0 ? Infinity : 1024 * 2);
  options.filename = options.filename || '[hash].[ext]';
  options.loadPaths = (options.loadPaths || []).map((p) => {
    if (!path.isAbsolute(p)) {
      return path.resolve(process.cwd(), p);
    }
    return p;
  });
  return {
    postcssPlugin: 'postcss-url',
    async Once(styles, { result }) {
      const promises = [];
      // 遍历声明语句
      styles.walkDecls((decl) => {
        // 匹配存在 URL 的语句进行处理
        if (URL_PATTERNS.some((urlRE) => urlRE.test(decl.value))) {
          // @ts-ignore
          promises.push(urlDeclProcessor(options as any, result, decl));
        }
      });
      await Promise.all(promises);
    },
  };
};
relativeUrl.postcss = true;

export {
  relativeUrl,
  RelativeUrlOptions as RelativeUrlOption,
};
