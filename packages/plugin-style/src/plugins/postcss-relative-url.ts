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
type PostcssRelativeUrlOptions = {
    /**
     * Css 文件输出目录(绝对路径)
     */
    cssOutput: string;
    /**
     * js 文件输出目录(项目输出目录)
     */
    baseOutput: string;
    /**
     * 小于 limit 的文件转化为 base64
     */
    limit?: number;
    /**
     * 文件名称模块字符串
     * @default `[hash][extname]`
     */
    filename?: string;
    /**
     * 查找文件的特定目录
     */
    loadPaths?: string[];
    AssetsMap: Map<string, string>;
    getDataUrl: (id: string, buffer: Buffer) => string;
}

const WITH_QUOTES = /^['"]/;

const URL_PATTERNS_G = [
  /(url\(\s*['"]?)([^"')]+)(["']?\s*\))/g,
  /(AlphaImageLoader\(\s*src=['"]?)([^"')]+)(["'])/g,
];
const URL_PATTERNS = [
  /(url\(\s*['"]?)([^"')]+)(["']?\s*\))/,
  /(AlphaImageLoader\(\s*src=['"]?)([^"')]+)(["'])/,
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
  // 寻找绝对路径
  loadPaths.some((base) => {
    const _absolutePath = path.resolve(base, pathname || '');
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
  baseOutput,
  AssetsMap,
  getDataUrl,
}) => {
  // 获取资源信息，绝对路径、search 、hash
  const { absolutePath, search, hash } = getAssetInfo(url, loadPaths);
  if (!absolutePath) {
    // 找不到就抛出错误
    throw new Error(`can not resolve ${url}`);
  }

  const [fstat, buffer] = await Promise.all([
    fs.promises.stat(absolutePath),
    fs.promises.readFile(absolutePath),
  ]);

  // 转为 data url
  if (!((limit && fstat.size > limit) || limit === 0)) {
    return getDataUrl(absolutePath, buffer);
  }
  let outputFileName = AssetsMap.get(absolutePath);
  if (!outputFileName) {
    const fHash = btkHash.getHash(buffer, absolutePath);
    const fExt = path.extname(absolutePath);
    const fName = path.basename(absolutePath, fExt);

    outputFileName = filename
      .replace(/\[hash\]/g, fHash)
      .replace(/\[extname\]/g, fExt)
      .replace(/\[name\]/g, fName) as string;
    AssetsMap.set(absolutePath, outputFileName);
  }
  const rUrl = path.relative(
    cssOutput,
    path.join(baseOutput, outputFileName),
  );
  return `${/\.+\//.test(rUrl) ? '' : './'}${rUrl}${search || ''}${hash || ''}`;
};

const urlDeclProcessor = (options: Required<PostcssRelativeUrlOptions>, result: Result, decl: Declaration) => {
  const promises: Promise<any>[] = [];
  // 源文件地址和目录
  const sourceFilename = decl.source && decl.source.input && decl.source.input.file;
  const sourceDirname = path.dirname(sourceFilename as string);
  // 正则的 g 参数在某些 node 版本中匹配失败
  const patternIndex = URL_PATTERNS.findIndex((item) => item.test(decl.value));
  // 使用 replace 进行多次匹配
  if (patternIndex > -1) {
    decl.value.replace(URL_PATTERNS_G[patternIndex], (matched, before, url, after) => {
      // 仅处理本地文件
      if (isLocalUrl(url)) {
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
  }
  return Promise.all(promises);
};

const postcssRelativeUrl = (options: PostcssRelativeUrlOptions) => {
  // init options
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
postcssRelativeUrl.postcss = true;

export {
  postcssRelativeUrl,
  PostcssRelativeUrlOptions,
};
