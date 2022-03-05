/**
 * 路径工具
 */

import path from 'path';

/**
 * normalizePath
 * @param filepath 文件路径
 * @returns
 */
const normalizePath = (filepath: string) => filepath && filepath.replace(/\\+/g, '/');

/**
 * humanlizePath
 * @param filepath 文件路径
 * @returns
 */
const humanlizePath = (filepath: string) => normalizePath(path.relative(process.cwd(), filepath));

/**
 * urlResolve Url 合并
 * @param source 源路径
 * @param subPath 子路径
 * @returns
 */
const urlResolve = (source:string, subPath: string): string => {
  if (!/^http/.test(source)) {
    return path.join(source, subPath);
  }
  // http://www.a.com/path -> http://www.a.com/path/
  if (/\/\w+$/.test(source)) {
    source += '/';
  }
  return new URL(subPath, source).href;
};

export {
  urlResolve,
  normalizePath,
  humanlizePath,
};
